// Dependencies:
// - jQuery
// - SplitPane

(function (exports) {
    function init() {
        console.info('Initializing split panels');

        $('.split-pane').splitPane();
        $('.outer-pane').splitPane('firstComponentSize', 150);
        $('.nested-pane').splitPane('firstComponentSize', 250);
    }


    Object.assign(exports, { init });
}(window.SplitPane = window.SplitPane || {}));
