(function() {
  //Set up the handler for various messages the websocket received
  //var serverStates = require('./states.js');
  var messenger = require('./messenger.js');
  exports.setUpRoutes = function(instance) {
    instance.on('connection', function (ws) {
      ws.on('message', function(msg) {
        var message = JSON.parse(msg);
        if(message.type) {
          if(message.type != 'ping') console.log(message);
          switch(message.type) {
            case 'connection_request': 
              if(message.message === 'hub') {
                if(!messenger.isHubConnected()) {
                  messenger.setHubConnection(ws);
                  messenger.respondTo(0, 'connection_accepted', 0);
                  console.log('hub connected');
                } else {
                  //if a hub is already connected, reject this connection request
                  ws.send(JSON.stringify({
                    type: 'connection_rejected',
                    message: 'A hub is already connected',
                    from: -1
                  }));
                }
              } else {
                var newId = messenger.addConnection(ws);
                messenger.respondTo(newId, "connection_accepted", newId);
                console.log(newId, 'cam connected');
              }
              break;
            case 'goodbye':
              if(message.clientType = "hub") {
                //broadcast to all clients that the hub is leaving, and they should clear the RTC
                //connection and wait for the hub comeing back
                messenger.broadcast('hub_gone', '');
              }
              break;
            //keep-alive message
            case 'ping':
              break;
            case 'sdp':
            case 'candidate':
              messenger.sendMessage(message.from, message.to, message.type, message.message);
              break;
            default:
              console.error('Unknown message type', message.type);
          }
        }
      });
    });

  };
}) ();
