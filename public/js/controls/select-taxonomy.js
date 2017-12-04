// Dependencies:
// - jQuery
// - taxonomy

window.Controls = window.Controls || {};
(function (exports) {
    var $select = $(),
        selection = [];

    function selectData() {
        return ['species', 'genuses', 'families'].map(groupData);
    }

    function groupData(type) {
        var label = type[0].toUpperCase() + type.slice(1),
            subtree = Taxonomy[type],
            s, children = [];

        for (s in subtree) {
            children.push({
                id: type + '__' + s,
                text: subtree[s].toString()
            });
        }

        return { text: label, children: children }
    }

    function init() {
        console.info('Initializing taxonomy selection control');

        $select = $('.taxonomy-select');

        return Taxonomy.init().then(() => {
            $select.select2({
                placeholder: 'Select family/genus/species',
                data: selectData('.taxonomy-select'),
            });

            onChange(changed);
        });
    }

    function changed() {
            // get selected type__id keys
        var newSelection = $select.val()
            // split keys
            .map(val => val.split('__'))
            // collect nodes from taxonomy
            .map(type_id => Taxonomy[type_id[0]][type_id[1]]);

        if (newSelection.length > selection.length) {
            newSelection.filter(n => !n.isSelected())
                .forEach(n => n.select());
        } else if (newSelection.length < selection.length) {
            selection.filter(n => newSelection.indexOf(n) === -1)
                .forEach(n => n.deselect());
        }

        selection = newSelection;
        Taxonomy.cullEnabled();
        console.info('Selection includes %d species', selection.length);
    }

    function onChange(callback) {
        $select.change(() => callback(selection));
    }

    function get() { return selection; }


    Object.assign(exports, { init, onChange, get })
}(window.Controls.SelectTaxonomy = window.Controls.SelectTaxonomy || {}));
