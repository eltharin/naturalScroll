/**
 * @fileoverview naturalScroll - scroll smoothly
 * @version 0.0.2
 * 
 * @license MIT, see http://github.com/asvd/naturalScroll
 * @copyright 2015 asvd <heliosframework@gmail.com> 
 */


(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.naturalScroll = {}));
    }
}(this,
function (exports) {

    var DELAY = 20;
    var TIME = 600;


    var scrollTop = 'scrollTop';
    var scrollLeft = 'scrollLeft';


    /**
     * Calculates the animation and uses the provided setter function
     * to apply the animation frame
     * 
     * @param {Function} setter to apply the animation frame
     */
    var Animator = function(el, setter, prop) {
        this.__prop = prop;
        this.__el = el;
        this.__setter = setter;
        this.__frames = [[0,0,0,0,0,0]];  // frames and diffs
        this.__frameIdx = 0;              // current frame number
        this.__interval = null;
    }


    /**
     * Animates to the desired position within the given time
     * 
     * @param {Number} target
     * @param {Number} time (msec);
     */
    Animator.prototype.slide = function(target, time) {
        var fnum = Math.floor(time / DELAY);
        var frame = this.__frames[this.__frameIdx];

        // prevent animation run slover than the current one
        if (this.__interval !== null) {
            var start = this.__frames[0][0];
            var current = frame[0];
            var dist = current - start;
            var speed = Math.abs(dist / this.__frameIdx);

            if (speed > 0) {
                var newFnum = Math.abs(
                    Math.round((target - current) / speed)
                );

                fnum = Math.max(
                    5, Math.min( fnum, newFnum )
                );
            }

            this.__frameIdx = 0;
        } else {
            // first three frames contain zero value
            this.__frameIdx = 3;
        }

        this.__frames = this.__calculateFrames(
            frame[0], frame[1], frame[2], target, fnum
        );

        if (!this.__interval) {
            var me = this;
            var tick = function() {
                var val = me.__frames[me.__frameIdx++][0];
                me.__setter(val);
                
                if (me.__frameIdx == me.__frames.length) {
                    clearInterval(me.__interval);
                    me.__interval = null;
                    me.__frames = [[val,0,0,0,0,0]];
                    me.__frameIdx = 0;
                }
            }

            this.__interval = setInterval(tick, DELAY);
        }
    }


    /**
     * Updates the value changed by external conditions
     * 
     * @param {Number} value
     */
    Animator.prototype.update = function(value) {
        if (this.__interval === null) {
            this.__frames[this.__frameIdx][0] = value;
        }
    }


    /**
     * Integer-based calculation of the animation frames spline
     * 
     * @param {Number} f0 current value
     * @param {Number} f1 current first difference
     * @param {Number} f2 current second difference
     * @param {Number} target value at the end
     * @param {Number} fnum number of frames
     */
    Animator.prototype.__calculateFrames = function(
        f0, f1, f2, target, fnum
    ) {
        var n = fnum;
        var n2 = n * n;
        var n3 = n2 * n;
        var n4 = n3 * n;
        var n5 = n4 * n;

        var f3, f4, f5;

        // these magic formulae came from outer space
        f3 = -( 9 * f2 * n2 +
                (36 * f1 -9 * f2) * n -
                36 * f1 +
                60 * f0 -
                60 * target
              ) / (n3 - n);
        
        f4 = ( 36 * f2 * n2 +
               (192 * f1 -36 * f2) * n -
               192 * f1 +
               360 * f0 -
               360 * target
             ) / (
                 n4 +
                 2 * n3 -
                 n2 -
                 2 * n
             );
        
        f5 = -( 60 * f2 * n2 +
                (360 * f1 -60 * f2) * n -
                360 * f1 +
                720 * f0 -
                720 * target
              ) / (
                  n5 +
                  5 * n4 +
                  5 * n3 -
                  5 * n2 -
                  6 * n
              );

        var result = [[f0, f1, f2, f3, f4, f5]];

        var lastframe, frame, i, j;
        for (i = 0; i < fnum; i++) {
            lastframe = result[result.length - 1];

            frame = [0, 0, 0, 0, 0, f5];

            for (j = 4; j >= 0; j--) {
                frame[j] = frame[j+1] + lastframe[j];
            }

            result.push(frame);
        }

        return result;
    }
        
    

    // top and left animators intsances
    var animators = {t:[], l:[]};

    /**
     * Returns a function which scrolls the given element to the
     * desired position from top
     * 
     * @param {Boolean} top true to return vertical scrolling function
     * 
     * @returns {Function}
     */
    var scroll = function(top) {
        
        /**
         * Scrolls the given element to the desired position from top
         * 
         * @param {Element} elem to scroll
         * @param {Number} pos to scroll to
         * @param {Number} time (msec) of animation
         */
        return function(elem, pos, time) {
            time = time || TIME;
            elem = elem.scroller || elem;

            var animator = null;
            var animatorsList = animators[top ? 't':'l'];
            var prop = top ? 'scrollTop' : 'scrollLeft';

            for (var i = 0; i < animatorsList.length; i++) {
                if (animatorsList[i].elem == elem) {
                    animator = animatorsList[i];
                    break;
                }
            }

            if (!animator) {
                var setter = function(val) {
                    elem[prop] = val;
                }

                animator = {
                    elem : elem,
                    animator : new Animator(setter)
                };

                elem.addEventListener(
                    'scroll',
                    function() {
                        animator.animator.update(elem[prop]);
                    },
                    0
                );
                
                animator.animator.update(elem[prop]);
                animatorsList.push(animator);
            }

            animator.animator.slide(pos, time);
        }
    }


    exports.scrollTop = scroll(true);
    exports.scrollLeft = scroll(false);
}));
