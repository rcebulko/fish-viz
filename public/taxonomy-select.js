// must be loaded after `select2.js`
// must be loaded after `taxonomy.js`
$(() => {
    var $sel = $('.taxonomy-select'),
        currentSelection = [];

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

    function onChange() {;
        // deselect all nodes to start
        Taxonomy.root.deselect();
        // get selected type__id keys
        $(this).val()
            // split keys
            .map(val => val.split('__'))
            // collect nodes from taxonomy
            .map(type_id => Taxonomy[type_id[0]][type_id[1]])
            // select nodes
            .forEach(n => n.select());

        // TODO: This is not ideal, the tree should be listening for a change
        // redraw tree
        draw_tree();
    }

    Taxonomy.init(root => {
        $sel.select2({
            placeholder: 'Select family/genus/species',
            data: selectData('.taxonomy-select'),
        });
        $sel.change(onChange);
    });
})
