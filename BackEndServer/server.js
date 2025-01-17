/*


Summary: The server.js is used to start the backend server.
*/

const path = require('path')

var express = require('express');
var serveStatic = require('serve-static');
var app = require('./controller/app.js');

var port = 8081;
app.use(express.static(path.join(__dirname, '../FrontEndServer/Public')))
var server = app.listen(port, function(){
    console.log('Web App Hosted at http://localhost:%s', port);
});