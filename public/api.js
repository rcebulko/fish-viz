// Provides interface into Species/Sample API
// must be loaded after `jQuery`
(function (exports) {
    var API_PATH = 'http://localhost:1337/api/',
        currentFilters = {};

    // filter settings
    function setBetweenFilter(field, min, max) {
        currentFilters[field] = { gt: min, lt: max };
    }
    function setGeoBounds(latMin, latMax, lonMin, lonMax) {
        setBetweenFilter('latitude', latMin, latMax);
        setBetweenFilter('longitude', lonMin, lonMax);
    }
    function setDateRange(dateMin, dateMax) {
        setBetweenFilter('data', dateMin, dateMax);
    }
    function setRegion(region) {
        currentFilters.region = region;
    }

    // fetch taxonomy data
    function fetchSpeciesData(callback) {
        $.get(API_PATH + 'species', callback);
    }

    // fetch samples with arbitrary filters
    function fetchSampleData(filterOpts, callback) {
        $.get(API_PATH + 'sample',
            Object.assign({}, currentFilters, filterOpts),
            callback
        );
    }

    // common use case queries
    function fetchSpeciesSamples(speciesCode, callback) {
        fetchSampleData({ species_code: speciesCode }, callback);
    }
    function fetchGenusSamples(genus, callback) {
        fetchSampleData({ species: { genus: genus } }, callback);
    }
    function fetchFamilySamples(family, callback) {
        fetchSampleData({ species: { family: family } }, callback);
    }

    exports.API = {
        setRegion,
        setGeoBounds,
        setDateRange,
        setRegion,

        fetchSpeciesData,
        fetchSampleData,

        fetchSpeciesSamples,
        fetchGenusSamples,
        fetchFamilySamples,
    }
}(window));
