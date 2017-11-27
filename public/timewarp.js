(function (exports) {

    function warp(f) {
        var busy = false;
        var latest_args = null;

        function fdecorated(...args) {
            if (busy) {
                latest_args = args;
            }
            else {
                busy = true;
                f(...args);
                busy = false;

                if (latest_args !== null) {
                    latest_args = null;
                    fdecorated(...latest_args);
                }
            }
        }

        return fdecorated;
    }

    function timewarp(time, f) {
        var latest_args = null;

        function fdecorated(...args) {
            latest_args = args;
        }

        setInterval(function() {
            var args = latest_args;
            latest_args = null;
            if (args !== null)
                f(...args);
            },
            time,
        );

        return fdecorated;
    }

    exports.TimeWarp = {
        warp,
        timewarp,
    }
}(window));
