'use strict';

app.register.controller('PostCtrl', [
	'$scope',
	'$query',
	function($scope, $query) {

        $query.
            json('postCtrl').
            then(function(d) {
                for(var v in d) {
                    $scope.locale[v] = d[v];
                }
            });

}]);
