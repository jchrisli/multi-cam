/* global Snap */
function VideoVis (config) {
    var svg = Snap(config.element),
    // The stupid bbox never works
        //dpr = window.devicePixelRatio,
        canvasHeight = $('#feedback')[0].getBoundingClientRect().height,
        canvasWidth = $('#feedback')[0].getBoundingClientRect().width;
    
    console.log('initial width', canvasWidth);
    console.log('initial height', canvasHeight);
    //Set up svgs 
    var curved, straight;
    var self = this;

    function initArrows (arrowSvgData, arrowSvgId) {
        var arrow = arrowSvgData.select('#' + arrowSvgId);
        svg.append(arrow);

        arrow.attr({
            display: 'none'
        });
        return arrow;
    }

    Snap.load('res/curve.svg', (data) => {
        curved = initArrows(data, 'curved_arrow');
    });
    
    Snap.load('res/straight.svg', (data) => {
        straight = initArrows(data, 'straight_arrow');
    });

    /// To be called when canvas size changed
    this.updateCanvasSize = function () {
        canvasHeight = $('#feedback')[0].getBoundingClientRect().height;
        canvasWidth = $('#feedback')[0].getBoundingClientRect().width;
        console.log('canvasHeight', canvasHeight);
        console.log('canvasWidth', canvasWidth);
    }

    // Update canvas width and height upon device orientation change
    /* This event is not working in Chrome */
    window.onorientationchange = () => {
        setTimeout(function() {
            self.updateCanvasSize();
        }, 500);
    }

    /// Draw the straight arrow, rotated by angle
    this.drawArrow = function (type, angle) {
        var arrow = null;
        this.hideArrow();

        if(type === 'straight') arrow = straight;
        else if(type === 'curved') arrow = curved;
        else console.error('drawArrow:', 'wrong arrow type');
        //The svg fragment might not have been loaded yet
        
        if(arrow) {
            let eleWidth = arrow.attr('width'),
                eleHeight = arrow.attr('height');
            let mat = new Snap.Matrix();
            //Translate first
            mat.translate(canvasWidth / 2 - eleWidth / 2, canvasHeight * 0.5 - eleHeight / 2);
            mat.rotate(angle, eleWidth / 2, eleHeight / 2);
            //let flip = type === 'curved' && ((angle > 0 && angle < 90) || (angle > 270 && angle < 360)) ? -1 : 1;
            let flip = 1;
            mat.scale(0.5, 0.5 * flip, eleWidth / 2, eleHeight / 2);
            //TODO: add animation
            arrow.transform(mat.toTransformString());
            arrow.attr({
                display: 'block'
            });
        }
    }

    this.hideArrow = function () {
        [straight, curved].forEach((shape) => {
            if(shape) {
                shape.attr({
                    display: 'none'
                });
            }
        });
    };
    /*
    /// Draw the straight arrow, rotated by angle
    this.drawCurvedArrow = function (angle) {
        //Hide other symbols
        this.hideStraightArrow();
        //The svg fragment might not have been loaded yet
        if(curved) {
            let eleWidth = curved.attr('width'),
                eleHeight = curved.attr('height');
            let mat = new Snap.Matrix();
            //Translate first
            let flip = isCounterClockwise ? -1 : 1;
            mat.translate(canvasWidth / 2 - eleWidth / 2, canvasHeight * 0.8 - eleHeight / 2);
            mat.scale(0.5, 0.5 * flip, eleWidth / 2, eleHeight / 2);
            //TODO: add animation
            curved.transform(mat.toTransformString());
            curved.attr({
                display: 'block'
            });
        }
    }
    */
    this.hideCurvedArrow = function () {
        if(curved) {
            curved.attr({
                display: 'none'
            });
        }
    }
    
    
}