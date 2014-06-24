'use strict';

app.controller('RootCtrl', [
	'$scope',
	'$rootScope',
	'$query',
	'$location',
	'$popup',
	'prettyDate',
	'$cacher',
	function($scope, $rootScope, $query, $location, $popup, prettyDate, $cacher) {

		var locate = $location.path();

		// global user object
		$rootScope.user = {};

		// слушатели событий авториазции
		$scope.authStatus = 'signout';

		$scope.$on('authorizeOn', function(event, user) {
			$rootScope.user = user;
			$scope.authStatus = 'signin';
		});

		$scope.$on('authorizeOff', function() {
			$rootScope.user = {};
			$scope.authStatus = 'signout';
		});

		// проверка авторизации
		$query.
			get('/userInfo/', '', true).			// true - не кэшировать данные
			then( function(data) {
				if(data.error) {
					$scope.error = data.message;
				}
				else
				if(data.user) {
					$scope.$broadcast('authorizeOn', data.user);
				}
			}, function(error) {
				var e = error;
			});

		$rootScope.locale = {};

		$rootScope.templateUrl = function(template, root) {
			var page = locate.split('/')[1];
			page = page ? '/pages/' + page + '/' : '/pages/main/';
			if(root === true) {
				page = '/';
			}
			else
			if(root !== undefined) {
				page = '/pages/' + root + '/';
			}
			return '/desktop' + page + 'templates/' + template + '.html';
		};

		$rootScope.setStyle = function(s) {
            return s ? s : '';
        };

		$rootScope.setBackImage = function(s) {
            return s ? { 'background-image': 'url(' + s + ')' } : {};
        };

		$rootScope.setUser = function(d) {
            $scope.user = d;
        };

		// кастомизация даты
		$rootScope.parseDate = function(date) {
			return prettyDate(date, $scope.locale.globalLocale.localeDate);
		};

		// локализация globalLocale
		$query.
			json('globalLocale', true).
			then(function(d) {
				for(var v in d) {
					$scope.locale[v] = d[v];
				}
			});

		// локализация navPanel
		$query.
			json('navPanel', true).
			then(function(d) {
				for(var v in d) {
					$scope.locale[v] = d[v];
				}
			});

		// open auth popup
		$scope.authOpen = function() {
			$popup.show({
				width: '518px',
				template: 'authBlock',
				templateBase: true,
				controller: function(scope) {
					scope.authBlock = {
						authorize: 1,
						register: 0,
						forgot: 0
					};
					scope.forgotStatus = 0;
					// Востановление пароля
					scope.forgot = function() {
						if(!this.input.email) {
							alert('Емэйл не введен!'); // todo поменять на нормальный alert
							return;
						}
						var options = {
							email: this.input.email
						};
						$query.
							post('/ios/' + app.versionAPI + '/recover/', options, true).	// true - не кэшировать данные
							then( function(data) {
								if(data.error) {
									scope.error = data.message;
								} else {
									scope.forgotStatus = 1;
									scope.forgotEmail = options.email;
								}
							}, function(error) {
								var e = error;
							});
					};

					// Регистрация
					scope.registry = function() {
						if(!this.input.email) {
							alert('Емэйл не введен!'); // todo поменять на нормальный alert
							return;
						}
						if(!this.input.firstName) {
							alert('Имя не введено!'); // todo поменять на нормальный alert
							return;
						}
						if(!this.input.lastName) {
							alert('Фамилия не введена!'); // todo поменять на нормальный alert
							return;
						}
						var options = {
							email: this.input.email,
							name: this.input.firstName,
							lastName: this.input.lastName
						};
						$query.
							post('/ios/' + app.versionAPI + '/register/', options, true).	// true - не кэшировать данные
							then( function(data) {
								if(data.error) {
									scope.error = data.message;
								} else {
									scope.$broadcast('authorizeOn', data.user);
									$scope.$emit('reLoadPosts');
								}
							}, function(error) {
								var e = error;
							});
					};

					// Авторизация
					scope.login = function() {
						if(!this.input.email) {
							alert('Емэйл не введен!'); // todo поменять на нормальный alert
							return;
						}
						if(!this.input.password) {
							alert('Пароль не введен!'); // todo поменять на нормальный alert
							return;
						}
						var options = {
							email: this.input.email,
							password: this.input.password,
							save: this.input.saveme
						};
						$query.
							post('/ios/' + app.versionAPI + '/login/', options, true).	// true - не кэшировать данные
							then( function(data) {
								if(data.error) {
									scope.error = data.message;
								} else {
									scope.$broadcast('authorizeOn', data.user);
									$scope.$emit('reLoadPosts');
									$popup.hide();
								}
							}, function(error) {
								var e = error;
							});
					};

				}
			});
		};

		// Выход из авторизованности
		$scope.logout = function() {
			$query.
				get('/ios/' + app.versionAPI + '/logout/', '', true).		// true - не кэшировать данные
				then( function(data) {
					if(data.error) {
						$scope.error = data.message;
					} else {
						$scope.$emit('authorizeOff');
						$scope.$emit('reLoadPosts');
					}
				}, function(error) {
					var e = error;
				});
		};

}]);
