(function () {
   'use strict';
   console.log('hello')
   // this function is strict...
}());


// Declare app level module which depends on filters, and services
var app = angular.module('fwld', [
    'ngRoute',
    'fwld.routes',
    'fwld.controllers'
]);

//
//  M I S C    C O N F I G
//
app.config(['$locationProvider',
    function ($locationProvider) {
        $locationProvider.html5Mode(true);
        //localStorageServiceProvider.setPrefix('fwld');
    }//
]);


//
//  R U N
//
app.run(starter);

//starter.$inject = ['$document', '$rootScope', '$location'];
function starter() {
    console.log('START')
    //Prevent the backspace key triggering history back event
    // $document.on('keydown', function (e) {
    //     if (e.which === 8) {
    //         if (e.target.nodeName !== 'INPUT' && e.target.nodeName !== 'TEXTAREA') {
    //             e.preventDefault();
    //         }
    //     }
    // });

    // $rootScope.$on('$stateChangeStart',function(event, toState, toParams, fromState, fromParams) {
    // });

    // $rootScope.$on('$stateChangeSuccess',function(event, toState, toParams, fromState, fromParams) {
    // });

    // $rootScope.$on('$stateChangeError', function(event) {
    //     $state.go('404');
    // });
}








