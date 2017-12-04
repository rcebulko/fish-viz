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
    function onChange(callback) { $region.change(() => callback(get())); }

    function get() { return region; }
    function set(newRegion) { $region.val(newRegion).trigger('change'); }


    Object.assign(exports, { init, onChange, get, set });
}(window.Controls.Region = {}));
