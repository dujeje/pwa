const CACHE_NAME = 'recipe-sharing-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/offline.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).catch(() => {
                    return caches.match('/offline.html');
                });
            })
    );
});


self.addEventListener('sync', event => {
    if (event.tag === 'sync-recipes') {
        event.waitUntil(syncRecipes());
    }
});

async function syncRecipes() {
    const offlineRecipes = JSON.parse(localStorage.getItem('offlineRecipes')) || [];

    for (const recipe of offlineRecipes) {
        await postRecipeToServer(recipe);
    }

    localStorage.removeItem('offlineRecipes');
}

async function postRecipeToServer(recipe) {
    const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipe),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok.');
    }
}

self.addEventListener('sync', event => {
    if (event.tag === 'sync-recipes') {
        event.waitUntil(
            syncRecipes().then(() => {
                fetch('/triggerNotification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Sync complete' })
                });
            })
        );
    }
});