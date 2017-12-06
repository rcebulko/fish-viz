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
        ]).then(() => Controls.History.init(Controls.registered));
    }

    function enableShowHide() {
        $('.control-panel-toggle').click(function () {
            $(this).parents('.control-panel').toggleClass('hidden');
        });
    }

    function onChanged(callback) {
        ['Region', 'DateRange', 'SelectTaxonomy']
            .forEach(Ctl => Controls[Ctl].onChanged(() => callback()));
    }

    // function saveSettings() {
    //     var settings = get();
    //     settings.enabled = settings.taxonomy
    //         .filter(s => s.isEnabled())
    //         .map(s => s.key())
    //     settings.taxonomy = settings.taxonomy.map(s => s.key())

    //     Cookies.set('controls', settings);
    // }

    // function loadSettings() {
    //     var loaded = Cookies.getJSON('controls') || {};

    //     if (loaded.region) {
    //         Controls.Region.set(loaded.region);
    //     }
    //     if (loaded.dateRange) {
    //         Controls.DateRange.set(loaded.dateRange);
    //     }
    //     if (loaded.taxonomy) {
    //         Controls.SelectTaxonomy.set(loaded.taxonomy);
    //     }
    //     if (loaded.enabled) {
    //         Taxonomy.root.disable();
    //         loaded.enabled.map(Taxonomy.fromKey).forEach(s => s.enable());
    //     }
    // }


    Object.assign(Controls, { init, onChanged })
}(window.Controls = {}));
