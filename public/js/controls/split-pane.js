(function (Controls) {
    function SplitPane() {}
    SplitPane.prototype.init = function (initSizes) {
        console.info('Initializing SplitPane control');

        $('.split-pane').splitPane();
        $('.outer-pane').splitPane('firstComponentSize', initSizes[0]);
        $('.nested-pane').splitPane('firstComponentSize', initSizes[1]);

        return Promise.all([]);
    };


    Controls.SplitPane = new SplitPane();
}(window.Controls));
