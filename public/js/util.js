// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    var timeout;

    return function () {
        var context = this,
            args = arguments,
            callNow = immediate && !timeout,
            later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

function throttle(func, wait) {
    var ready = true;

    return function () {
        if (ready) {
            ready = false;
            setTimeout(() => ready = true, wait);
            func.apply(this, arguments);
        }
    };
}

function hash(s) {
    /* Simple hash function. */
    var a = 1, c = 0, h, o;
    if (s) {
        a = 0;
        /*jshint plusplus:false bitwise:false*/
        for (h = s.length - 1; h >= 0; h--) {
            o = s.charCodeAt(h);
            a = (a<<6&268435455) + o + (o<<14);
            c = a & 266338304;
            a = c!==0?a^c>>21:a;
        }
    }
    return String(a);
};
