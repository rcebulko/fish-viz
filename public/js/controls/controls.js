// Dependencies:
// - jQuery
// - Controls.Control

(function (Controls) {
    function init() {
        console.info('Initializing controls');

        enableShowHide();


        return Promise.all([
            Controls.SplitPane.init([100, 250]),
            Controls.Region.init('FLA KEYS'),
            Controls.DateRange.init(
                [2013, 2016].map(d => new Date('' + d).getTime())),
            Controls.SelectTaxonomy.init({ selected: [], enabled: [] }),
        ]);
    }

    function enableShowHide() {
        $('.control-panel-toggle').click(function () {
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
            loaded.enabled.map(Taxonomy.fromKey).forEach(s => s.enable());
        }
    }


    Object.assign(Controls, { init, onChange, get })
}(window.Controls = window.Controls || {}));
