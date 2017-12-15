(function (Config) {
    Object.assign(Config, {
        apiPath: 'http://localhost:1337/api/',

        // initial control values
        initDateRange: [2013, 2016],
        initRegion: 'FLA KEYS',

        // maximum number of enabled species to display at once
        maxEnabledSpecies: 10,

        // enable species-level sample caching
        speciesSampleCache: true,

        // maximum number of history/future states to track; 0 for no limit
        maxHistory: 20,
        maxFuture: 20,

        regionBounds: {
            'FLA KEYS': {
                lat: [24.4313, 25.7526],
                lon: [-82.0109, -80.0872],
            },
            'DRY TORT': {
                lat: [24.5420, 24.7364],
                lon: [-83.1037, -82.7703],
            },
            'SEFCRI': {
                lat: [25.7624, 27.1897],
                lon: [-80.1559, -79.9938],
            },
        },

        minLat: 24.4313, minLon: -83.1037,
        maxLat: 27.1897, maxLon: -79.9978,

        zoomDebounce: 3000,
    });
}(window.Config = window.Config = {}));
