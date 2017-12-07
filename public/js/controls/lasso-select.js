(function (LassoSelect) {
    var selectMode,
        selector,
        selection = {},

        modes = {
            select:    (possible, selected) =>  possible,
            add:       (possible, selected) =>  possible ||  selected,
            subtract:  (possible, selected) => !possible &&  selected,
            intersect: (possible, selected) =>  possible &&  selected,
            exclude:   (possible, selected) => !possible || !selected,
        }

    function init() {
        console.info('Initializing lasso selection controls');

        initSelectionSettings();

        $('.control-panel-select-select').click();
    }


    function initSelectionSettings() {
        Object.keys(modes).forEach(mode => {
            $('.control-panel-select-' + mode).click(function() {
                selectMode = mode;
                selector = modes[selectMode];

                $('.control-panel-select').children().removeClass('active');
                $(this).addClass('active');

                console.info('Selection mode set to %s', selectMode);
            });
        });
    }


    function setSelection(selectedIds) {
        selection = {};
        selectedIds.forEach(id => selection[id] = true);
    }

    function willSelect(id, possible) {
        return selector(possible, selection[id]);
    }


    Object.assign(LassoSelect, {
        init,
        setSelection,
        willSelect,
    });
}(window.Controls.LassoSelect = {}));
