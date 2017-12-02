// Dependencies:
// - taxonomy
// - api
// - controls

(function (exports) {
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
            console.log('Fetched %d samples for %s in %s from %s to %s',
                samples.length, species.id(), region,
                fmt(dateRange[0]), fmt(dateRange[1]));

            return samples.map(preprocess, species);
        });
    }

    function getSamples() {
        var region = Controls.Region.get(),
            dateRange = Controls.DateRange.get();

        return Promise.all(
            Object.values(Taxonomy.species)
                .filter(s => s.isEnabled())
                .map(s => getSpeciesSamples(s, region, dateRange)))
            .then(sampleSets => {
                return sampleSets.reduce((acc, arr) => acc.concat(arr), []);
            })
    }


    Object.assign(exports, { getSamples });
}(window.DataSource = window.DataSource || {}));
