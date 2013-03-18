'use strict';

// Declare app resources module
angular.module('markdownEditor.resources', ['ngResource'])
  .factory('File', ['$resource', '$http', 
    function($resource, $http) {
      // Use the AngularJS $resource to create a REST API client with our added 'update' method to allow for using PUT
      // when updating a file instead of POST.  We also tell the $resource to use the file's id for the fileId path
      // parameter.
      return $resource('api/files/:fileId', {}, {
        update: {method: 'PUT', params: {fileId: '@id'}}
      });
    }
  ]);
