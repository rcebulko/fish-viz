(function (Samples, Sample, Taxonomy, API, Controls, Config) {
    var listeners = { new: [], update: [] },

        useSampleCache = Config.speciesSampleCache,
        // cache[region][species.id()] = { dateRange: [...], samples: [...] }
        globalCache = {},

        dateFmt = Controls.DateRange.format,

        lastPromise = null,

        activeRequest = 0,
        checkRequest = request => {
            if (request !== activeRequest) throw Error('Inactive request');
        };


    function init() {
        console.info('Initializing data source');

        Controls.onChanged(() => {
            lastPromise = null;
            getSamples();
        });
    }


    //////////////////////////
    // Data event listeners //
    //////////////////////////

    function trigger(type, results) {
        if (typeof results === 'undefined') return rs => trigger(type, rs);

        (typeof type === 'undefined' ?
            listeners.new.concat(listeners.update) :
            listeners[type]
        ).forEach(cb => cb(results));
    }
    function on(type, callback) {
        if (typeof callback === 'undefined') return cb => on(type, cb);

        listeners[type] = listeners[type] || [];
        listeners[type].push(callback);
    }


    function getSamples() {
        if (lastPromise !== null) {
            lastPromise.then(results =>
                console.debug('Re-serving %d samples from previous request',
                    results.samples.length));

            return lastPromise.then(results =>
                Object.assign({ redraw: true }, results));
        }

        var region = Controls.get('region'),
            dr = Controls.get('dateRange'),

            data = [],
            first = true,
            onData = results => {
                results.first = first;
                first = false;

                trigger('new', results);
            },

            request = ++activeRequest,

            logResults = results => {
                var logFmt = {
                    cache: 'Served %d samples from cache for %s in %s from %s to %s',
                    fetch: 'Fetched %d samples for %s in %s from %s to %s',
                }[results.method];

                console.debug(logFmt,
                    results.samples.length, results.species.id(), results.region,
                    dateFmt(results.dateRange[0]), dateFmt(results.dateRange[1]));
            },

            promises = Controls.get('species')
                .enabled
                .map(s => getSpeciesSamples(s, region, dr))
                .reduce((acc, arr) => acc.concat(arr), []);

        promises.forEach(p => {
            p.then(results => {
                checkRequest(results.request);
                logResults(results);
                onData(results);
            });
        });

        lastPromise = Promise.all(promises)
            .then(resultSets => {
                var samples;

                checkRequest(request);

                samples = resultSets.map(results => results.samples)
                    .reduce((acc, arr) => acc.concat(arr), []);

                console.debug('Collected a total of %d samples', samples.length);

                return { samples, first: false };
            }, () =>
                console.debug('Ignoring responses to old request %d', request))

        lastPromise.then(trigger('update'));

        return lastPromise;
    }


    ////////////////////////////////
    // Sample querying & fetching //
    ////////////////////////////////

    // request a set of samples explicitly from the API
    function fetchSpeciesSamples(species, region, dateRange) {
        return API.fetchSpeciesSamples(species.id(), {
            region,
            date: { gte: new Date(dateRange[0]), lte: new Date(dateRange[1]) }
        }).then(samples => samples.map(s => new Sample(s, species)));
    }


    ////////////////////
    // Sample caching //
    ////////////////////

    // returns promises for each segment of species sample results
    function getSpeciesSamples(species, region, dateRange) {
        var cache = getCache(species, region),
            segments,
            promises = [],

            dateFilter = sample =>
                sample.date >= dateRange[0] && sample.date <= dateRange[1],

            wrapSamples = (method, dr) =>
                samples => Object.assign({
                    species,
                    region,
                    dateRange: dr,

                    method,
                    cache,
                    request: activeRequest,
                    samples,
                }),

            cacheResults = results => {
                var cache = results.cache,
                    dr = results.dateRange;

                if (useSampleCache) {
                    cache.dateRange = mergeSegments(cache.dateRange, dr);
                    cache.data = cache.data.concat(results.samples);
                }

                return results;
            };

        if (useSampleCache && cache.dateRange.length) {
            promises.push(new Promise(resolve =>
                resolve(cache.data.filter(dateFilter)))
                .then(wrapSamples('cache', cache.dateRange)))

            segments = getOuterSegments(dateRange, cache.dateRange);
        } else {
            segments = [dateRange];
        }

        return promises.concat(segments.map(dr =>
            fetchSpeciesSamples(species, region, dr)
                .then(wrapSamples('fetch', dr))
                .then(cacheResults)));
    }

    // return the sample cache for the species
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

    // merge two ranges (each represented as an array) into one
    function mergeSegments(seg1, seg2) {
        if (seg1.length === 0) return seg2;
        if (seg2.length === 0) return seg1;
        return [Math.min(seg1[0], seg2[0]), Math.max(seg1[1],seg2[1])];
    }


    Object.assign(Samples, {
        init,
        getSamples,

        onNew: on('new'),
        onUpdate: on('update'),
    });
}(window.Samples = {},
    window.Sample,
    window.Taxonomy,
    window.API,
    window.Controls,
    window.Config));
