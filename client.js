var tpls = {
	'#ROOT': null,
	'#DB': null,
	'#PLAYER': null,
	'#SENDER': null,
	'#IFRAME': ((window != window.top) ? window.top : null),
	template: [
		'<link rel="stylesheet" href="https://alex2844.github.io/qad-cmf/dist/css/tablet_dark.css" />',
		'<link rel="stylesheet" href="https://alex2844.github.io/qad-cmf/dist/css/shaka.css" />',
		'<style>[data-shaka-player-container]:not(:fullscreen) video { max-height: 80vh !important }</style>',
		'<div class="content"><header class="fixed scrolled"><h1><a href="./index.html">Shaka Player</a></h1></header><main><section></section></main></div>'
	].join(''),
	form: [
		'<form class="card" style="max-width: 720px; margin: auto;"><div class="_">',
			'<div class="_cd12 _ct12 _cp12"><label class="select svg full"><select name="type">',
				'<option value="media_player" selected>Media Player</option><option value="cast_sender">Cast Sender</option>',
			'</select><span>Тип</span></label></div>',
			'<div class="_cd6 _ct12 _cp12"><label class="input full"><input type="text" name="title" /><span>Название</span></label></div>',
			'<div class="_cd6 _ct12 _cp12"><label class="input full"><input type="url" name="subtitle" /><span>Субтитры</span></label></div>',
			'<div class="_cd6 _ct12 _cp12"><label class="input full"><input type="url" name="src" /><span>Ссылка</span></label></div>',
			'<div class="_cd6 _ct12 _cp12"><label class="input full"><input type="file" name="local" accept="video/*" /><span>Локальный файл</span></label></div>',
		'</div><div class="actions"><button>ok</button><div style="flex:1"></div><a href="?type=cache" style="padding:8px"><img src="https://fonts.gstatic.com/s/i/materialicons/offline_bolt/v6/24px.svg" /></a></div></form>'
	].join(''),
	player: [
		'<div data-shaka-player-cast-receiver-id="7B25EC44" data-shaka-player-container>',
			'<style>[data-shaka-player-container][data-live="true"] .shaka-current-time, [data-shaka-player-container][data-live="true"] .shaka-seek-bar-container { display: none }</style>',
			'<video autoplay data-shaka-player style="width:100%;height:100%;max-width:100vw;max-height:100vh;"></video>',
		'</div>'
	].join(''),
	sender: '<button>Connect</button>',
    cache: '<table class="full"></table>'
}
function html(code) {
	if (typeof(code) == 'string') {
		var tpl = document.createElement('template');
		tpl.innerHTML = code;
		return ((tpl.content.children.length == 1) ? tpl.content.children[0] : tpl.content);
	}else
		return (document.querySelector('section') || document.body).appendChild(code);
}
function setDownloadProgress(content, progress) {
	if (tpls['#DB'].progress)
		tpls['#DB'].progress.value = progress * 100;
}
function selectTracks(tracks) {
	return tracks.filter(function(track) {
		return track.type == 'variant';
	}).sort(function(a, b) {
		return b.bandwidth - a.bandwidth;
	}).reduce(function(arr, cur) {
		var id = cur.label+':'+cur.language;
		if (arr[0].indexOf(id) == -1) {
			arr[0].push(id);
			arr[1].push(cur);
		}
		return arr;
	}, [[], []])[1];
}
function db(video) {
	return new Promise(function(res, rej) {
		if (!('shaka' in window)) {
			load = document.createElement('link');
			load.rel = 'stylesheet';
			load.href = 'https://shaka-player-demo.appspot.com/dist/controls.css';
			load.addEventListener('load', function() {
				load = document.createElement('script');
				load.src = 'https://ajax.googleapis.com/ajax/libs/shaka-player/3.0.1/shaka-player.ui.js';
				load.addEventListener('load', function() {
					res(db(video));
				});
				document.body.append(load);
			});
			return document.body.append(load);
		}
		if (tpls['#DB'])
			return res(tpls['#DB']);
		var req = window.indexedDB.open('shaka_offline_files_db', 1);
		req.onerror = function() {
			rej(new Error('Database failed to open'));
		};
		req.onsuccess = function() {
			if (!video)
				video = document.createElement('video');
			var player = new shaka.Player(video);
			player.configure({ offline: {
				progressCallback: setDownloadProgress,
				trackSelectionCallback: selectTracks
			}});
			res(tpls['#DB'] = {
				db: req.result,
				storage: new shaka.offline.Storage(player)
			});
		};
		req.onupgradeneeded = function(e) {
			e.target.result.createObjectStore('video', { keyPath: 'name' });
			res(db(video));
		};
	});
}
function cacheList() {
	return db().then(function(e) {
		return e.storage.list().then(function(content) {
			return new Promise(function(res) {
				e.db.transaction('video').objectStore('video').getAll().onsuccess = function(e) {
					res(content.concat(e.target.result.map(function(v) {
						v.offlineUri = URL.createObjectURL(v.blob);
						v.size = v.blob.size;
						v.type = v.blob.type;
						return v;
					})));
				};
			});
		});
	});
}
function play(obj) {
	var video, load,
		index = 0;
	if (!('shaka' in window)) {
		load = document.createElement('link');
		load.rel = 'stylesheet';
		load.href = 'https://shaka-player-demo.appspot.com/dist/controls.css';
		load.addEventListener('load', function() {
			load = document.createElement('script');
			load.src = 'https://ajax.googleapis.com/ajax/libs/shaka-player/3.0.1/shaka-player.ui.js';
			document.addEventListener('shaka-ui-loaded', function() { // load.addEventListener('load', function() {
				load = document.createElement('script');
				load.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js';
				load.addEventListener('load', function() {
					var playlist = obj.playlist,
						video = document.querySelector('video[data-shaka-player]'),
						spinner = video.parentNode.querySelector('.shaka-spinner-container'),
						ui = video['ui'],
						controls = ui.getControls(),
						player = controls.getPlayer();
					ui.configure({ overflowMenuButtons : [] });
					if (obj.maxQuality)
						player.setMaxHardwareResolution((obj.maxQuality*2), (obj.maxQuality*1));
					shaka.net.NetworkingEngine.registerScheme('blob', function(uri, request, requestType, progressUpdated) {
						var xhr = new window.XMLHttpRequest();
						return new Promise(function(res) {
							xhr.open(request.method, uri, true);
							xhr.responseType = 'arraybuffer';
							xhr.onload = function(e) {
								res({
									uri: e.target.responseURL,
									originalUri: uri,
									data: e.target.response
								});
							};
							xhr.send(request.body);
						});
					});
					function updatePositionState() {
						if ('setPositionState' in navigator.mediaSession)
							navigator.mediaSession.setPositionState({
								duration: tpls['#PLAYER'].video.duration,
								position: tpls['#PLAYER'].video.currentTime
							});
					}
					function prev() {
						tpls['#PLAYER'].load(playlist[(index = (index - 1 + playlist.length) % playlist.length)]);
					}
					function next() {
						tpls['#PLAYER'].load(playlist[(index = (index + 1) % playlist.length)]);
					}
					tpls['#PLAYER'] = { index, playlist, video, ui, controls, player, updatePositionState };
					function _inheritsLoose(subClass, superClass) {
						subClass.prototype = Object.create(superClass.prototype);
						subClass.prototype.constructor = subClass;
						subClass.__proto__ = superClass;
					}
					shaka.ui.Prev = function(_cls) {
						_inheritsLoose(_class, _cls);
						function _class(parent, controls) {
							var _this;
							_this = _cls.call(this, parent, controls) || this;
							_this.button_ = document.createElement('button');
							_this.button_.classList.add('material-icons-round');
							_this.button_.textContent = 'skip_previous';
							_this.button_.style.display = 'none';
							_this.parent.appendChild(_this.button_);
							_this.player.addEventListener('loading', function(e) {
								_this.button_.style.display = index ? 'block' : 'none';
							});
							_this.eventManager.listen(_this.button_, 'click', function() {
								prev();
							});
							return _this;
						}
						return _class;
					}(shaka.ui.Element);
					shaka.ui.Prev.F = function() {
						function _class() {}
						_class.prototype.create = function create(rootElement, controls) {
							return new shaka.ui.Prev(rootElement, controls);
						};
						return _class;
					}();
					shaka.ui.Controls.registerElement('prev', new shaka.ui.Prev.F());
					shaka.ui.Next = function(_cls) {
						_inheritsLoose(_class, _cls);
						function _class(parent, controls) {
							var _this;
							_this = _cls.call(this, parent, controls) || this;
							_this.button_ = document.createElement('button');
							_this.button_.classList.add('material-icons-round');
							_this.button_.textContent = 'skip_next';
							_this.parent.appendChild(_this.button_);
							_this.eventManager.listen(_this.button_, 'click', function() {
								next();
							});
							return _this;
						}
						return _class;
					}(shaka.ui.Element);
					shaka.ui.Next.F = function() {
						function _class() {}
						_class.prototype.create = function create(rootElement, controls) {
							return new shaka.ui.Next(rootElement, controls);
						};
						return _class;
					}();
					shaka.ui.Controls.registerElement('next', new shaka.ui.Next.F());
					shaka.ui.Offline = function(_cls) {
						_inheritsLoose(_class, _cls);
						function _class(parent, controls) {
							if (!('indexedDB' in window))
								return;
							var _this;
							_this = _cls.call(this, parent, controls) || this;
							_this.button_ = document.createElement('button');
							_this.button_.classList.add('material-icons-round');
							_this.button_.textContent = 'offline_bolt';
							_this.button_.style.display = 'none';
							_this.progress_ = document.createElement('div');
							_this.progress_.style.width = '100px';
							_this.progress_.style.display = 'none';
							_this.progress_.classList.add('shaka-range-container');
							_this.progress_range_ = document.createElement('input');
							_this.progress_range_.type = 'range';
							_this.progress_range_.disabled = true;
							_this.progress_range_.value = 0;
							_this.progress_range_.classList.add('shaka-range-element');
							_this.parent.appendChild(_this.button_);
							_this.progress_.appendChild(_this.progress_range_);
							_this.parent.appendChild(_this.progress_);
							function updateOnlineStatus() {
								_this.button_.style.color = navigator.onLine ? '' : '#717171';
							};
							updateOnlineStatus();
							window.addEventListener('online', updateOnlineStatus);
							window.addEventListener('offline', updateOnlineStatus);
							if ((playlist[index].src.indexOf('blob:') != 0) || (playlist[index].type != 'application/vnd.apple.mpegurl')) {
								_this.player.addEventListener('loading', function(e) {
									spinner.classList.remove('shaka-hidden');
									console.log(playlist[index]);
									if (playlist[index].src.indexOf('blob:') == 0 || playlist[index].src.indexOf('offline:') == 0)
										_this.button_.textContent = 'offline_pin';
									else{
										var title = playlist[index].artist || playlist[index].title ? [playlist[index].artist, playlist[index].title].filter(Boolean).join(': ') : playlist[index].src;
										cacheList().then(function(v) {
											if (!tpls['#DB'].progress)
												tpls['#DB'].progress = _this.progress_range_;
											var i = v.findIndex(function(v_) {
												return v_.appMetadata.title === title;
											});
											if (i > -1) {
												playlist[index].originalManifestUri = playlist[index].src;
												playlist[index].src = v[i].offlineUri;
												playlist[index].type = v[i].type;
												tpls['#PLAYER'].load(playlist[index]);
												// e.target.load((playlist[index].src = v[i].offlineUri), null, (playlist[index].type = v[i].type));
												_this.button_.textContent = 'offline_pin';
											}else
												_this.button_.textContent = 'offline_bolt';
										});
									}
								});
								_this.player.addEventListener('loaded', function(e) {
									_this.button_.style.display = ((video.parentNode.dataset.live = e.target.isLive()) ? 'none' : 'block');
								});
							}
							_this.eventManager.listen(_this.button_, 'click', function() {
								_this.button_.disabled = true;
								_this.player.unload();
								var track = playlist[index];
								var metadata = {
									'title': track.artist || track.title ? [track.artist, track.title].filter(Boolean).join(': ') : track.src,
									'downloaded': Date()
								};
								db().then(function(e) {
									if (track.src.indexOf('blob:') == 0)
										e.db.transaction(['video'], 'readwrite').objectStore('video').delete(metadata.title).onsuccess = function() {
											track.src = track.originalManifestUri;
											tpls['#PLAYER'].load(track);
											// _this.player.load((track.src = track.originalManifestUri), null, null);
										}
									else if (track.src.indexOf('offline:') == 0) {
										e.storage.remove(track.src).then(function() {
											track.src = track.originalManifestUri;
											tpls['#PLAYER'].load(track);
											// _this.player.load((track.src = track.originalManifestUri), null, null);
										});
									}else{
										var vb = _this.parent.querySelector('.shaka-volume-bar-container'),
										fn = track.format ? '.' + track.format : track.src.split('/').pop().split('#')[0].split('?')[0];
										if (vb)
											vb.style.display = 'none';
										_this.progress_.style.display = 'block';
										setTimeout(function() {
											spinner.classList.remove('shaka-hidden');
										});
										console.log(metadata, fn);
										if (fn.indexOf('.mpd') > -1 || fn.indexOf('.m3u8') > -1)
											e.storage.store(track.src, metadata).then(function(v) {
												_this.button_.textContent = 'offline_pin';
												track.originalManifestUri = track.src;
												track.src = v.offlineUri;
												tpls['#PLAYER'].load(track);
												// playlist[index].originalManifestUri = track.src;
												// _this.player.load((playlist[index].src = v.offlineUri), null, null);
											}).catch(function() {}).then(function() {
												if (vb)
													vb.style.display = 'block';
												_this.progress_.style.display = 'none';
												spinner.classList.add('shaka-hidden');
											});
										else
											return new Promise(function(res, rej) {
												var xhr = new XMLHttpRequest();
												xhr.open('GET', track.src, true);
												xhr.responseType = 'blob';
												xhr.addEventListener('progress', function(e_) {
													setDownloadProgress(null, (e_.loaded / e_.total));
												});
												xhr.addEventListener('load', function() {
													var blob = xhr.response;
													e.db.transaction(['video'], 'readwrite').objectStore('video').add({
														blob: blob,
														originalManifestUri: (track.originalManifestUri = track.src),
														// originalManifestUri: (playlist[index].originalManifestUri = track.src),
														appMetadata: metadata,
														name: metadata.title
													}).onsuccess = function(e_) {
														e_.target.transaction.oncomplete = function() {
															_this.button_.textContent = 'offline_pin';
															track.src = URL.createObjectURL(blob);
															track.type = blob.type;
															res(tpls['#PLAYER'].load(track));
															// res(_this.player.load((playlist[index].src = URL.createObjectURL(blob)), null, (playlist[index].type = blob.type)));
														}
													}
												}, false);
												xhr.addEventListener('error', function(err) {
													rej(new Error(err));
												});
												xhr.send();
											}).catch(function() {}).then(function() {
												if (vb)
													vb.style.display = 'block';
												_this.progress_.style.display = 'none';
												spinner.classList.add('shaka-hidden');
											});
											/*
											return fetch(track.src).then(function(e_) {
												var body = [],
													received = 0,
													reader = e_.body.getReader(),
													type = e_.headers.get('Content-Type'),
													size = parseInt(e_.headers.get('Content-Length'));
												return (function read() {
													return reader.read().then(function(e__) {
														setDownloadProgress(null, (received / size));
														return (!e__.done && read(body.push(e__.value), (received += e__.value.length)));
													});
												})().then(function() {
													var data = new Uint8Array(received),
														pos = 0;
													for (var i in body) {
														data.set(body[i], pos);
														pos += body[i].length;
														delete body[i];
													}
													var v = {
														blob: new Blob([ data ], { type }),
														appMetadata: metadata,
														name: metadata.title
													};
													delete data;
													return new Promise(function(res) {
														e.db.transaction(['video'], 'readwrite').objectStore('video').add(v).onsuccess = function(e__) {
															e__.target.transaction.oncomplete = function() {
																res();
															}
														}
													}).then(function() {
														_this.button_.textContent = 'offline_pin';
														playlist[index].originalManifestUri = track.src;
														_this.player.load((playlist[index].src = URL.createObjectURL(v.blob)), null, (playlist[index].type = type));
													});
												});
											}).catch(function() {}).then(function() {
												if (vb)
													vb.style.display = 'block';
												_this.progress_.style.display = 'none';
											});
											 */
									}
								});
							});
							return _this;
						}
						return _class;
					}(shaka.ui.Element);
					shaka.ui.Offline.F = function() {
						function _class() {}
						_class.prototype.create = function create(rootElement, controls) {
							return new shaka.ui.Offline(rootElement, controls);
						};
						return _class;
					}();
					shaka.ui.Controls.registerElement('offline', new shaka.ui.Offline.F());
					if ('mediaSession' in navigator) {
						navigator.mediaSession.setActionHandler('seekbackward', function(e) {
							updatePositionState(video.currentTime = Math.max(video.currentTime - (e.seekOffset || 10), 0));
						});
						navigator.mediaSession.setActionHandler('seekforward', function(e) {
							updatePositionState(video.currentTime = Math.min(video.currentTime + (e.seekOffset || 10), video.duration));
						});
						navigator.mediaSession.setActionHandler('play', function() {
							video.play().then(function() {
								navigator.mediaSession.playbackState = 'playing';
							});
						});
						navigator.mediaSession.setActionHandler('pause', function() {
							video.pause();
							navigator.mediaSession.playbackState = 'paused';
						});
						/*
						try {
							navigator.mediaSession.setActionHandler('stop', function() {
								// TODO: Clear UI playback...
							});
						} catch(err) {}
						 */
						try {
							navigator.mediaSession.setActionHandler('seekto', function(e) {
								if (e.fastSeek && ('fastSeek' in video))
									return video.fastSeek(e.seekTime);
								video.currentTime = e.seekTime;
								updatePositionState();
							});
						} catch(err) {}
						if (playlist.length > 1) {
							navigator.mediaSession.setActionHandler('previoustrack', function() {
								prev();
							});
							navigator.mediaSession.setActionHandler('nexttrack', function() {
								next();
							});
						}
						video.addEventListener('ended', function(e) {
							if (tpls['#IFRAME'])
								tpls['#IFRAME'].postMessage({ type: e.type }, '*');
							if (playlist.length > 1)
								next();
						});
						if (tpls['#IFRAME'])
							video.addEventListener('timeupdate', function(e) {
								tpls['#IFRAME'].postMessage({
									type: e.type,
									currentTime: e.target.currentTime,
									duration: e.target.duration
								}, '*');
							});
					}
					play(obj);
				});
				document.body.append(load);
			});
			document.body.append(load);
		});
		return document.body.append(load);
	}
	(tpls['#PLAYER'].load = function(track) {
		if (tpls['#IFRAME'])
			tpls['#IFRAME'].postMessage({ type: 'load', track }, '*');
		if (!track.src)
			return;
		var fn = (track.format ? '.'+track.format : (track.originalManifestUri || track.src).split('/').pop().split('#')[0].split('?')[0]);
		if ((fn.indexOf('.m3u8') > -1) && !('muxjs' in window)) {
			load = document.createElement('script');
			load.src = 'https://cdn.jsdelivr.net/npm/mux.js@latest/dist/mux.min.js';
			load.addEventListener('load', function() {
				tpls['#PLAYER'].load(track);
			});
			return document.body.append(load);
		}
		tpls['#PLAYER'].ui.configure({
			overflowMenuButtons : ((fn.indexOf('.mp4') > -1) ? [
				'cast', 'picture_in_picture'
			] : [
				'captions', 'cast', 'quality', 'language', 'picture_in_picture'
			])
		});
		tpls['#PLAYER'].ui.configure({
			controlPanelElements: ((obj.playlist.length > 1) ? [
				'prev', 'play_pause', 'next', 'time_and_duration', 'spacer', 'mute', 'volume', 'offline', 'fullscreen', 'overflow_menu',
			] : [
				'play_pause', 'time_and_duration', 'spacer', 'mute', 'volume', 'offline', 'fullscreen', 'overflow_menu',
			])
		});
		return tpls['#PLAYER'].player.load(track.src, null, track.type).then(function() {
			if (track.audio != undefined)
				tpls["#PLAYER"].player.selectAudioLanguage(tpls["#PLAYER"].player.getAudioLanguages()[track.audio]);
			if (track.startTime)
				tpls['#PLAYER'].video.currentTime = track.startTime;
			if (track.subtitles && (fn.indexOf('.mp4') == -1))
				for (var k in track.subtitles) {
					tpls['#PLAYER'].player.addTextTrack(track.subtitles[k], k, 'subtitle', 'text/vtt');
				}
			if ('mediaSession' in navigator) {
				function metadata() {
					tpls['#PLAYER'].updatePositionState(navigator.mediaSession.metadata = new MediaMetadata({
						title: track.title,
						artwork: track.artwork,
						artist: track.artist
					}));
				}
				if (!track.poster)
					metadata();
				else{
					var img = new Image();
					img.onload = function(e) {
						metadata(track.artwork = [{
							src: track.poster,
							sizes: e.target.width+'x'+e.target.height
						}]);
					}
					img.src = track.poster;
				}
			}
		}).catch(function(err) {
			if ((err.code == 4022) && (track.src.indexOf('http') == 0)) {
				track.src = URL.createObjectURL(new Blob([[
					'#EXTM3U',
					'#EXT-X-STREAM-INF:BANDWIDTH=1280000,AVERAGE-BANDWIDTH=1000000',
					track.src
				].join('\r\n')]));
				track.type = 'application/vnd.apple.mpegurl';
				tpls['#PLAYER'].load(track);
			}else{
				if (tpls['#IFRAME'])
					tpls['#IFRAME'].postMessage({ type: 'error', err }, '*');
				throw err;
			}
		});
	})(obj.playlist[index]);
}
function send(obj) {
	if (!('cast' in chrome)) {
		var load = document.createElement('script');
		load.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js';
		load.addEventListener('load', function() {
			window.__onGCastApiAvailable = function(loaded) {
				if (loaded)
					send(obj);
			};
		});
		return document.body.append(load);
	}
	chrome.cast.initialize(new chrome.cast.ApiConfig(new chrome.cast.SessionRequest('5CB45E5A'), sessionListener, function() {}));
	function sessionListener(session) {
		console.log('New session ID:'+session.sessionId);
		(tpls['#SENDER'] = session).addUpdateListener(function(isAlive) {
			if (!isAlive)
				tpls['#SENDER'] = null;
		});
		tpls['#SENDER'].addMessageListener('urn:x-cast:com.url.cast', function(namespace, msg) {
			console.log('Receiver said: ' + msg);
		});
		castSendMessage({
			type: 'loc',
			url: obj.src
		});
	}
	chrome.cast.requestSession(sessionListener, function() {});
}
function castSendMessage(msg) {
	if (!tpls['#SENDER'])
		return;
	tpls['#SENDER'].sendMessage('urn:x-cast:com.url.cast', msg, function() {
		console.log('Message sent: ', msg);
	}, function() {});
}
function init() {
	function ajax(ju) {
		console.log(ju);
		if (ju.type == 'media_player') {
			ju.type = null;
			var container = html(tpls.player)
			if (tpls['#IFRAME'] || (navigator.userAgent.indexOf(' CrKey/') > -1)) {
				container.style.top = '50%';
				container.style.transform = 'translateY(-50%)';
			}
			html(container);
			if (!ju.playlist) {
				if (ju.subtitle)
					ju.subtitles = { '': ju.subtitle };
				if (ju.local) {
					ju.src = URL.createObjectURL(ju.local);
					ju.type = ju.local.type;
					ju.originalManifestUri = ju.local.name;
				}
				ju.playlist = [ Object.assign({}, ju) ];
			}
			play(ju);
		}else if (ju.type == 'cast_sender') {
			var sender = html(tpls.sender);
			sender.addEventListener('click', function() {
				send(ju);
			});
			html(sender);
		}else if (ju.type == 'cache') {
			var table = html(tpls.cache);
			html(table);
			function formatSize(size) {
				var i = Math.floor(Math.log(size) / Math.log(1024));
				return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
			}
			function refresh() {
				while (table.rows.length) {
					table.deleteRow(0);
				}
				cacheList().then(function(e) {
					if (e.length)
						e.forEach(addRow);
					else
						table.innerHTML = '<tr><td>Пусто</td></tr>';
				});
			}
			function addRow(content) {
				var append = -1;
				var row = table.insertRow(append);
				var bplay = document.createElement('a');
				bplay.innerHTML = 'PLAY';
				bplay.href = '?type=media_player&title='+content.appMetadata.title+'&src='+content.originalManifestUri;
				row.insertCell(append).appendChild(bplay);
				var bdel = document.createElement('span');
				bdel.innerHTML = 'DEL';
				bdel.style.cursor = 'pointer';
				bdel.onclick = function() {
					db().then(function(e) {
						if (content.blob)
							e.db.transaction(['video'], 'readwrite').objectStore('video').delete(content.name).onsuccess = function() {
								refresh();
							}
						else
							e.storage.remove(content.offlineUri).then(function() {
								refresh();
							});
					});
				}
				row.insertCell(append).appendChild(bdel);
				row.insertCell(append).innerHTML = content.appMetadata.title;
				row.insertCell(append).innerHTML = formatSize(content.size);
				row.insertCell(append).innerHTML = new Date(content.appMetadata.downloaded).toLocaleString([]);
				row.insertCell(append).innerHTML = content.offlineUri;
			};
			refresh();
		}else if (window == window.top) {
			var form = html(tpls.form);
			form.type.addEventListener('change', function(e) {
				if (form.title.parentNode.parentNode.hidden = form.subtitle.parentNode.parentNode.hidden = form.local.parentNode.parentNode.hidden = (e.target.value == 'cast_sender'))
					form.src.parentNode.parentNode.classList.add('_cd12');
				else
					form.src.parentNode.parentNode.classList.remove('_cd12');
			});
			form.addEventListener('submit', function(e) {
				e.preventDefault();
				var jf = Object.fromEntries(new FormData(e.target));
				form.remove();
				if (!jf.local.name) {
					delete jf.local;
					history.pushState(null, null, '?'+new URLSearchParams(jf).toString());
				}
				ajax(jf);
			});
			html(form);
		}
	}
	function init_() {
		var ju = Object.fromEntries(new URLSearchParams(location.search))
		if ((window == window.top) && (navigator.userAgent.indexOf(' CrKey/') == -1)) {
			document.body.appendChild(tpls['#ROOT'] = html(tpls.template));
			ajax(ju);
		}else if (ju.type) {
			if (navigator.userAgent.indexOf(' CrKey/') > -1)
				document.body.style['background-color'] = '#000';
			ajax(ju);
		}
	}
	if ('serviceWorker' in navigator)
		navigator.serviceWorker.register('sw.js').then(init_, init_).catch(init_);
	else
		init_();
	window.addEventListener('popstate', location.reload.bind(location));
	window.addEventListener('message', function(e) {
		console.log('message', e.data, {e});
		tpls['#IFRAME'] = e.source;
		if (e.data.scheme)
			document.addEventListener('shaka-ui-loaded', function() {
				for (var k in e.data.scheme) {
					shaka.net.NetworkingEngine.registerScheme(k, new Function('return '+e.data.scheme[k])());
				}
			});
		if (e.data.type)
			ajax(e.data);
	});
}
