(function (Viz) {
    function init() {
        console.info('Initializing visualizations');

        Viz.TaxonomyTree.init();
        Viz.Map.init();
    }


    Object.assign(Viz, { init })
}(window.Viz = window.Viz || {}))
