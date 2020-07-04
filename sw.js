importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
	workbox.setConfig({ debug: false });
	workbox.precaching.precacheAndRoute([{
		url: './index.html',
		revision: 'a70611d88d15f27d51ab398659d34d09'
	}, {
		url: './client.js',
		revision: 'f7c2353919f2841c195848a1bc2b0452'
	}]);
	workbox.routing.registerRoute(new workbox.routing.NavigationRoute(workbox.precaching.createHandlerBoundToURL('./index.html')));
	workbox.routing.registerRoute(/\.(js|css)$/, new workbox.strategies.StaleWhileRevalidate({ cacheName: 'libs' }));
	workbox.routing.registerRoute(/\.(?:png|gif|jpg|jpeg|webp|svg|woff2)$/, new workbox.strategies.CacheFirst({
		cacheName: 'images',
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 200,
				maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
			})
		]
	}));
	workbox.routing.registerRoute(/(.*)fonts\.(googleapis|gstatic)\.com(.*)/, new workbox.strategies.CacheFirst({
		cacheName: 'fonts',
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 200,
				maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
			})
		]
	}));
}
