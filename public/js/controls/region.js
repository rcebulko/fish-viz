// Dependencies:
// - jQuery

window.Controls = window.Controls || {};
(function (exports) {
    var $region = $(),
        region = '';


    function init() {
        console.info('Initializing region selection control');

        $region = $('.geo-region');
        $region.change(changed);
        changed();
    }

    function changed() {
        region = $region.val();
        console.info('Set region to %s', region);
    }

    function onChange(callback) {
        $region.change(() => callback(region));
    }

    function get() { return region; }


    Object.assign(exports, { init, onChange, get });
}(window.Controls.Region = {}));
