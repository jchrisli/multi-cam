/* global Snap */
function VideoVis (config) {
    var svg = Snap(config.element),
    // The stupid bbox never works
        canvasHeight = $('#move-suggestion-vis')[0].getBoundingClientRect().height,
        canvasWidth = $('#move-suggestion-vis')[0].getBoundingClientRect().width;
    //Set up svgs 
    var curved, straight;

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
        canvasHeight = $('#move-suggestion-vis')[0].getBoundingClientRect().height;
        canvasWidth = $('#move-suggestion-vis')[0].getBoundingClientRect().width;
    }

    /// Draw the straight arrow, rotated by angle
    this.drawStraightArrow = function (angle) {
        //Hide other symbols
        this.hideCurvedArrow();
        //The svg fragment might not have been loaded yet
        if(straight) {
            let eleWidth = straight.attr('width'),
                eleHeight = straight.attr('height');
            let mat = new Snap.Matrix();
            //Translate first
            mat.translate(canvasWidth / 2 - eleWidth / 2, canvasHeight * 0.8 - eleHeight / 2);
            mat.rotate(angle, eleWidth / 2, eleHeight / 2);
            mat.scale(0.5, 0.5, eleWidth / 2, eleHeight / 2);
            //TODO: add animation
            straight.transform(mat.toTransformString());
            straight.attr({
                display: 'block'
            });
        }
    }

    this.hideStraightArrow = function () {
        if(straight) {
            straight.attr({
                display: 'none'
            });
        }
    }
    
    /// Draw the straight arrow, rotated by angle
    this.drawCurvedArrow = function (isCounterClockwise) {
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
    
    this.hideCurvedArrow = function () {
        if(curved) {
            curved.attr({
                display: 'none'
            });
        }
    }
    
    
}