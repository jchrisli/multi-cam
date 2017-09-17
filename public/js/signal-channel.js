//WebSocket object
//FIXME: Use settings, successCallback, failureCallback as parameters
function SignalChannel(serverUrl, state, pc, closeCallback, uiCallback, rtcCallback, suggestionManager) {
    var connection = new WebSocket('wss://' + serverUrl);
    connection.onopen = function(evt) {
      //send a hello message to get id
      if(state.isHub) {
        // -2 is just a placeholder; at this point no id has been assigned yet
        // -1 for the signaling server itself
        signalToServer(-2, -1, 'connection_request', 'hub');
      } else {
        signalToServer(-2, -1, 'connection_request', '');
      }
    };
    connection.onclose = closeCallback;
    connection.onmessage = WSMessageHandler(uiCallback); //defined below

    function signalToServer (from, to, type, message) {
      var toSend = {
        type: type,
        from: from,
        to: to,
        message: message
      };
      var signal = JSON.stringify(toSend);
      connection.send(signal);
      console.log(signal);
    }
    this.signalToServer = signalToServer;
    function createRespondToServerHandle (from, to) {
        var fn = function(rtcSignal) {
          if(rtcSignal.type === 'candidate' || rtcSignal.type === 'sdp') {
            signalToServer(from, to, rtcSignal.type, rtcSignal.content);
          } else console.error('The signal message cannot be parsed. Wrong type.');
        }
        return fn;
    }
    this.createRespondToServerHandle = createRespondToServerHandle;

    function WSMessageHandler(updateCB) {
      return function(evt) {
        var message = JSON.parse(evt.data);
        console.log(message);
        switch(message.type) {
          case 'connection_accepted':
            //update states
            state.open = true;
            state.id = message.message;
            setInterval(function () {signalToServer(state.id, -1, 'ping', '');}, 500);
            break;
          case 'connection_rejected':
            state.open = false;
            updateCB('Connection request rejected: ' + message.message);
            break;
          case 'sdp':
          case 'candidate':
            //add one RTC connection
            if(state.isHub === true && !pc.get(message.from)) {
                //Create hub rtc connection
              let rsh = createRespondToServerHandle(0, message.from);
              rtcCallback(rsh, message.from);
            }
            if(pc.get(message.from)) {
                let peerconnection = pc.get(message.from);
              if(message.type === 'sdp') {
                peerconnection.setRemoteDescription(new RTCSessionDescription(message.message),
                function() {
                  if(state.isHub === true) {
                    peerconnection.createHubAnswer();
                  }
                }, function() {});
              } else {
                if(message.message) {
                  peerconnection.addIceCandidate(new RTCIceCandidate(message.message));
                }
              }
            } else updateCB('RTC error: RTC channel not established.');
            break;
          case 'name':
            //$('#cam-vid-' + message.from).html('Camera ' + message.message);
            //TODO: add names to the stream view
            break;
          case 'suggestion': {
              let suggestion = message.message;
              if(suggestion.type === 'translate') {
                  suggestionManager.onTranslate(suggestion.value);
              } else if(suggestion.type === 'translateend') {
                  suggestionManager.onTranslateEnd();
              }
            }
            break;
          default:
            updateCB('WebSocket error: Unknow message type.');
        }
      };
    }
}
