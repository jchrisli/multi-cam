//internal states of the server
(function() {
  //ids of connected clients
  exports.states = {
    connected: [],
    //hub always has id of 0
    isHubConnected: false,
    //next to-be-assigned id; it is ever-increasing except for the hub id, which is always 0
    currentId: 0
  };
  
}) ();
