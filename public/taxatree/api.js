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

    // fetch taxonomy data
    function fetchSpeciesData(callback) {
        d3.json(API_PATH + '/species', callback);
    }

    // fetch samples with arbitrary filters
    function fetchSampleData(filterOpts, callback) {
        d3.request(API_PATH + '/sample')
            .get(Object.assign({}, currentFilters, filterOpts), xhr => {
                callback(JSON.parse(xhr.response));
            });
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
