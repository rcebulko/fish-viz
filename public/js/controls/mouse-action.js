(function (Controls) {
    function MouseAction() {}
    MouseAction.prototype.init = function () {
        var $lassoOverlay = $('.lasso-overlay'),
            $lasso = $('.control-panel-lasso'),
            $pan = $('.control-panel-pan');

        console.info('Initializing MouseAction control');

        $lasso.click(function () {
            console.info('Lasso tool selected');
            $lassoOverlay.add($(this)).addClass('active');
            $pan.removeClass('active');
        });
        $pan.click(function () {
            console.info('Pan tool selected');
            $(this).addClass('active');
            $lassoOverlay.add($lasso).removeClass('active');
        }).trigger('click');

        return Promise.all([]);
    };


    Controls.MouseAction = new MouseAction();
}(window.Controls));
