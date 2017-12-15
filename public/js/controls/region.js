(function (register) {
    var regions = Config.regionNames;


    // region control initialization
    function Region() {}
    register(Region, function () {
        this.$region = $('.geo-region').select2({
            minimumResultsForSearch: -1,
            data: Object.entries(regions).map(entry => {
                return { id: entry[0], text: entry[1] };
            })
        });

        this.$region.change((evt, data) => {
            if (data !== 'triggered') this.loadValue();
        });
    });


    // display and logging
    Region.prototype.valueToString = val => regions[val];


    // read/write the value from/to the select element
    Region.prototype.readValue = function () { return this.$region.val(); };

    Region.prototype.writeValue = function (newRegion) {
        this.$region.val(newRegion).trigger('change', 'triggered');
    };
}(window.Controls.register));
