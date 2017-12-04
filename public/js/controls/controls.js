// Dependencies:
// - jQuery
// - JS Cookie
// - controls/date-range
// - - noUiSlider
// - controls/region
// - controls/select-taxonomy
// - - Select2
// - - Taxonomy

(function (exports) {
    function init() {
        console.info('Initializing controls');

        enableShowHide();

        Controls.DateRange.init();
        Controls.Region.init();
        return Controls.SelectTaxonomy.init()
            .then(loadSettings)
            .then(() => onChange(saveSettings));
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
        Controls.SelectTaxonomy.onChange(changed);
    }

    function get() {
        return {
            region: Controls.Region.get(),
            dateRange: Controls.DateRange.get(),
            taxonomy: Controls.SelectTaxonomy.get(),
        }
    }

    function saveSettings(controlName) {
        var settings = get();
        settings.taxonomy = settings.taxonomy.map(s => s.key())

        Cookies.set('settings', settings);
    }

    function loadSettings() {
        var loaded = Cookies.getJSON('settings') || {};

        if (loaded.region) {
            Controls.Region.set(loaded.region);
        }
        if (loaded.dateRange) {
            Controls.DateRange.set(loaded.dateRange);
        }
        if (loaded.taxonomy) {
            Controls.SelectTaxonomy.set(loaded.taxonomy);
        }
    }


    Object.assign(exports, { init, onChange, get })
}(window.Controls = window.Controls || {}));
