// Dependencies:
// - jQuery
// - Select2
// - Controls.Control

(function (Controls) {
    var regions = {
        'FLA KEYS': 'Florida Keys',
        'DRY TORT': 'Dry Tortugas',
        'SEFCRI': 'Southeast Florida Coral Reef',
    };


    // region control initialization
    function Region() {}
    Region.prototype = new Controls.Control('Region', function () {
        this.$region = $('.geo-region').select2({
            minimumResultsForSearch: -1,
            data: Object.entries(regions).map(entry => {
                return { id: entry[0], text: entry[1] };
            })
        });

        this.$region.change((evt, data) => {
            if (data !== 'triggered') this.trigger('changed.value');
        });
    });


    // display and logging
    Region.prototype.valueToString = val => regions[val];


    // read/write the value from/to the select element
    Region.prototype.readValue = function () { return this.$region.val(); };

    Region.prototype.writeValue = function (newRegion) {
        this.$region.val(newRegion).trigger('change', 'triggered');
    };


    Controls.Region = new Region();
}(window.Controls = window.Controls || {}));
