'use strict';

// Declare app services module
angular.module('markdownEditor.services', ['markdownEditor.resources'])
  .config(['$routeProvider', function($routeProvider) {
    // Configure the router
    $routeProvider
      .when('/files', {templateUrl: 'partials/file-editor.html', controller: FileEditorCtrl})
      .when('/files/:fileIdOrAction', {templateUrl: 'partials/file-editor.html', controller: FileEditorCtrl})
      .otherwise({redirectTo: '/files'})
  }])
  .factory('FileService', ['File', function(File) {
    var that = this;
    // Simple function that gets the index of a file in the files list because attempts to use indexOf always return -1
    // and I think it's got something to do with the special AngularJS class.
    var getResourceIndex = function(file) {
      var index = -1;
      angular.forEach(that.files, function(f, i) {
        if (index === -1) {
          if (f.id === file.id) {
            index = i;
          }
        }
      });
      return index;
    };

    // Function that will return, and reset, the local cache of files by querying the REST API.
    this.all = function(success, error) {
      return File.query({},
        function(response) {
          // Reset the local files cache
          that.files = response;
          // Call the success callback if provided
          if (success) {
            success(response);
          }
        },
        error
      );
    };

    // Function for creating a new file
    this.create = function(file, success, error) {
      return File.save({}, file,
        function(response) {
          // Add the newly created file to the local files cache
          that.files.push(response);
          // Call the success callback if provided
          if (success) {
            success(response);
          }
        },
        error
      );
    };

    // Function for getting a file by id
    this.getById = function(fileId, success, error) {
      var fileIndex = getResourceIndex({id: fileId});

      if (fileIndex > -1) {
        success(angular.copy(that.files[fileIndex]));
      } else {
        return File.get({fileId: fileId},
          function(response) {
            // Add the newly fetched file to the local files cache
            that.files.push(response);
            // Call the success callback if provided
            if (success) {
              success(response);
            }
          }, error);
      }
    };

    // Function for updating a file
    this.update = function(file, success, error) {
      return File.update(file,
        function(response) {
          var oldFile;

          // For us to lookup the file in the files cache, we need the old version so we can't use getResourceIndex.
          angular.forEach(that.files, function(f) {
            if (!oldFile) {
              if (f.id === file.id) {
                oldFile = f;
              }
            }
          });
          // Update the file in the local files cache with the new file
          that.files[getResourceIndex(file)] = response;
          // Call the success callback if provided
          if (success) {
            success(response);
          }
        },
        error);
    };

    // Function for deleting a file
    this.delete = function(file, success, error) {
      return File.delete({fileId: file.id},
        function(response) {
          // Remove the file from the local files cache
          that.files.splice(getResourceIndex(file), 1);
          // Call the success callback if provided
          if (success) {
            success(response);
          }
        },
        error);
    };

    // State for the current list of files
    this.files = this.all();

    return this;
  }]);
