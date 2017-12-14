(function (Samples, Taxonomy, API, Controls) {
    var listeners = [],

        // cache[region][species.id()] = { dateRange: [...], samples: [...] }
        globalCache = {}

        dateFmt = Controls.DateRange.format

        activeRequest = 0,
        lastPromise = null,
        checkRequest = request => {
            if (request !== activeRequest) throw Error('Inactive request');
        };


    function init() {
        console.info('Initializing data source');
        Controls.onChanged(() => {
            lastPromise = null;
            getSamples(trigger).then(trigger);
        });
    }

    function trigger(samples, partial) {
        listeners.forEach(cb => cb(samples, partial));
    }
    function onData(callback) { listeners.push(callback); }


    function getSamples(onData) {
        if (lastPromise !== null) {
            return lastPromise.then(samples => {
                console.debug('Re-serving %d samples from previous request',
                    samples.length);
                return samples;
            });
        }

        var region = Controls.Region.getValue(),
            dateRange = Controls.DateRange.getValue(),
            species = Controls.SelectTaxonomy.getValue().enabled,
            data = [],
            onData = throttle(onData || (() => null), 500),
            request = ++activeRequest;

        return lastPromise = Promise.all(
            species.map(s =>
                getSpeciesSamples(s, region, dateRange, request,
                    partialData => onData(data = data.concat(partialData), 'partial')))
        ).then(sampleSets => {
            checkRequest(request);

            var samples = sampleSets.reduce((acc, arr) => acc.concat(arr), []);
            console.debug('Collected a total of %d samples', samples.length);

            return samples;
        }, () => console.debug('Ignoring responses to old request %d', request));
    }


    function getSpeciesSamples(species, region, dateRange, request, onData) {
        var cache = getCache(species, region),
            segments,
            promises = [],
            range = [Infinity, -Infinity],

            dateFilter = sample =>
                sample.date >= dateRange[0] && sample.date <= dateRange[1];

        if (cache.dateRange.length) {
            promises.push(new Promise(resolve => {
                var filtered = cache.data.filter(dateFilter);
                console.debug(
                    'Served %d samples from cache for %s in %s from %s to %s',
                    filtered.length, species.id(), region,
                    dateFmt(cache.dateRange[0]), dateFmt(cache.dateRange[1]));

                resolve(filtered);
            }));

            segments = getOuterSegments(dateRange, cache.dateRange);
        } else {
            segments = [dateRange];
        }

        promises = promises.concat(segments.map(dr =>
            fetchSpeciesSamples(species, region, dr)
                .then(samples => {
                    cache.dateRange = mergeSegments(cache.dateRange, dr);
                    cache.data = cache.data.concat(samples);
                    checkRequest(request);
                    onData(cache.data);

                    return samples;
                })
        ));

        return Promise.all(promises).then(ss =>
            ss.reduce((acc, arr) => acc.concat(arr), []));
    }

    function getCache(species, region) {
        if (typeof globalCache[region] === 'undefined') globalCache[region] = {};
        cache = globalCache[region];

        if (typeof cache[species.id()] === 'undefined') {
            cache[species.id()] = { dateRange: [], data: [] };
        }

        return cache[species.id()];
    }

    // given a new query range and the cached range, determine what segments
    // (if any) are needed to cover the difference
    function getOuterSegments(newRange, cachedRange) {
        var segments = [];

        if (newRange[0] < cachedRange[0]) {
            segments.push([newRange[0], cachedRange[0]]);
        }
        if (newRange[1] > cachedRange[1]) {
            segments.push([cachedRange[1], newRange[1]]);
        }

        return segments;
    }

    // merge two date ranges into one
    function mergeSegments(seg1, seg2) {
        if (seg1.length === 0) return seg2;
        if (seg2.length === 0) return seg1;
        return [Math.min(seg1[0], seg2[0]), Math.max(seg1[1],seg2[1])];
    }


    // request a set of samples explicitly from the API
    function fetchSpeciesSamples(species, region, dateRange) {
        return API.fetchSpeciesSamples(species.id(), {
            region,
            date: { gte: new Date(dateRange[0]), lte: new Date(dateRange[1]) }
        }).then(samples => {
            console.debug('Fetched %d samples for %s in %s from %s to %s',
                samples.length, species.id(), region,
                dateFmt(dateRange[0]), dateFmt(dateRange[1]));

            return samples.map(s => preprocessSample(s, species));
        });
    }

    // convert serialized fields into species and date objects
    function preprocessSample(sample, species) {
        sample.date = new Date(sample.date);
        sample.species = species;
        return sample;
    }


    Object.assign(Samples, { getSamples, onData, init });
}(window.Samples = {}, window.Taxonomy, window.API, window.Controls));
