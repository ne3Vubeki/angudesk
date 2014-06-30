'use strict';

app.register.controller('MainCtrl', [
	'$scope',
	'$query',
	function($scope, $query) {

        $query.
            json('mainCtrl').
            then(function(d) {
                for(var v in d) {
                    $scope.locale[v] = d[v];
                }
            });

}]);
