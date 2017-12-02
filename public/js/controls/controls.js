// Dependencies:
// - jQuery
// - controls/date-range
// - controls/region

(function (exports) {
    function init() {
        Controls.DateRange.init();
        Controls.Region.init();

        enableShowHide();
    }

    function enableShowHide() {
        $('.control-panel-hide, .control-panel-show').click(function () {
            $(this).parent().toggleClass('hidden');
        });
    }

    function onChange(callback) {
        var changed = () => callback(get());

        Controls.Region.onChange(changed);
        Controls.DateRange.onChange(changed);
    }

    function get() {
        return {
            region: Controls.Region.get(),
            dateRange: Controls.DateRange.get()
        }
    }


    Object.assign(exports, { init, onChange, get })
}(window.Controls = window.Controls || {}))
