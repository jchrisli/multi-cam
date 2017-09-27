//view.js
//Camera UI management

//Show error message
function notify(message) {
  $('#error-message').html(message);
}

function setUpCam() {
  var state = {
    open: false,
    id: -2,
    isHub: false
  };
  //peer connections are keyed by non-hub end id number
  //WebRTC streams
  var pc = new Map();
  var wsc = null;

  // Processing and displaying suggestions from the other end
  var vidVis =  new VideoVis({
    element: $('#move-suggestion-vis')[0]
  });
  var sugManager = new SuggestionManager(vidVis);
/*
  document.onresize = function () {
    vidVis.updateCanvasSize();
  }
*/
  function checkInputs() {
    return name !== '' && serverAddress !== '';
  }

  function showFeedbackView (stream) {
    //Add local stream to the video element
    $('#self-view').attr('src', stream);
  }

  function hideAll() {
    $('#connect').hide();
    $('#video-wrapper').hide();
  }

  // non-hub RTC connections
  function createRTC() {
      if(wsc) {
          var cbs = {
              signalCallback: wsc.createRespondToServerHandle(state.id, 0),
              uiCallback: showFeedbackView
          };
          pc.set(0, RTC.create(true, cbs));

          var feedback = $('#feedback'),
              feedbackVid = $('#self-view');
          //Make the feedback view full-screen
          //feedback[0].webkitRequestFullscreen();
          feedback.css('height', '100%');
          feedbackVid.css('height', 'auto');
          console.log('Height changed to', feedback[0].getBoundingClientRect().height);
          vidVis.updateCanvasSize();
      } else {
          notify('No signalling channel found.');
      }
  }

  //Start the WebSocket connection to the signal server
  function wsConnect(disableCallback) {
    var name = $('#name-input').val();
    var serverAddress = $('#server-address-input').val();
    if(name && serverAddress) {
      wsc = new SignalChannel(serverAddress, state, pc, null, notify, null, sugManager);
      disableCallback();
    } else {
      notify('Name or server address cannot be empty.');
    }
  }

  $('#connect-as-cam').on('click', function(evt) {
    state.isHub = false;
    wsConnect(function () {
        //TODO: change to disconnect
      $('#connect-as-cam').prop('disabled', true);
      $('#stream').prop('disabled', false);
    });
  });

  $('#stream').on('click', function(evt) {
    createRTC();
  });

  //Ignoring 'https://'
  var defaultUrl = window.location.href.substring(8),
    urlEndInd = defaultUrl.indexOf('/');

  $('#server-address-input').val(defaultUrl.substring(0, urlEndInd));

  //Interface to the UnityScript
  return {
      //return nothing for now
  };
}

var videoPlayer = setUpCam();
