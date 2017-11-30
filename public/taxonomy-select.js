// must be loaded after `select2.js`
// must be loaded after `taxonomy.js`
$(() => {
    var $sel = $('.taxonomy-select'),
        selected = [];

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

    function onChange() {
        var newVal = $(this).val(),
            added = [],
            removed = [],
            i, type_id;

        if (newVal.length > selected.length) {
            for (i = 0; i < newVal.length; ++i) {
                if (selected.indexOf(newVal[i]) == -1) {
                    added.push(newVal[i]);
                }
            }

            for (i = 0; i < added.length; ++i) {
                type_id = added[i].split('__');
                Taxonomy[type_id[0]][type_id[1]].select();
                console.log('Added ' + type_id[0] + ' ' + type_id[1]);
            }
        } else {
            for (i = 0; i < selected.length; ++i) {
                if (newVal.indexOf(selected[i]) == -1) {
                    removed.push(selected[i]);
                }
            }

            for (i = 0; i < removed.length; ++i) {
                type_id = removed[i].split('__');
                Taxonomy[type_id[0]][type_id[1]].deselect();
                console.log('Removed ' + type_id[0] + ' ' + type_id[1]);
            }
        }

        selected = newVal;
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
