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
        $select = $('.taxonomy-select');

        return Taxonomy.init().then(() => {
            $select.select2({
                placeholder: 'Select family/genus/species',
                data: selectData('.taxonomy-select'),
            });

            $select.change(changed);
        });
    }

    function changed() {
        // deselect all nodes to start
        Taxonomy.root.deselect();

        // get selected type__id keys
        selection = $select.val()
            // split keys
            .map(val => val.split('__'))
            // collect nodes from taxonomy
            .map(type_id => Taxonomy[type_id[0]][type_id[1]]);

        // select nodes
        selection.forEach(n => n.select());
        console.info('Selection includes %d species', selection.length);
    }

    function onChange(callback) {
        $select.change(() => callback(selection));
    }

    function get() { return selection; }


    Object.assign(exports, { init, onChange, get })
}(window.Controls.SelectTaxonomy = window.Controls.SelectTaxonomy || {}));
