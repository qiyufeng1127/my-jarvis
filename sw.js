// Service Worker - ADHD Focus PWA
const CACHE_NAME = 'adhd-focus-v2.1';
const STATIC_CACHE = 'adhd-focus-static-v2.1';
const DYNAMIC_CACHE = 'adhd-focus-dynamic-v2.1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/js/storage.js',
    '/js/settings.js',
    '/js/ai-service.js',
    '/js/canvas.js',
    '/js/procrastination.js',
    '/js/inefficiency.js',
    '/js/value-visualizer.js',
    '/js/ai-copilot.js',
    '/js/ai-learning.js',
    '/js/ai-finance.js',
    '/js/ai-prediction.js',
    '/js/ai-memory.js',
    '/js/ai-memory-panel.js',
    '/js/ai-insights-panel.js',
    '/js/reward-system.js',
    '/js/ai-report.js',
    '/js/guidance-system.js',
    '/js/app.js',
    '/components/smart-input.html',
    '/components/timeline.html',
    '/components/memory-bank.html',
    '/components/prompt-panel.html',
    '/components/game-system.html',
    '/components/review-panel.html',
    '/manifest.json'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Static assets cached');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[SW] Cache failed:', err);
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                        .map(key => {
                            console.log('[SW] Removing old cache:', key);
                            return caches.delete(key);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// 请求拦截 - 缓存优先策略
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 跳过非同源请求和API请求
    if (url.origin !== location.origin) {
        // 对于外部资源（如字体），使用网络优先
        if (url.hostname.includes('fonts.googleapis.com') || 
            url.hostname.includes('fonts.gstatic.com')) {
            event.respondWith(
                caches.match(request)
                    .then(cached => {
                        if (cached) return cached;
                        return fetch(request)
                            .then(response => {
                                const clone = response.clone();
                                caches.open(DYNAMIC_CACHE)
                                    .then(cache => cache.put(request, clone));
                                return response;
                            });
                    })
            );
        }
        return;
    }
    
    // API请求 - 网络优先
    if (url.pathname.includes('/api/') || url.hostname.includes('api.deepseek.com')) {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    return new Response(JSON.stringify({
                        error: '离线模式',
                        message: '当前处于离线状态，无法连接AI服务'
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }
    
    // 静态资源 - 缓存优先
    event.respondWith(
        caches.match(request)
            .then(cached => {
                if (cached) {
                    // 后台更新缓存
                    fetch(request)
                        .then(response => {
                            if (response.ok) {
                                caches.open(STATIC_CACHE)
                                    .then(cache => cache.put(request, response));
                            }
                        })
                        .catch(() => {});
                    return cached;
                }
                
                // 没有缓存，从网络获取
                return fetch(request)
                    .then(response => {
                        if (!response.ok) return response;
                        
                        const clone = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => cache.put(request, clone));
                        return response;
                    })
                    .catch(() => {
                        // 离线且无缓存时返回离线页面
                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// 后台同步
self.addEventListener('sync', event => {
    console.log('[SW] Background sync:', event.tag);
    if (event.tag === 'sync-tasks') {
        event.waitUntil(syncTasks());
    }
});

// 推送通知
self.addEventListener('push', event => {
    console.log('[SW] Push received:', event);
    
    let data = { title: 'ADHD Focus', body: '你有新的提醒' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'default',
        renotify: true,
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [
            { action: 'open', title: '查看' },
            { action: 'dismiss', title: '忽略' }
        ],
        data: data.data || {}
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 通知点击
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification clicked:', event.action);
    event.notification.close();
    
    if (event.action === 'dismiss') return;
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // 如果已有窗口打开，聚焦它
                for (const client of clientList) {
                    if (client.url.includes('/index.html') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // 否则打开新窗口
                if (clients.openWindow) {
                    return clients.openWindow('/index.html');
                }
            })
    );
});

// 同步任务数据（预留给云同步）
async function syncTasks() {
    // 这里将来可以实现与Supabase的同步
    console.log('[SW] Syncing tasks...');
}

// 消息处理
self.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'SCHEDULE_NOTIFICATION') {
        scheduleNotification(event.data.payload);
    }
});

// 定时通知
function scheduleNotification(payload) {
    const { title, body, delay, tag } = payload;
    
    setTimeout(() => {
        self.registration.showNotification(title, {
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            tag: tag || 'scheduled',
            vibrate: [200, 100, 200],
            requireInteraction: true
        });
    }, delay);
}

