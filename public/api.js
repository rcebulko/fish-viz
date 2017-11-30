// Provides interface into Species/Sample API
// must be loaded after `jQuery`
(function (exports) {
    var API_PATH = 'http://localhost:1337/api/',
        currentFilters = {};

    // filter settings
    function getRange(field) {
        var range = currentFilters[field];
        return [range.gt, range.lt];
    }
    function setBetweenFilter(field, min, max) {
        currentFilters[field] = { gt: min, lt: max };
    }

    function getGeoBounds() {
        return { lat: getRange('latitude'), lon: getRange('longitude') };
    }
    function setGeoBounds(latMin, latMax, lonMin, lonMax) {
        setBetweenFilter('latitude', latMin, latMax);
        setBetweenFilter('longitude', lonMin, lonMax);
    }

    function getDateRange() { return getRange('date'); }
    function setDateRange(dateMin, dateMax) {
        setBetweenFilter('date', dateMin, dateMax);
    }

    function getRegion() { return currentFilters.region; }
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
            Object.assign({ limit: 100 }, currentFilters, filterOpts),
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
        getGeoBounds,
        getDateRange,
        getRegion,

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
