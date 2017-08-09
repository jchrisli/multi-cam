(function() {
  //array of {id:Number, connection:ws_connection} objects
  var connections = {};
  //array of Number, id of open connections
  //var connected = [];
  //Ever increasing id to be assigned to the next coming connection
  var nextId = 1;
  var hubConnection = null;
  //var isHubConnected = false;
  //send message to all but a few (exceptFor)
  exports.isHubConnected = function() {
    return hubConnection !== null;
  };
  exports.addConnection = function(conn) {
    connections[nextId] = conn;
    //connected.push
    nextId++;
    return nextId - 1;
  }
  exports.removeConnection = function(conn) {
    for(var k in connections) {
      if(connections.hasOwnProperty(k) && connections[k] === conn) {
        //it seems it's safe to delete object key (at least the one currently being 
        //iterated) over during iteration
        delete connections[k];
      }
    }
  };
  exports.resetHubConnection = function() {
    hubConnection = null;
  };
  exports.setHubConnection = function(conn) {
    hubConnection = conn;
  };
  function sendMessage(from, to, type, message) {
    var connection = (to === 0 ? hubConnection : connections[to]);
    if(connection) {
      var msg = {
        type: type,
        message: message,
        from: from
        //to: to
      }
      connection.send(JSON.stringify(msg));
    } else {
      console.error('The connection for', to, 'is gone.');
    }
  };

  exports.sendMessage = sendMessage;
/*
  exports.sendToHub = function(from, type, message) {
    sendMessage(from, 0, type, message);
  };

  exports.sendTo = function(to, type, message) {
    sendMessage(0, to, type, message);
  };
  */

  //-1 signifies that this is a server response, not from the hub
  exports.respondTo = function(to, type, message) {
    sendMessage(-1, to, type, message);
  };

  exports.broadcast = function(type, message) {
    for(var k in connections) {
      if(connections.hasOwnProperty(k)) {
        //it seems it's safe to delete object key (at least the one currently being 
        //iterated) over during iteration
        exports.sendTo(k, type, message);
      }
    }
  };
}) ();
