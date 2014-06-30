'use strict';

// query json factory
app.service('$query', ['$http', '$q', '$locale', '$location','$cacher', function($http, $q, $locale, $location, $cacher) {
    var that = this,
		param = function(data) {
			if(!data) return;
			return Object.keys(data).map( function(k) {
				if (Array.isArray(data[k])) {
					var keyE = encodeURIComponent(k + '[]');
					return data[k].map( function(subData) {
						return keyE + '=' + encodeURIComponent(subData);
					}).join('&');
				} else {
					return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
				}
			}).join('&');
		};

    this.html = function(url, root, reload) {
		var page = $location.path().split('/')[1], uri;
		page = page ? '/pages/' + page + '/' : '/pages/main/';
		// root только для загрузки json из /desktop/json...
		if(root !== undefined) {
			page = '/';
		}
		uri = '/' + app.DIR + page + 'templates/' + url + '.html';
		return that.get(uri, '', reload);
    };

    this.json = function(url, root, reload) {
        var loc = $location.path().split('/')[1], uri;
        loc = loc ? '/pages/' + loc + '/' : '/pages/main/';
		// root только для загрузки json из /' + app.dir + '/json...
		if(root !== undefined) {
			loc = '/';
		}
		uri = '/' + app.DIR + loc + 'json/' + $locale.id + '/' + url + '.json';
		return that.get(uri, '', reload);
    };

    this.get = function(url, p, reload) {
		var deferred = $q.defer(),
			uri = url + (p ? '?' + param(p) : ''),
			resp = $cacher.get(uri);
		if(!resp || reload == true) {
			$http.
				get(uri).
				success( function(resp) {
					$cacher.put(uri, resp);
					deferred.resolve(resp);
				}).
				error( function(error) {
					deferred.reject(error);
				});
		}
		else {
			deferred.resolve(resp);
		}
		return deferred.promise;
    };

    this.post = function(url, p, reload) {
		var deferred = $q.defer(),
			uri = url,
			resp = $cacher.get(uri);
		if(!resp || reload == true) {
			$http.
				post(uri, param(p), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
				success( function(resp) {
					$cacher.put(uri, resp);
					deferred.resolve(resp);
				}).
				error( function(error) {
					deferred.reject(error);
				});
		}
		else {
			deferred.resolve(resp);
		}
		return deferred.promise;
    };
}]);

// Фабрика кэширования
app.factory('$cacher', ['$cacheFactory', function ($cacheFactory) {
	return $cacheFactory('$cacher', {});
}]);

// google authentification service
app.service('gpAuth', ['$rootScope', '$q', function ($rootScope, $q) {
	var clientId = app.social.googleplus.token,
		scopes = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
		domain = app.social.googleplus.url,
		deferred = $q.defer();

	this.login = function() {
		gapi.auth.authorize({ client_id: clientId, scope: scopes, immediate: false }, this.handleAuthResult);
		return deferred.promise;
	};

	this.handleAuthResult = function(authResult) {
		if (authResult && !authResult.error) {
			gapi.client.load('oauth2', 'v2', function () {
				var request = gapi.client.oauth2.userinfo.get();
				request.execute(function (resp) {
					$rootScope.$apply(function () {
						deferred.resolve(resp);
					});
				});
			});
		} else {
			deferred.reject('error');
		}
	};
}]);

// facebook authentification service
app.service('fbAuth', ['$rootScope', '$window', '$q', function($rootScope, $window, $q){
	var deferred = $q.defer();
	this.login = function() {
		FB.getLoginStatus( function(response) {
			if (response.status === 'connected') {
				FB.api('/me', function(resp) {
					$rootScope.$apply(function () {
						deferred.resolve(resp);
					});
				});
			} else if (response.status === 'not_authorized') {
				FB.login(function (resp) {
					if (resp.authResponse) {
						FB.api('/me', function (resp) {
							deferred.resolve(resp);
						});
					}
					else {
						deferred.reject('error_app');
					}
				}, {scope: 'email'});
			} else {
				FB.login(function (resp) {
					if (resp.authResponse) {
						FB.api('/me', function (resp) {
							deferred.resolve(resp);
						});
					}
					else {
						deferred.reject('error_app');
					}
				}, {scope: 'email'});
			}
		}, true);
		return deferred.promise;
	}
}]);

// vkontakte authentification service
app.service('vkAuth', ['$rootScope', '$window', '$q', function($rootScope, $window, $q){
	var deferred = $q.defer();
	var getUserVK = function () {
		var code;
		code = 'return {';
		code += 'me: API.getProfiles({uids: API.getVariable({key: 1280}), fields: "nickname"})[0]';
		code += '};';
		VK.Api.call('execute', {'code': code}, function (resp) {
			if (resp.response) {
				deferred.resolve(resp.response.me);
			}
		});
	};

	this.login = function() {
		VK.Auth.getLoginStatus(function (response) {
			if (response.session) {
				getUserVK();
			}
			else {
				VK.Auth.login(function (response) {
					if (response.session) {
						getUserVK();
					}
					else {
						deferred.reject('error_app');
					}
				});
			}
		});
		return deferred.promise;
	};
}]);

// main popup
app.service('$popup', ['$document', '$compile', '$rootScope', function($document, $compile, $rootScope){
	var defaultOptins = {
		template: '',
		templateBase: true,
		cached: '',
		width: '50%',
		height: '',
		closer: true,
		controller: null
	};
	this.show = function(option, controller) {
		option = $.extend({}, defaultOptins, option);
		var initTemplate = $compile(
			'<popup class="popup__layer" data-closer="' + option.closer + '"' +
			' data-width="' + option.width + '"' +
			(option.height ? ' data-height="' + option.height + '"' : '') +
			(option.template ? ' data-url="' + option.template + '"' : '') +
			(option.templateBase ? ' data-url-base="' + option.templateBase + '"' : '') +
			'></popup>')($rootScope);
		$document.find('body').append(initTemplate);
		$rootScope.$on('popupOpened', function() {
			if(option.controller) {
				option.controller($rootScope);
			}
		});
	};
	this.hide = function() {
		$rootScope.$emit('popupClose');
	}
}]);

// new krutilka
app.service('$barley', ['$compile', '$rootScope', function($compile, $rootScope){
	var defaultOptins = {
		width: '35px',
		count: 4
	};
	this.show = function(elem, option) {
		option = $.extend({}, defaultOptins, option);
		var initTemplate = $compile('<barley data-barley-count="' + option.count + '" data-barley-width="' + option.width +
			'"></barley>')($rootScope);
		$(elem).append(initTemplate);
	};
	this.hide = function(elem) {
		$rootScope.$emit('barleyClose', elem);
	}
}]);

app.factory('prettyDate', ['$query', 'num2word', function($query, num2word) {
	return function(date, locale) {
		if(!date) return;
		var dateHours = date.split(' '),
			hou = dateHours[0].split(':'),
			hours = parseInt(hou[0]),
			minutes = parseInt(hou[1]),
			dat = dateHours[1].split('.'),
			day = parseInt(dat[0]),
			month = parseInt(dat[1]) - 1,
			currentDate = new Date(),
			timeView = function(time) {
				return time < 10 ? '0' + time : time;
			};

		if(month === currentDate.getMonth()) {
			if(day === currentDate.getDate()) {
				var res = Math.ceil(currentDate.getHours() - hours);
				return  res + ' ' + num2word(res, locale.hours) + ' ' + locale.back;
			}
			else
			if(day === currentDate.getDate() - 1) {
				return locale.yesterday + ' ' + locale.in + ' ' + timeView(hours) + ':' + timeView(minutes);
			}
			else {
				return day + ' ' + locale.months[month] + ' ' + locale.in + ' ' + timeView(hours) + ':' + timeView(minutes);
			}
		}
		else {
			return day + ' ' + locale.months[month] + ' ' + locale.in + ' ' + timeView(hours) + ':' + timeView(minutes);
		}
	}
}]);

app.factory('num2word', [ function() {
	return function(num, words) {
		num = num % 100;
		if (num > 19) {
			num = num % 10;
		}
		switch (num) {
			case 1:
				return words[0];
			case 2:
			case 3:
			case 4:
				return words[1];
			default:
				return words[2];
		}
	};
}]);
