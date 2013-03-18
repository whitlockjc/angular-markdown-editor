'use strict';

// Declare app module
angular.module('markdownEditor', ['markdownEditor.services'])
  // AngularJS way to prepare an application and provide application level scope
  .run(function($rootScope) {
    $rootScope.appName = 'AngularJS Markdown Editor'
  });
