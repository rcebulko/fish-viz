(function (Config) {
    Object.assign(Config, {
        apiPath: 'http://localhost:1337/api/',

        // initial control values
        initDateRange: [2013, 2016],
        initRegion: 'FLA KEYS',

        // maximum number of enabled species to display at once
        maxEnabledSpecies: 10,

        // enable species-level sample caching
        speciesSampleCache: false,

        // maximum number of history/future states to track; 0 for no limit
        maxHistory: 20,
        maxFuture: 20,
    });
}(window.Config = window.Config = {}));
