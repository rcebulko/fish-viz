(function (register, Taxonomy) {
    var colorBlock = color => {
            return '<span style="background-color: ' +
                color +
                '" class="species-color-block"></span>';
        },

        wrapNodeFmt = nodeFmt => {
            return object => (object.id ?
                nodeFmt(Taxonomy.fromKey(object.id)) :
                object.text);
        },

        addColorBlock = nodeFmt => wrapNodeFmt(
            node => colorBlock(node.color) + ' ' + nodeFmt(node)),

        selectOptions = () => ['species', 'genuses', 'families']
            .map(type => {
                return {
                    text: type[0].toUpperCase() + type.slice(1),
                    children: Object.values(Taxonomy[type])
                        .map(s => {
                            return { id: s.key(), text: s.toString() };
                        })
                };
            });


    // taxonomy selection initialization
    function SelectTaxonomy() {}
    register(SelectTaxonomy, function () {
        this.$select = $('.taxonomy-select');

        return Taxonomy.init()
            .then(() => {
                this.$select.select2({
                    placeholder: 'Select family/genus/species',
                    data: selectOptions(),
                    closeOnSelect: false,
                    escapeMarkup: m => m,
                    templateResult: addColorBlock(node => node.name()),
                    templateSelection: addColorBlock(node => node.toString()),
                });

                this.$select.change((evt, data) => {
                    if (data !== 'triggered') this.loadValue();
                });
            });
    });


    // display and logging
    SelectTaxonomy.prototype.valueToString = selections => {
        return selections.selected.length +
            ' selected, ' +
            selections.enabled.length +
            ' enabled';
    };


    // update the Taxonomy module with the new selections
    SelectTaxonomy.prototype.set = function (newSelections) {
        this.updateTaxonomy(newSelections);
        this.value = newSelections;
    };

    SelectTaxonomy.prototype.updateTaxonomy = function (newSelections) {
        var oldSelections = this.getValue(),

            oldSelected = oldSelections.selected,
            newSelected = newSelections.selected,

            removed = [],
            kept = [];

        if (newSelected.length > oldSelected.length) {
            newSelected.forEach(n => n.select());
        } else if (newSelected.length < oldSelected.length) {
            oldSelected.forEach(n =>
                (newSelected.indexOf(n) === -1 ? removed : kept).push(n));
            removed.forEach(n => n.deselect());
            kept.forEach(n => n.select());
        }

        Taxonomy.setEnabled(newSelections.enabled);
        newSelections.enabled = Taxonomy.getEnabled();
    };


    // read/write the value from/to the Taxonomy module
    SelectTaxonomy.prototype.readValue = function () {
        return {
            selected: this.$select.val().map(Taxonomy.fromKey),
            enabled: Taxonomy.getEnabled(),
        };
    };

    SelectTaxonomy.prototype.writeValue = function(newSelections) {
        this.$select.val(newSelections.selected.map(n => n.key()));
        this.$select.trigger('change', 'triggered');
    };


    // serialization
    SelectTaxonomy.prototype.serialize = function(selections) {
        return {
            selected: selections.selected.map(n => n.key()),
            enabled: selections.enabled.map(s => s.key()),
        };
    };

    SelectTaxonomy.prototype.deserialize = function(selections) {
        return {
            selected: selections.selected.map(Taxonomy.fromKey),
            enabled: selections.enabled.map(Taxonomy.fromKey),
        };
    };
}(window.Controls.register, window.Taxonomy));
