(function (exports) {
    function init() {
        Viz.TaxonomyTree.init();
        Viz.Map.init();
    }


    Object.assign(exports, { init })
}(window.Viz = window.Viz || {}))
