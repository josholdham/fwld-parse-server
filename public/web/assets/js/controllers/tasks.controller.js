(function() {

    angular.module('fwld.controllers', []).controller('TasksController', TasksController);

    TasksController.$inject = ['$stateParams', '$scope'];

    function TasksController($stateParams, $scope) {
        console.log('heelo')
        var tasksVm = this;
        console.log('controller')
    }

})();
