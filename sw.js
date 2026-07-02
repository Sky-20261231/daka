const CACHE = 'dakaApp-v1';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// 接收主线程发来的提醒时间，定时推送通知
let reminderTimer = null;

self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_REMINDER') {
    const { hour, minute } = e.data;
    if (reminderTimer) clearTimeout(reminderTimer);
    scheduleNext(hour, minute);
  }
});

function scheduleNext(hour, minute) {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next - now;
  reminderTimer = setTimeout(() => {
    self.registration.showNotification('打卡提醒', {
      body: '今天的习惯还没打完卡，来打一下吧！',
      icon: './manifest.json',
      badge: './manifest.json',
      tag: 'daka-reminder',
      renotify: true,
      requireInteraction: false
    });
    scheduleNext(hour, minute);
  }, delay);
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow('./index.html');
    })
  );
});
