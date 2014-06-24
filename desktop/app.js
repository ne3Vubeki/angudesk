'use strict';

var app = angular.module('app', ['ngRoute']);

// configuration
app.config([
	'$routeProvider',
	'$locationProvider',
	'$httpProvider',
	'$controllerProvider',
	'$compileProvider',
	'$filterProvider',
	'$provide',
	function($routeProvider, $locationProvider, $httpProvider, $controllerProvider, $compileProvider, $filterProvider, $provide) {

		$locationProvider.html5Mode(true);
		$locationProvider.hashPrefix('!');

		app.route = {
			provider: $routeProvider
		};

		app.register = {
			controller: $controllerProvider.register,
			directive: $compileProvider.directive,
			filter: $filterProvider.register,
			factory: $provide.factory,
			service: $provide.service
		};

		// social token data
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

		// application directory
		app.DIR = 'desktop';

		// API version
		app.versionAPI = '1';

	}
]);

// загрузка и обработка роутинга
app.run([
	'$q',
	'$http',
	'$route',
	'$locale',
	'$location',
	'$rootScope',
	function($q, $http, $route, $locale, $location, $rootScope) {

    $locale.id = 'ru-ru';

    $http.get('/' + app.DIR + '/json/routes.json').success(function (data) {

		var resolver = function(itm) {
				var dependencies = itm.scripts || [],
					url, scrptUrl, loc = itm.url.split('/')[1];
				url = '/' + app.DIR + '/pages/' + (loc ?  loc + '/' : 'main/');

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
			getRoutes = function(d) {
				for (var k in d) {
					var currentRoute = d[k];
					app.route.provider.when(currentRoute.url, {
						templateUrl: currentRoute.templateUrl,
						controller: currentRoute.controller,
						resolve: {
							data: resolver(currentRoute)
						}
					});
					if(d[k].routes) {
						getRoutes(d[k].routes);
					}
				}
			}

		getRoutes(data);

		app.route.provider.
            otherwise({
                redirectTo: data.e404.url
            });

        $route.reload();
    });	

}]);