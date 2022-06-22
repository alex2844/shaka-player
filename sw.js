importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
	workbox.setConfig({ debug: false });
	workbox.precaching.precacheAndRoute([{
		url: './index.html',
		revision: '653aff0f50f07b07dea725a5c5ec8c22'
	}, {
		url: './client.js',
		revision: '8756827129f0328619292b89a9ab40e4'
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
