const CACHE_NAME = 'manifestos-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ 缓存打开失败:', error);
        // 即使缓存失败也继续安装
        return Promise.resolve();
      })
  );
  // 立即激活新的 Service Worker
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .catch((error) => {
        console.error('❌ 清理缓存失败:', error);
        return Promise.resolve();
      })
  );
  // 立即控制所有客户端
  return self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  // 跳过非 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 缓存命中，返回缓存
        if (response) {
          return response;
        }

        // 否则发起网络请求
        return fetch(event.request)
          .then((response) => {
            // 检查是否是有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((error) => {
                console.error('❌ 缓存写入失败:', error);
              });

            return response;
          })
          .catch((error) => {
            console.error('❌ 网络请求失败:', error);
            // 返回离线页面或默认响应
            return new Response('离线模式', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
      .catch((error) => {
        console.error('❌ 缓存匹配失败:', error);
        return fetch(event.request);
      })
  );
});

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('🔄 后台同步数据...');
  // 这里可以添加数据同步逻辑
}

// 推送通知
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'ManifestOS';
  const options = {
    body: data.body || '您有新的通知',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});








