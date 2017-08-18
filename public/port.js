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
  //WebRTC streams
  var streams = [];
  var curStreamInd = 0;
  var streamViewElement;

  function checkInputs() {
    return name !== '' && serverAddress !== '';
  }


  //Direction is bool variable; true for incrementing the index, false for decrementing
  //Loop back
  function switchStreamView(direction) {
      curStreamInd = direction ? curStreamInd + 1 : curStreamInd - 1;
      if(curStreamInd >= streams.length) curStreamInd = 0;
      if(curStreamInd < 0) curStreamInd = streams.length - 1;
      if(streamViewElement) {
        streamViewElement.attr('src', streams[curStreamInd].vid);
      }
  }

  function addStreamView(initSource) {
    var vidDiv = $('<div></div>', {
      class: 'camera-view-wrapper',
    });
    var name = $('<div></div>', {
      class: 'camera-view-name',
    });
    var vid = $('<video />', {
      src: initSource,
      //width: 100%,
      height: 480,
      class: 'camera-view',
      autoplay: ''
    });
    var leftButton = $('#view-button-left');
    var rightButton = $('#view-button-right');
    leftButton.css('display', 'inline-block');
    rightButton.css('display', 'inline-block');
    leftButton.click(function() {switchStreamView(false)});
    rightButton.click(function() {switchStreamView(true)});
    streamViewElement = vid;
    vidDiv.css('float', 'left');
    //vidDiv.css('width', '45%');
    vidDiv.css('margin', 'auto');
    vidDiv.css('display', 'inline-block');
    vidDiv.append(vid);
    vidDiv.append(name);
    vidDiv.appendTo($('#video-wrapper'));
  }

  //Add only one video element, which supports switching between the streams
  //FIXME: this sort of return-a-function-from-function is ugly, fix it
  function addStream (id) {
    return function (source) {
      streams.push({id: id, vid: source});
      //if this is the first stream added, create the video videw
      if (streams.length === 1) {
        addStreamView(source);
      }
    }
  }

  function showFeedbackView (stream) {
    //Add local stream to the video element
    $('#self-view').attr('src', stream);
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
      uiCallback: addStream(id)
    };
    pc[id] = RTC.create(false, callbacks);

  }

  // non-hub RTC connections
  function createRTC() {
    var cbs = {
      signalCallback: respondToServer(wsc, state.id, 0),
      uiCallback: showFeedbackView
    };
    pc[0] = RTC.create(true, cbs);

    var feedback = $('#feedback');
    //Make the feedback view full-screen
    feedback[0].webkitRequestFullscreen();
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
