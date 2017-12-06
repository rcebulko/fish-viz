(function (API) {
    var API_PATH = 'http://localhost:1337/api/';

    // fetch taxonomy data
    function fetchSpecies() {
        console.info('Fetching species data');
        return $.get(API_PATH + 'species');
    }

    // fetch samples with arbitrary filters
    function fetchSamples(filterOpts) {
        return $.get(API_PATH + 'sample', filterOpts)
            .then(samples => samples.length ? samples : []);
    }

    function fetchSpeciesSamples(speciesCode, filterOpts, callback) {
        return fetchSamples(
            Object.assign({ species_code: speciesCode }, filterOpts));
    }

    Object.assign(API, { fetchSpecies, fetchSamples, fetchSpeciesSamples });
}(window.API = {}));
