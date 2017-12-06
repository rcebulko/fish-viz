// Dependencies:
// - jQuery

window.Controls = window.Controls || {};
(function (exports) {
    var $region = $(),
        region = 'FLA KEYS';


    function init() {
        console.info('Initializing region selection control');

        $region = $('.geo-region').select2({
            minimumResultsForSearch: -1,
            data: [
                { id: 'FLA KEYS', text: 'Florida Keys' },
                { id: 'DRY TORT', text: 'Dry Tortugas' },
                { id: 'SEFCRI', text: 'Southeast Florida Coral Reef' },
            ]
        });

        onChange(changed);
        set(region);
    }

    function changed() {
        region = $region.val();

        console.log('Set region to %s', region);
    }

    function get() { return region; }
    function set(newRegion) { $region.val(newRegion).trigger('change'); }
    function onChange(callback) { $region.change(() => callback(get())); }

    function loadState(newRegion) {
        $region.val(newRegion).trigger('change', 'loadState');
    }
    function onChangeState(callback) {
        $region.change((evt, data) => {
            if (data !== 'loadState') callback(get());
        });
    }


    Object.assign(exports, {
        init,

        get,
        set,
        onChange,

        saveState: get,
        loadState,
        onChangeState,
    });
}(window.Controls.Region = {}));
