'use strict';

function FilesListCtrl($scope, FileService) {
  $scope.files = FileService.files;
}

FilesListCtrl.$inject = ['$scope', 'FileService'];

function FileEditorCtrl($scope, $routeParams, $location, FileService) {
  var fileIdOrAction = $routeParams.fileIdOrAction;
  // Simple function that will handle an error response from the FileService methods
  var handleError = function(response) {
    var data = response.data;

    if (data && data.error) {
      $scope.errorMessage = data.error.message;
    }
  };
  // Simple function that will configure the Ace editor based on the current state
  var configureEditor = function() {
    // Set the theme
    $scope.editor.setTheme("ace/theme/textmate");
    // Set the mode (Markdown of course)
    $scope.editor.getSession().setMode("ace/mode/markdown");

    if ($scope.file) {
      // If there is a file (new file or edit file mode), configure the editor

      // Make the editor editable
      $scope.editor.setReadOnly(false);
      // Set the editor's tab size to four (I would had chosen two but it seems Marked doesn't handle this for nested
      // lists because if you indent only 3 spaced, sometimes the next level isn't picked up)
      $scope.editor.getSession().setTabSize(4);
      // Use spaces instead of tabs
      $scope.editor.getSession().setUseSoftTabs(true);
      // Set the editor content
      $scope.editor.getSession().setValue($scope.originalFile.content);
      // Since Ace doesn't use a real form input, we can't rely on AngularJS to handle the model binding for us so we
      // need to handle this manually via a change event handler in Ace.
      $scope.editor.getSession().on('change', function() {
        // There was an issue with the revertFile throwing an error ($apply already in progress).
        if ($scope.$$phase !== '$apply') {
          // Since we're updating the model manually, we have to call $scope.$apply to propagate the changes
          $scope.$apply(function() {
            // Set the file's content based on the editor's content
            $scope.file.content = $scope.editor.getValue();
          });
        }
      });
    } else {
      // If there is not a file (list mode), disable the editor
      $scope.editor.setReadOnly(true);
    }

    // Since we resize the Ace editor via JavaScript, we have to call this.
    $scope.editor.resize()
  };

  // Initialize the Ace editor
  $scope.editor = ace.edit("editor");

  // Set the file variable based on the requested file or action
  if (fileIdOrAction === 'new') {
    // Name was omitted to work with AngularJS' approach for required fields and form state (described below).
    $scope.file = {content: '', description: ''};
    // Cloning the file's original content to be able to manually check for the form's changed state.  The reason for
    // this is because AngularJS marks a form/field as dirty even after you've updated all form fields back to their
    // original state.  With this cloned copy, cloned because we don't want to have the clone getting updated as a
    // result of the two-way binding, can then be compared to the current file to see if they are in fact identical
    // or not.
    $scope.originalFile = angular.copy($scope.file);
    configureEditor();
  } else if (fileIdOrAction) {
    // URL path parameters are always string so we have to parseInt them.
    fileIdOrAction = parseInt(fileIdOrAction, 10);
    FileService.getById(fileIdOrAction,
      function (response) {
        // Set the file based on the response
        $scope.file = response;
        // Clone the file as discussed on line 66
        $scope.originalFile = angular.copy($scope.file);
        configureEditor();
      },
      function (response) {
        // Handle the error
        handleError(response);
        // Remove the file from scope
        delete $scope.file;
        configureEditor();
      }
    );
  } else {
    configureEditor();
  }

  // Function used as a workaround to the situation with AngularJS form state management as described on line 64
  $scope.hasChanges = function() {
    // Return whether or not the file and its original state are not equal
    return !angular.equals($scope.file, $scope.originalFile);
  };

  // Reverts the file back to the original version
  $scope.revertFile = function() {
    // Update the file back to its original state
    $scope.file = angular.copy($scope.originalFile);
    // Update the editor's content
    $scope.editor.setValue($scope.file.content);
    // Remove all errors
    delete $scope.errorMessage;
  };

  // Function used for both creating a file and updating a file
  $scope.createOrSaveFile = function () {
    var func = $scope.file.id ? FileService.update : FileService.create;

    func($scope.file,
      function (response) {
        // Navigate to the files list
        $location.path("/files");
      },
      function (response) {
        // Handle the error
        handleError(response);
      }
    );
  };

  // Function used to delete a file
  $scope.deleteFile = function() {
    FileService.delete($scope.file,
      function(response) {
        // Navigate to the files list
        $location.path("/files");
      },
      function(response) {
        // Handle the error
        handleError(response);
      }
    );
  };

  // Function for computing the Markdown representation (as HTML) for the file's contents
  $scope.fileContentAsHTML = function() {
    // This can be called prior to a file existing due to AngularJS so being safe
    if ($scope.file) {
      return marked($('<div/>').text($scope.file.content).html());
    }
  };

  // Function for dictating if there is a file present in this controller or not (Used for UI enablement)
  $scope.hasFile = function() {
    return !angular.isUndefined($scope.file);
  };

}

FileEditorCtrl.$inject = ['$scope', '$routeParams', '$location', 'FileService'];
