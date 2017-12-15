(function (Controls, Config) {
    function init() {
        console.info('Initializing controls');

        enableShowHide();


        return Promise.all([
            Controls.SplitPane.init([100, 250]),
            Controls.MouseAction.init(),
            Controls.LassoSelect.init(),
            Controls.Region.init(Config.initRegion),
            Controls.DateRange.init(Config.initDateRange
                .map(d => new Date('' + d).getTime())),
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

    function get(property) {
        return {
            dateRange: Controls.DateRange,
            region: Controls.Region,
            species: Controls.SelectTaxonomy,
        }[property].getValue();
    }


    Object.assign(Controls, { init, get, onChanged })
}(window.Controls = {},
    window.Config));
