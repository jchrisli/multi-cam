var RTC = (function () {
  var rtc = {};

  rtc.create = function(isCaller, callbacks) {
    //TODO: add configuration file
    var RTCConstructor = typeof webkitRTCPeerConnection === 'function' ? webkitRTCPeerConnection : RTCPeerConnection; 
    var pc = new RTCConstructor({
      iceServers: [{url: 'stun:stun1.l.google.com:19305'}]
    });

    // send any ice candidates to the other peer
    pc.onicecandidate = function (evt) {
      callbacks.signalCallback({type: 'candidate', content: evt.candidate});
    };

    // once remote stream arrives, show it in the remote video element
    pc.onaddstream = function (evt) {
        callbacks.uiCallback(URL.createObjectURL(evt.stream));
    };
    /*
    pc.ontrack = function(evt) {
      callbacks.uiCallback(evt.streams[0]);
    }
    */

    function gotDescription(desc) {
      pc.setLocalDescription(desc);
      callbacks.signalCallback({type: 'sdp', content: desc}); 
    }

    // get the local stream, show it in the local video element and send it
    if(isCaller) {
      navigator.getUserMedia({ "audio": false, "video": true }, function (stream) {
        //might be a good idea to add self view, but hold for now
        //selfView.src = URL.createObjectURL(stream);
        pc.addStream(stream);
        pc.createOffer(gotDescription, function() {});
      }, function() {});
    } 

    pc.createHubAnswer = function() {
      if(!isCaller) {
        pc.createAnswer(gotDescription, function() {});
      }
    }

    return pc;
  };

  return rtc;
} ());
