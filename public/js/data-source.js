// Dependencies:
// - taxonomy
// - api
// - controls
// - taxonomy-tree

(function (exports) {
    var callbacks = [];

    function preprocess(sample, species) {
        sample.date = new Date(sample.date);
        sample.species = species;
        return sample;
    }

    function getSpeciesSamples(species, region, dateRange) {
        var fmt = Controls.DateRange.formatTimestamp;

        return API.fetchSpeciesSamples(species.id(), {
            region,
            date: { gt: dateRange[0], lt: dateRange[1] }
        }).then(samples => {
            console.debug('Fetched %d samples for %s in %s from %s to %s',
                samples.length, species.id(), region,
                fmt(dateRange[0]), fmt(dateRange[1]));

            return samples.map(s => preprocess(s, species));
        });
    }

    function getSamples() {
        var region = Controls.Region.get(),
            dateRange = Controls.DateRange.get(),
            species = Controls.SelectTaxonomy.get()
                .map(n => n.allSpecies())
                .reduce((acc, arr) => acc.concat(arr), []);

        return Promise.all(
            species
                .filter(s => s.isEnabled())
                .map(s => getSpeciesSamples(s, region, dateRange)))
            .then(sampleSets => {
                samples = sampleSets.reduce((acc, arr) => acc.concat(arr), []);
                console.debug('Collected a total of %d samples', samples.length);

                return samples;
            });
    }

    function onChange(callback) {
        callbacks.push(callback);
    }

    function executeCallbacks(samples) {
        callbacks.forEach(cb => cb(samples));
    }

    function init() {
        console.info('Initializing data source');

        Controls.onChange(() => getSamples().then(executeCallbacks));
        Viz.TaxonomyTree.onToggled(() => getSamples().then(executeCallbacks))
        Controls.History.onChangeState(() => getSamples().then(executeCallbacks));
    }


    Object.assign(exports, { getSamples, onChange, init });
}(window.DataSource = window.DataSource || {}));
