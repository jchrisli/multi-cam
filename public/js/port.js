//port.js
//Hub UI management
/*
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
*/
//Unity instance
var gameInstance = null;

function notify(message) {
    console.error(message);
  $('#error-message').html(message);
}

function setUpHub() {
  var state = {
    open: false,
    id: -2,
    isHub: false
  };
  //peer connections are keyed by non-hub end id number
  var pc = new Map();
  var wsc = null;
  //WebRTC streams
  var streams = [];
  var curStreamInd = 0;
  var streamViewElement;

  function checkInputs() {
    return name !== '' && serverAddress !== '';
  }

  // Gesture detection on video
  var vidGesture;

  //Direction is bool variable; true for incrementing the index, false for decrementing
  //Loop back
  function switchStreamView(direction) {
      curStreamInd = direction ? curStreamInd + 1 : curStreamInd - 1;
      if(curStreamInd >= streams.length) curStreamInd = 0;
      if(curStreamInd < 0) curStreamInd = streams.length - 1;
      if(streamViewElement) {
        streamViewElement.attr('src', streams[curStreamInd].vid);
        if(vidGesture) vidGesture.setCurrentSource(streams[curStreamInd].id);
      }
  }

  //To be called by the Unity Script
  function setStreamView(id) {
      let target = streams.find(streamObj => streamObj.id === id);
      if(target) {
          streamViewElement.attr('src', target.vid);
          if(vidGesture) vidGesture.setCurrentSource(id);
      } else console.error('Cannot switch to stream ' + id + ': not found.');
  }

  function addStreamView(initSource, initId) {
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

    // Initiate gesture detection
    vidGesture = new VideoGesture({
      element: ($('.camera-view').first())[0],
      connection: wsc
    });
    vidGesture.setCurrentSource(initId);
  }

  //Add only one video element, which supports switching between the streams
  //FIXME: this sort of return-a-function-from-function is ugly, fix it
  function addStream (id) {
    return function (source) {
      streams.push({id: id, vid: source});
      //Notify the webgl app of the new stream
      gameInstance.SendMessage('Scene', 'AddCam', id);
      //if this is the first stream added, create the video videw
      if (streams.length === 1) {
        addStreamView(source, id);
      }
    }
  }
/*
  function showFeedbackView (stream) {
    //Add local stream to the video element
    $('#self-view').attr('src', stream);
  }
*/
  function hideAll() {
    $('#connect').hide();
    $('#video-wrapper').hide();
  }
/*
  function respondToServer(wsConnection, from, to) {
    var fn = function(rtcSignal) {
      if(rtcSignal.type === 'candidate' || rtcSignal.type === 'sdp') {
        signalToServer(wsConnection, from, to, rtcSignal.type, rtcSignal.content);
      } else console.error('The signal message cannot be parsed. Wrong type.');
    }
    return fn;
  }
*/
  function createHubRTC(signalCB, id) {
    var callbacks = {
      signalCallback: signalCB,
      uiCallback: addStream(id)
    };
    pc.set(id, RTC.create(false, callbacks));
  }
/*
  // non-hub RTC connections
  function createRTC() {
    var cbs = {
      signalCallback: respondToServer(wsc, state.id, 0),
      uiCallback: showFeedbackView
    };
    pc.set(0, RTC.create(true, cbs));

    var feedback = $('#feedback');
    //Make the feedback view full-screen
    feedback[0].webkitRequestFullscreen();
  }
*/

  function wsConnect(successCallback) {
    var name = $('#name-input').val();
    var serverAddress = $('#server-address-input').val();
    if(name && serverAddress) {
      wsc = new SignalChannel(serverAddress, state, pc, null, notify, createHubRTC, null);
      successCallback();
    } else {
      notify('name or server address cannot be empty.');
    }
  }

  //button event handlers
  $('#connect-as-hub').on('click', function(evt) {
    state.isHub = true;
    wsConnect(function () {
        $('#connect-as-hub').html('Connected');
        $('#connect-as-hub').prop('disabled', true)
        gameInstance = UnityLoader.instantiate("gameContainer", "unity_build/Build/unity_build.json", {onProgress: UnityProgress});
    });
  });

  var defaultUrl = window.location.href;

  $('#server-address-input').val(defaultUrl.substring(8, defaultUrl.length - 1));

  //Interface to the UnityScript
  return {
      setStreamView: setStreamView
  };
}

var videoPlayer = setUpHub();
