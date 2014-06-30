'use strict';

app.register.controller('MainMainCtrl', [
	'$scope',
	'$query',
	function($scope, $query) {

        $query.
            json('mainMainCtrl').
            then(function(d) {
                for(var v in d) {
                    $scope.locale[v] = d[v];
                }
            });

}]);
