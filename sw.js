// 每次修改程式碼，建議可以把 v1 改成 v2，強制瀏覽器判定更新
const CACHE_NAME = 'stock-manager-V3.3.0'; 
const ASSETS = [
  'index.html',
  'manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 🚀 核心修正：放行所有股票報價 API，絕不快取死資料
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // 💡 如果請求包含富果 API 或 Yahoo API，直接走網路，不進入快取攔截
  if (url.includes('api.fugle.tw') || url.includes('finance.yahoo.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // 其餘靜態檔案（如網頁、圖示）維持快取優先，確保離線可用
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
