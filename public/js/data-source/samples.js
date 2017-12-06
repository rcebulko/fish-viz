(function (Samples, Taxonomy, API, Controls) {
    var listeners = [];


    function init() {
        console.info('Initializing data source');
        Controls.onChanged(() => getSamples().then(trigger));
    }

    function getSamples() {
        var region = Controls.Region.getValue(),
            dateRange = Controls.DateRange.getValue(),
            species = Controls.SelectTaxonomy.getValue().enabled;

        return Promise.all(
            species.map(s => getSpeciesSamples(s, region, dateRange)))
            .then(sampleSets => {
                var samples = sampleSets.reduce((acc, arr) => acc.concat(arr), []);
                console.debug('Collected a total of %d samples', samples.length);

                return samples;
            });
    }

    function onChanged(callback) { listeners.push(callback); }


    function preprocess(sample, species) {
        sample.date = new Date(sample.date);
        sample.species = species;
        return sample;
    }

    function getSpeciesSamples(species, region, dateRange) {
        var fmt = Controls.DateRange.format;

        return API.fetchSpeciesSamples(species.id(), {
            region,
            date: { gt: new Date(dateRange[0]), lt: new Date(dateRange[1]) }
        }).then(samples => {
            console.debug('Fetched %d samples for %s in %s from %s to %s',
                samples.length, species.id(), region,
                fmt(dateRange[0]), fmt(dateRange[1]));

            return samples.map(s => preprocess(s, species));
        });
    }

    function trigger(samples) {
        listeners.forEach(cb => cb(samples));
    }


    Object.assign(Samples, { getSamples, onChanged, init });
}(window.Samples = {}, window.Taxonomy, window.API, window.Controls));
