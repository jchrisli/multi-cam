//port.js
//WebSocket signaling and UI management

function signalToServer(connection, from, to, type, message) {
  var toSend = {
    type: type,
    from: from,
    to: to,
    message: message
  }
  connection.send(JSON.stringify(toSend));
}


function setUpWebSocket(serverUrl, isHub, closeCallback, messageCallback) {
  var connection = new WebSocket('wss://' + serverUrl);
  connection.onopen = function(evt) {
    //send a hello message to get id
    if(isHub) {
      // -2 is just a placeholder; at this point no id has been assigned yet
      // -1 for the signaling server itself
      signalToServer(connection, -2, -1, 'connection_request', 'hub'); 
    } else {
      signalToServer(connection, -2, -1, 'connection_request', ''); 
    }
  };
  connection.onclose = closeCallback;
  connection.onmessage = messageCallback;
  return connection;
}

function notify(message) {
  $('#error-message').html(message);
}

function setUp() {
  var state = {
    open: false,
    id: -2,
    isHub: false
  };
  //peer connections are keyed by non-hub end id number
  var pc = {};
  var wsc = null;

  function checkInputs() {
    if(name === '' || serverAddress === '') {
      return false;
    } else return true;
  }

  //Hub UI callback
  function addStreamView (id) {
    return function (source) {
      var vidDiv = $('<div></div>', {
        class: 'camera-view-wrapper',
        id: 'cam-wrapper-' + id
      });
      var name = $('<div></div>', {
        class: 'camera-view-name',
        id: 'cam-name-' + id
      });
      var vid = $('<video />', {
        src: source,
        //width: 100%,
        height: 480,
        id: 'cam-vid-' + id,
        class: 'camera-view',
        autoplay: ''
        //class: 'col-md-6 col-sm-12'
      });
      vidDiv.css('float', 'left');
      //vidDiv.css('width', '45%');
      vidDiv.css('margin', 'auto');
      vidDiv.append(vid);
      vidDiv.append(name);
      vidDiv.appendTo($('#video-wrapper'));
    }
  }

  function hideAll() {
    $('#connect').hide();
    $('#video-wrapper').hide();
  }

  function respondToServer(wsConnection, from, to) {
    var fn = function(rtcSignal) {
      if(rtcSignal.type === 'candidate' || rtcSignal.type === 'sdp') {
        signalToServer(wsConnection, from, to, rtcSignal.type, rtcSignal.content);
      } else console.error('The signal message cannot be parsed. Wrong type.');
    }
    return fn;
  }

  function createHubRTC(id) {
    var callbacks = {
      signalCallback: respondToServer(wsc, 0, id),
      uiCallback: addStreamView(id)
    }
    pc[id] = RTC.create(false, callbacks);
  }

  // non-hub RTC connections
  function createRTC() {
    var cbs = {
      signalCallback: respondToServer(wsc, state.id, 0),
      uiCallback: null
    };
    pc[0] = RTC.create(true, cbs);
  }

  function WSMessageHandler(updateCB) {
    return function(evt) {
      var message = JSON.parse(evt.data);
      console.log(message);
      switch(message.type) {
        case 'connection_accepted': 
          state.open = true;
          state.id = message.message;
          setInterval(function () {signalToServer(wsc, state.id, -1, 'ping', '');}, 500);
          break;
        case 'connection_rejected':
          state.open = false;
          updateCB('Connection request rejected: ' + message.message); 
          break;
        case 'sdp':
        case 'candidate':
          //add one RTC connection
          if(state.isHub === true && !pc[message.from]) {
            createHubRTC(message.from);
          }
          if(pc[message.from]) {
            if(message.type === 'sdp') {
              pc[message.from].setRemoteDescription(new RTCSessionDescription(message.message),
              function() {
                if(state.isHub === true) {
                  pc[message.from].createHubAnswer();
                }
              }, function() {});
            } else {
              if(message.message) {
                pc[message.from].addIceCandidate(new RTCIceCandidate(message.message));
              }
            }
          } else updateCB('RTC error: RTC channel not established.');
          break;
        case 'name':
          $('#cam-vid-' + message.from).html('Camera ' + message.message); 
          break;
        default:
          updateCB('WebSocket error: Unknow message type.');
      }
    };
  }

  function wsConnect(isHub, disableCallback) {
    var name = $('#name-input').val();
    var serverAddress = $('#server-address-input').val();
    if(name && serverAddress) {
      wsc = setUpWebSocket(serverAddress, isHub, null, WSMessageHandler(notify));
      disableCallback();
    } else {
      notify('name or server address cannot be empty.');
    }
  }

  //button event handlers
  $('#connect-as-hub').on('click', function(evt) {
    state.isHub = true;
    wsConnect(true, function () {
      $('#connect-as-cam').prop('disabled', true);
      $('#stream').prop('disabled', true);
    });
  });

  $('#connect-as-cam').on('click', function(evt) {
    state.isHub = false;
    wsConnect(false, function () {
      $('#connect-as-hub').prop('disabled', true);
    });
  });

  $('#stream').on('click', function(evt) {
    createRTC();
  });
  var defaultUrl = window.location.href;

  $('#server-address-input').val(defaultUrl.substring(8, defaultUrl.length - 1));
}

setUp();
