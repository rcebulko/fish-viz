(function (exports) {
    $(document).ready(function () {
        $('.control-panel-hide, .control-panel-show').click(function () {
            $(this).parent().toggleClass('hidden');
        });
    })
    exports.Controls = {}
}(window))
