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
            .then(() => {
                onChange(saveSettings);
                Viz.TaxonomyTree.onToggled(saveSettings);
            });
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

    function saveSettings() {
        var settings = get();
        settings.enabled = settings.taxonomy
            .filter(s => s.isEnabled())
            .map(s => s.key())
        settings.taxonomy = settings.taxonomy.map(s => s.key())

        Cookies.set('controls', settings);
    }

    function loadSettings() {
        var loaded = Cookies.getJSON('controls') || {};

        if (loaded.region) {
            Controls.Region.set(loaded.region);
        }
        if (loaded.dateRange) {
            Controls.DateRange.set(loaded.dateRange);
        }
        if (loaded.taxonomy) {
            Controls.SelectTaxonomy.set(loaded.taxonomy);
        }
        if (loaded.enabled) {
            Taxonomy.root.disable();
            loaded.enabled
                .map(key => key.split('__'))
                .map(type_id => Taxonomy[type_id[0]][type_id[1]])
                .forEach(s => s.enable());
        }
    }


    Object.assign(exports, { init, onChange, get })
}(window.Controls = window.Controls || {}));
