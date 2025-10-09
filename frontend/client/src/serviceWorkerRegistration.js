// sw.js (aka service-worker.js)
/* eslint-disable no-restricted-globals */

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';



// Cache all GET requests (basic)
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate()
);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ SW registered with scope:', registration.scope);

          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('🆕 New content is available; please refresh.');
                } else {
                  console.log('🎉 Content is cached for offline use.');
                }
              }
            };
          };
        })
        .catch(error => {
          console.error('❌ SW registration failed:', error);
        });
    });
  }
}


