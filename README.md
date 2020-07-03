# shaka-player

## Быстрое подключение плеера

#### Подключение
###### Способ 1: iframe
``` html
<iframe src="https://alex2844.github.io/shaka-player/index.html" frameborder="0" allowfullscreen="true" width="500" height="300" loading="lazy"></iframe>
<script>
document.querySelector('iframe').addEventListener('load', function(e) {
	var origin = new URL(e.target.src).origin.replace(/^file\:\/\//, 'null');
	function onmessage(e_) {
		if (e_.origin == origin)
			console.log('_message_', e_.data);
	}
	(new IntersectionObserver(function(entries, observer) {
		window[(entries[0].isIntersecting ? 'addEventListener' : 'removeEventListener')]('message', onmessage);
	})).observe(e.target);
	e.target.contentWindow.postMessage({
		type: 'media_player',
		title: 'Angel One',
		poster: 'https://storage.googleapis.com/shaka-asset-icons/angel_one.webp',
		src: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd'
	}, '*');
});
</script>
```
###### Способ 2: javascript
``` html
<script src="https://alex2844.github.io/shaka-player/client.js"></script>
<div data-shaka-player-cast-receiver-id="7B25EC44" data-shaka-player-container>
	<style>
		[data-shaka-player-container][data-live="true"] .shaka-current-time,
		[data-shaka-player-container][data-live="true"] .shaka-seek-bar-container {
			display: none;
		}
	</style>
	<video controls autoplay data-shaka-player style="width:100%;height:100%;max-width:100vw;max-height:100vh;"></video>
</div>
<script>
	play({
		playlist: [{
			title: 'Angel One',
			poster: 'https://storage.googleapis.com/shaka-asset-icons/angel_one.webp',
			src: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd'
		}]
	});
</script>
```

#### Todo
* Как класс
* Разделить js - player.js, template.js
* Автоочистка кеша спустя ?? дней
* mediaSession stop?
* Сократить код
* -.min.js

#### Demo and tests
https://alex2844.github.io/shaka-player/
