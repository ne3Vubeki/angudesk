'use strict';

app.register.controller('ErrorCtrl', [
    '$scope',
    '$query',
    function($scope, $query) {

        $query.
            json('errorCtrl').
            then(function(d) {
                for(var v in d) {
                    $scope.locale[v] = d[v];
                }
            });

}]);
