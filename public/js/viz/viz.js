(function (exports) {
    function init() {
        console.info('Initializing visualizations');

        Viz.TaxonomyTree.init();
        Viz.Map.init();
    }


    Object.assign(exports, { init })
}(window.Viz = window.Viz || {}))
