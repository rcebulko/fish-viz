(function (register) {
    var selectorModes = {
            select:    (possible, selected) =>  possible,
            add:       (possible, selected) =>  possible ||  selected,
            subtract:  (possible, selected) => !possible &&  selected,
            intersect: (possible, selected) =>  possible &&  selected,
            exclude:   (possible, selected) => !possible || !selected,
        };


    function LassoSelect() {}
    register(LassoSelect, function () {
        var self = this;
        this.selection = {};

        Object.keys(selectorModes).forEach(mode => {
            $('.control-panel-select-' + mode).click(function() {
                self.selector = selectorModes[mode];

                $('.control-panel-select').children().removeClass('active');
                $(this).addClass('active');

                console.info('Selection mode set to %s', mode);
            });
        });

        $('.control-panel-select-select').click();
    });


    // display and logging
    LassoSelect.prototype.valueToString = lassoed =>
        lassoed.length + ' lassoed';


    // no external state to read/write
    LassoSelect.prototype.readValue = () => [];

    LassoSelect.prototype.writeValue = selectedIds => {
        d3.selectAll('.sample')
            .classed('lasso-selected', d => selectedIds.indexOf(d.id) !== -1);
    };


    // accessors, mutators, and change listeners
    LassoSelect.prototype.set = function (selectedIds) {
        this.value = selectedIds;
        this.selection = {};
        selectedIds.forEach(id => this.selection[id] = true);
    }


    // helper for applying operations to lasso selections
    LassoSelect.prototype.willSelect = function(id, possible) {
        return this.selector(possible, this.selection[id]);
    }
}(window.Controls.register));
