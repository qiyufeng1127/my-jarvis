// Service Worker - ADHD Focus PWA v2.2
const CACHE_NAME = 'adhd-focus-v2.2';
const STATIC_CACHE = 'adhd-focus-static-v2.2';
const DYNAMIC_CACHE = 'adhd-focus-dynamic-v2.2';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles/main.css',
    './styles/mobile.css',
    './js/storage.js',
    './js/settings.js',
    './js/ai-service.js',
    './js/canvas.js',
    './js/procrastination.js',
    './js/inefficiency.js',
    './js/value-visualizer.js',
    './js/ai-copilot.js',
    './js/ai-learning.js',
    './js/ai-finance.js',
    './js/ai-prediction.js',
    './js/ai-memory.js',
    './js/ai-memory-panel.js',
    './js/ai-insights-panel.js',
    './js/reward-system.js',
    './js/ai-report.js',
    './js/guidance-system.js',
    './js/task-enhance.js',
    './js/chart-system.js',
    './js/cloud-sync.js',
    './js/mobile-app.js',
    './js/app.js',
    './components/smart-input.html',
    './components/timeline.html',
    './components/memory-bank.html',
    './components/prompt-panel.html',
    './components/game-system.html',
    './components/review-panel.html',
    './manifest.json',
    './icons/tomato.png'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker v2.2...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static assets...');
                // 逐个添加，避免单个失败导致全部失败
                return Promise.allSettled(
                    STATIC_ASSETS.map(url => 
                        cache.add(url).catch(err => {
                            console.warn('[SW] Failed to cache:', url, err);
                        })
                    )
                );
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
    console.log('[SW] Activating Service Worker v2.2...');
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

// 请求拦截 - 网络优先，缓存备用
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 跳过非GET请求
    if (request.method !== 'GET') return;
    
    // 跳过chrome-extension等特殊协议
    if (!url.protocol.startsWith('http')) return;
    
    // Supabase API请求 - 网络优先
    if (url.hostname.includes('supabase.co')) {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    return new Response(JSON.stringify({
                        error: '离线模式',
                        message: '当前处于离线状态，无法连接云服务'
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }
    
    // DeepSeek API请求 - 网络优先
    if (url.hostname.includes('deepseek.com')) {
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
    
    // 外部资源（字体等）- 缓存优先
    if (url.origin !== location.origin) {
        if (url.hostname.includes('fonts.googleapis.com') || 
            url.hostname.includes('fonts.gstatic.com') ||
            url.hostname.includes('cdn.jsdelivr.net')) {
            event.respondWith(
                caches.match(request)
                    .then(cached => {
                        if (cached) return cached;
                        return fetch(request)
                            .then(response => {
                                if (response.ok) {
                                    const clone = response.clone();
                                    caches.open(DYNAMIC_CACHE)
                                        .then(cache => cache.put(request, clone));
                                }
                                return response;
                            })
                            .catch(() => null);
                    })
            );
        }
        return;
    }
    
    // 本地资源 - 网络优先，缓存备用
    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(STATIC_CACHE)
                        .then(cache => cache.put(request, clone));
                }
                return response;
            })
            .catch(() => {
                return caches.match(request)
                    .then(cached => {
                        if (cached) return cached;
                        // 如果是HTML请求，返回首页
                        if (request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('./index.html');
                        }
                        return null;
                    });
            })
    );
});

// 后台同步
self.addEventListener('sync', event => {
    console.log('[SW] Background sync:', event.tag);
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

// 同步数据到云端
async function syncData() {
    console.log('[SW] Syncing data to cloud...');
    // 通知主页面进行同步
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'SYNC_NOW' });
    });
}

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
        icon: './icons/tomato.png',
        badge: './icons/tomato.png',
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
                for (const client of clientList) {
                    if ('focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('./index.html');
                }
            })
    );
});

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
            icon: './icons/tomato.png',
            badge: './icons/tomato.png',
            tag: tag || 'scheduled',
            vibrate: [200, 100, 200],
            requireInteraction: true
        });
    }, delay);
}
