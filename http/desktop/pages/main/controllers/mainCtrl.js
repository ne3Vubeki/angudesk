'use strict';

app.register.controller('MainCtrl', [
	'$scope',
	'$rootScope',
	'$query',
	'$cacher',
	'$timeout',
	function($scope, $rootScope, $query, $cacher, $timeout) {
	$query.
		json('mainCtrl').
		then(function(d) {
			for(var v in d) {
				$scope.locale[v] = d[v];
			}
		});
}]);
