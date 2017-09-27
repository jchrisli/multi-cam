function SuggestionManager(videoVis) {
    var TAG = 'SuggestionManager';

    var vidVis = videoVis;

    function vec2angle (vec) {
        var angle;
        angle = (Math.atan2(vec.y, vec.x) * 360 / 2 / Math.PI + 360);
        angle = angle >= 360 ? angle - 360 : angle;
        //console.log(TAG, angle);
        return angle;
    }

    this.onTranslate = function (direction) {
        vidVis.drawArrow ('straight', vec2angle(direction));
    };

    this.onSuggestionEnd = function () {
        videoVis.hideArrow();  
    };

    this.onRotate = function (direction) {
        videoVis.drawArrow('curved', vec2angle(direction));
    };
}