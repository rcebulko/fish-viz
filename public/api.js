// Provides interface into Species/Sample API
// must be loaded after `d3-request`
(function (exports) {
    var API_PATH = 'http://localhost:90/api/',
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
        setGeoBounds,
        setDateRange,

        fetchSpeciesData,
        fetchSampleData,

        fetchSpeciesSamples,
        fetchGenusSamples,
        fetchFamilySamples,
    }
}(window));
