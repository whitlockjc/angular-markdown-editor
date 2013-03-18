# This is a very simple [Express.js](http://expressjs.com/) server used as an example backend for the web-based
# [Markdown](http://daringfireball.net/projects/markdown/) editor written using
# [AngularJS](http://angularjs.org/).  This backend is the minimal amount necessary to not only serve the web-based
# client but also to expose a REST API for CRUD operations on the Markdown files managed in this application.

# The [Express.js](http://expressjs.com/) module
express = require('express')
# Core [Node.js](http://nodejs.org/) modules
http = require('http')
path = require('path')
fs = require('fs')
# Underscore.js module
_ = require('underscore')
# Create the Express.js application
app = express()
# Application variables
savedFiles = {}
lastId = 0
# Function that returns if the file, based on its name, is a duplicate
isDuplicateFile = (newFile) ->
  (_.find savedFiles, (file) -> newFile.name? and newFile.name is file.name and newFile.id isnt file.id)?
# Function that handles when there is a duplicate file attempting to be created/updated
handleDuplicate = (res, file) ->
  res.json 405, {
    error:
      message: "File already exists with the name of '#{file.name}'."
  }
# Function that returns if the file is valid
isValidFile = (file) ->
  file.name? and file.content? and not _.isEmpty file.name
# Function that handles when there is an invalid file attempting to be created/updated
handleInvalidFile = (res, file) ->
  badFields = {}
  for field in ['name', 'content']
    if not file[field]? or (field is 'name' and _.isEmpty(file[field]))
      res.json 405, {error: {message: "'#{field}' is a required field."}}
      return
# Function that handles when there is a file requested that doesn't exist
handleFileNotFound = (res, fileId) ->
  res.json 404, {error: {message: "No saved file on the server with an id of #{fileId}."}}

# Configure Express.js (This is not a production-ready environment.)
app.configure ->
  app.set 'port', process.env.PORT or 3000
  # Turn off layout processing since we'll not be using it
  app.set 'view options', {layout: false}
  # Use Express.js' favicon
  app.use express.favicon()
  # Use Express.js features for processing content from the client
  app.use express.bodyParser()
  # Use the Express.js router
  app.use app.router
  # Use Express.js features for serving the web-based client
  app.use express.static(path.join(__dirname, 'public'))
  # Set Express.js logger to 'dev' level
  app.use express.logger('dev')
  # Use the Express.js error handler to allow for custom error responses
  app.use express.errorHandler()

# ##Routes

# Route to get a list of saved files
app.get '/api/files', (req, res) ->
  res.json _.values savedFiles

# Route to create a saved file
app.post '/api/files', (req, res) ->
  newFile = req.body

  if isDuplicateFile newFile
    handleDuplicate res, newFile
  else
    if isValidFile newFile
      newFile['id'] = lastId += 1
      newFile['created'] = new Date()
      savedFiles[newFile.id] = newFile
      res.json newFile
    else
      handleInvalidFile res, newFile

# Route to get a saved file by id
app.get '/api/files/:id', (req, res) ->
  fileId = req.params.id
  if _.has savedFiles, fileId then res.json(savedFiles[fileId]) else handleFileNotFound(res, fileId)

# Route to update a saved file by id
app.put '/api/files/:id', (req, res) ->
  fileId = req.params.id
  updatedFile = req.body
  if _.has savedFiles, fileId
    if isValidFile updatedFile
      if isDuplicateFile updatedFile
        handleDuplicate res, updatedFile
      else
        savedFiles[fileId] = updatedFile
        res.json savedFiles[fileId]
    else
      handleInvalidFile res, updatedFile
  else
    handleFileNotFound res, fileId

# Route to delete a saved file by id
app.delete '/api/files/:id', (req, res) ->
  fileId = req.params.id
  if _.has savedFiles, fileId
    deletedFile = savedFiles[fileId]
    delete savedFiles[fileId]
    res.json deletedFile
  else
    handleFileNotFound res, fileId

# Start the server
http.createServer(app).listen app.get('port'), ->
  console.log 'Express server listening on port ' + app.get('port')
