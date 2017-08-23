var fs = require('fs'),
  ws = require('ws'),
  wsServer = ws.Server,
  https = require('https'),
  express = require('express'),
  wsHandler = require('./websocketHandler.js');

var servConfig = {
  port: 8080,
  ssl_key: './ssl/mc.key',
  ssl_cert: './ssl/mc.crt'
};

var app = express();
// server static files in the 'public' folder
app.use(express.static('public'));
// set up routes
app.get('/camera', function(req, res) {
    res.sendFile('public/view.html', {root: __dirname});
});
app.get('/', function(req, res) {
    res.sendFile('public/port.html', {root: __dirname});
});


//create a HTTPS server
var server = https.createServer({
  key: fs.readFileSync( servConfig.ssl_key ),
  cert: fs.readFileSync( servConfig.ssl_cert )
}, app).listen(servConfig.port);

var wsServInstance = new wsServer({server: server});
wsHandler.setUpRoutes(wsServInstance);
