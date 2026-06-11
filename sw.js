// 🚀 核心更新機制：未來只要你有改過網頁，請順手將這裡的版號改掉（例如 v3 改成 v4）
const CACHE_NAME = 'stock-manager-v3'; 

const ASSETS = [
  'index.html',
  'manifest.json'
];

// 1. 安裝階段：強制跳過等待，不等 App 關閉，立刻讓新版 Service Worker 在背景接管網頁
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting()) // 🚀 強制新版代碼插隊生效
  );
});

// 2. 啟用階段：全自動掃描並「暴力刪除」Google Chrome 本機殘留的舊版本快取
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          // 如果本機快取的名字跟現在最新版號不同，直接當作垃圾清除
          if (key !== CACHE_NAME) {
            console.log('系統已成功自動清除 Google Chrome 舊版本快取:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // 讓新版 Service Worker 立刻全面控制所有開啟的網頁視窗
  );
});

// 3. 抓取階段：放行股票 API 連線，其餘網頁靜態資源走安全快取
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // 完美防禦：凡是股票報價相關 API 請求，絕對不准走快取，直接走真實網路獲取最新報價
  if (url.includes('api.fugle.tw') || url.includes('finance.yahoo.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // 其餘網頁靜態檔案維持快取優先，確保離線可用
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
