(function() {
    'use strict';
    angular.module('fwld.routes', []).config(configureRoutes);

    configureRoutes.$inject = ['$stateProvider', '$urlRouterProvider'];
    function configureRoutes($stateProvider, $urlRouterProvider) {
        console.log('configuring routes')

        $urlRouterProvider.otherwise('/');

        $stateProvider.state('tasks', {
            url : '/',
            views: {
                'pageContent': {
                    controller : 'TasksController',
                    controllerAs: 'tasksVm',
                    templateUrl: 'templates/tasks.html',
                }
            }
        })
    }
})();
