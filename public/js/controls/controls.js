(function (Controls) {
    function init() {
        console.info('Initializing controls');

        enableShowHide();


        return Promise.all([
            Controls.SplitPane.init([100, 250]),
            Controls.MouseAction.init(),
            Controls.LassoSelect.init(),
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


    Object.assign(Controls, { init, onChanged })
}(window.Controls = {}));
