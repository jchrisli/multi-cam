/// Gestutures on the video video, for signalling camera position change requests

function VideoGesture(config) {
    var vidEle = config.element || null,
        conn = config.connection || null,
        sourceId = -1, //Id of the video source
        prevPanPos = {x: -1, y: -1},
        currentPanPos = {x: -1, y: -1},
        prevPinchCenter  = {
            x: -1,
            y: -1
        },
        curPinchContacts = {
            x: -1,
            y: -1
        };

    //Constants
    var TWO_FINGER_PAN_MAX_SCALE = 1.1,
        TWO_FINGER_PAN_MIN_SCALE = 0.9;
    
    if(!vidEle || !conn) {
        console.error('VideoGesture cannot be initiated. Wrong config.');
    }

    /// Pass in the id of the current video, which will be sent along with suggestion data to the
    /// server
    this.setCurrentSource = function (id) {
        sourceId = id;
    }  
    
    ////// Gesture recognition /////
    var gestureRecognizer = new Hammer.Manager(vidEle, {}),
        panRec = new Hammer.Pan(),
        pinchRec = new Hammer.Pinch();//use pinch gesture to detect two-finger pan and pinch
    gestureRecognizer.add(panRec);
    gestureRecognizer.add(pinchRec);

    gestureRecognizer.on('panstart', function(evt) {
        prevPanPos = evt.center;
        console.log('panstart evt:', evt);
    });
    
    gestureRecognizer.on('pan', function(evt) {
        currentPanPos = evt.center;
        //TODO: emit an message for the new suggested direction
        var vec = {
            x: currentPanPos.x - prevPanPos.x,
            y: currentPanPos.y - prevPanPos.y
        };
        // Normalize the vector
        /*
        var vecMod = vec.x * vec.x + vec.y * vec.y;
        vec.x = vec.x / vecMod;
        vec.y = vec.y / vecMod;
        */
        //prevPanPos = currentPanPos;
        //console.log('pan evt:', evt);
        sendMessage('translate', vec);
    });
    
    gestureRecognizer.on('panend', function (evt) {
        //TODO: emit an message for the ending of a direction suggestion
        //console.log('panend evt:', evt);
        sendMessage('suggestionend', null);
    });

    gestureRecognizer.on('pinchstart', function (evt) {
        //prevPinchContacts
        //console.log('pinchstart evt:', evt);
        prevPinchCenter = evt.center;
    });
    
    gestureRecognizer.on('pinchmove', function(evt) {
        //console.log('pinchmove evt:', evt);
        //Make sure it is actually a two-finger pan
        if(evt.scale < TWO_FINGER_PAN_MAX_SCALE && evt.scale > TWO_FINGER_PAN_MIN_SCALE) {
            let dir = {
                x: evt.center.x - prevPinchCenter.x,
                y: evt.center.y - prevPinchCenter.y,
            };

            //Send a message 
            sendMessage('rotatestart', dir);
        }
    });
    
    gestureRecognizer.on('pinchend', function(evt) {
        //console.log('pinchend evt:', evt);
        //One method to end them all
        sendMessage('suggestionend', null);
    });

    ///// Communication /////
    function sendMessage(type, data) {
        //
        // Six type of movement messages : translate, translateend, rotate, rotateend, zoom, zoomend
        // Data for translate: {x: number, y: number} direction vector
        // Data for rotate: {x: number, y: number} direction vector
        // Data for zoom: {in: boolean} zoom in or out
        //
        var message  = {
            type: type,
            value: data
        };
        if(sourceId !== -1) conn.signalToServer(0, sourceId, 'suggestion', message);
        else console.error('VideoGesture', 'will not send gesture message as no video source is specified.');
    }

}