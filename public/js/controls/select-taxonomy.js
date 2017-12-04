// Dependencies:
// - jQuery
// - Select2
// - taxonomy

window.Controls = window.Controls || {};
(function (exports) {
    var $select = $(),
        selection = [];


    function init() {
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
                node => colorBlock(node.color) + ' ' + nodeFmt(node));

        console.info('Initializing taxonomy selection control');

        $select = $('.taxonomy-select');

        return Taxonomy.init().then(() => {
            $select.select2({
                placeholder: 'Select family/genus/species',
                data: selectData(),
                closeOnSelect: false,
                escapeMarkup: m => m,
                templateResult: addColorBlock(node => node.name()),
                templateSelection: addColorBlock(node => node.toString()),
            });

            onChange(changed);
            set(selection);
        });
    }

    function changed() {
        var newSelection = $select.val().map(Taxonomy.fromKey);

        if (newSelection.length > selection.length) {
            newSelection.filter(n => !n.isSelected())
                .forEach(n => n.select());
        } else if (newSelection.length < selection.length) {
            selection.filter(n => newSelection.indexOf(n) === -1)
                .forEach(n => n.deselect());
        }

        selection = newSelection;
        Taxonomy.cullEnabled();
    }
    function onChange(callback) {
        $select.change(() => callback(selection));
    }

    function get() { return selection; }
    function set(newSelection) { $select.val(newSelection).trigger('change'); }

    function selectData() {
        return ['species', 'genuses', 'families'].map(type => {
            return {
                text: type[0].toUpperCase() + type.slice(1),
                children: Object.values(Taxonomy[type])
                    .map(s => {
                        return { id: s.key(), text: s.toString() };
                    })
            };
        });
    }


    Object.assign(exports, { init, onChange, get, set })
}(window.Controls.SelectTaxonomy = window.Controls.SelectTaxonomy || {}));
