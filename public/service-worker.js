// Service Worker - 增强版（支持后台通知和语音）
const CACHE_NAME = 'manifestos-v2';
const urlsToCache = [
  '/',
  '/index.html',
];

// 安装事件
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ 缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ 缓存失败:', error);
      })
  );
  self.skipWaiting();
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker 激活中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  // 只处理 http/https 请求，忽略 chrome-extension 等协议
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // 不拦截 API 请求，让它们直接通过
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // 不拦截 POST/PUT/DELETE 等非 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 只缓存成功的响应
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(err => {
              console.warn('缓存失败:', err);
            });
          });
        }
        return response;
      })
      .catch(() => {
        // 网络失败时从缓存中获取
        return caches.match(event.request);
      })
  );
});

// 处理通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 通知被点击:', event.notification.tag);
  
  event.notification.close();
  
  // 打开或聚焦应用窗口
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 如果已有窗口打开，聚焦它
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if ('focus' in client) {
            return client.focus();
          }
        }
        // 否则打开新窗口
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// 处理通知关闭事件
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 通知被关闭:', event.notification.tag);
});

// 接收来自主线程的消息（用于后台任务）
self.addEventListener('message', (event) => {
  console.log('📨 收到消息:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
  
  if (event.data && event.data.type === 'SPEAK') {
    // Service Worker 不支持语音播报，需要通知主线程
    event.ports[0].postMessage({
      type: 'SPEAK_REQUEST',
      text: event.data.text
    });
  }
  
  if (event.data && event.data.type === 'START_BACKGROUND_CHECK') {
    console.log('🚀 启动后台任务检查');
    startPeriodicCheck();
  }
});

// 定期同步（后台同步）
self.addEventListener('sync', (event) => {
  console.log('🔄 后台同步:', event.tag);
  
  if (event.tag === 'check-tasks') {
    event.waitUntil(checkTasksAndNotify());
  }
});

// 定期检查任务（每30秒）
let checkInterval = null;

function startPeriodicCheck() {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // 立即执行一次
  checkTasksAndNotify();
  
  // 每30秒检查一次
  checkInterval = setInterval(() => {
    checkTasksAndNotify();
  }, 30000);
  
  console.log('⏰ Service Worker 定期检查已启动（每30秒）');
}

// 检查任务并发送通知
async function checkTasksAndNotify() {
  try {
    console.log('🔍 [Service Worker] 检查任务状态...');
    
    // 通知所有客户端执行检查
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    
    if (clients.length === 0) {
      console.log('⚠️ [Service Worker] 没有活跃的客户端，跳过检查');
      return;
    }
    
    // 向所有客户端发送检查请求
    clients.forEach(client => {
      client.postMessage({
        type: 'CHECK_TASKS_REQUEST'
      });
    });
    
    console.log('✅ [Service Worker] 已通知客户端检查任务');
  } catch (error) {
    console.error('❌ [Service Worker] 后台任务检查失败:', error);
  }
}
