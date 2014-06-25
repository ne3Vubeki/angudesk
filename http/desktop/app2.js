'use strict';

var app = angular.module('app', ['ngRoute', 'route-segment', 'view-segment']);

// configuration
app.config([
	'$routeProvider',
	'$routeSegmentProvider',
	'$locationProvider',
	'$httpProvider',
	'$controllerProvider',
	'$compileProvider',
	'$filterProvider',
	'$provide',
	function($routeProvider, $routeSegmentProvider, $locationProvider, $httpProvider, $controllerProvider, $compileProvider, $filterProvider, $provide) {

		$locationProvider.html5Mode(true);
		$locationProvider.hashPrefix('!');

		app.route = {
			provider: $routeProvider,
			segmentProvider: $routeSegmentProvider
		};

		$routeSegmentProvider.options.autoLoadTemplates = true;

		app.register = {
			controller: $controllerProvider.register,
			directive: $compileProvider.directive,
			filter: $filterProvider.register,
			factory: $provide.factory,
			service: $provide.service
		};

		app.social = {
			facebook: {
				token: "",
				url: ""
			},
			vkontakte: {
				token: "",
				url: ""
			},
			googleplus: {
				token: "",
				url: ""
			}
		};

		//todo Общая обработка запросов и ответов сервера - требует доработки или убрать и не использовать
		$httpProvider.interceptors.push( function($q, $location) {
			return {
				'response': function(response) {
					switch(response.status) {
						case 204:
							return $q.reject(response);
						default:
							return response || $q.when(response);
					}
				},
				'responseError': function(rejection) {
					switch(rejection.status) {
						case 401:
							return $q.reject(rejection);
						default:
							return $q.reject(rejection);
					}
				}
			}
		});

	}
]);

// загрузка и обработка роутинга
app.run([
	'$http',
	'$route',
	'$locale',
	'$location',
	'$q',
	'$rootScope',
	function($http, $route, $locale, $location, $q, $rootScope) {

		$locale.id = 'ru-ru';

		$http.get('/mobile/json/routes.json').success(function (data) {

			var resolver = function(itm) {
					var dependencies = itm.scripts || [],
						url, scrptUrl, loc = itm.url.split('/')[1];
					url = '/mobile/pages/' + (loc ?  loc + '/' : 'main/');

					// добавление url скрипта контроллера
					if(itm.controller) {
						scrptUrl = url + 'controllers/' + itm.controller.charAt(0).toLowerCase() + itm.controller.substr(1) + '.js';
						dependencies.push(scrptUrl)
					}
					// добавление url скрипта директивы
					if(itm.directives === true) {
						scrptUrl = url + 'directives/directives.js';
						dependencies.push(scrptUrl)
					}

					return function($q, $rootScope) {
						var deferred = $q.defer();
						$script(dependencies, function() {
							$rootScope.$apply(function() {
								deferred.resolve();
							});
						});

						return deferred.promise;
					}
				},
				rspEach = function(d, func) {
					for(var j in d) {
						var itm = d[j],
							nv = j.split('.'),
							ende = nv[nv.length-1];
						app.route.segmentProvider.when(itm.url, j);
						func.
							segment(ende, {
								templateUrl: itm.templateUrl,
								controller:  itm.controller,
								resolve: {
									data: resolver(itm)
								}
							});
						if(itm.routes) {
							rspEach(itm.routes, func.within(ende));
						}
					}
				};


			for(var k in data) {
				var root = k,
					dependencies = data[root].scripts;
				app.route.segmentProvider.
					when(data[root].url, root).
					segment(root, {
						templateUrl: data[root].templateUrl,
						controller:  data[root].controller,
						resolve: {
							data: resolver(data[root])
						}
					});
				if(data[root].routes)
					rspEach(data[root].routes, app.route.segmentProvider.within(root));
			}

			app.route.provider.
				otherwise({
					redirectTo: data.e404.url
				});
			$route.reload();
		});

	}]);