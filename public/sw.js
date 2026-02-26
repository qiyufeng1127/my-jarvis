const CACHE_NAME = 'manifestos-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 🔧 排除验证API，不让SW干扰
const excludeApi = [
  '/api/baidu-image-recognition',
  '/api/baidu-voice-recognition',
  '/api/verify',
];

// 拦截请求 - 网络优先策略
self.addEventListener('fetch', (event) => {
  // 🔧 验证API直接跳过，不缓存、不处理
  if (excludeApi.some(api => event.request.url.includes(api))) {
    console.log('[SW] 跳过验证API，直接走网络:', event.request.url);
    return; // 不拦截，直接走真实网络
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 检查是否是有效响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // 克隆响应并缓存
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // 网络失败，尝试从缓存获取
        return caches.match(event.request).then((response) => {
          return response || caches.match('/index.html');
        });
      })
  );
});
