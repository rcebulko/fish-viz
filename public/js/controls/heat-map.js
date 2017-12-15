(function (HeatMap, Config) {
    var state = false,

        ZOOM_FACTOR = Config.heatmapZoomFactor,

        weightKey = 'number',
        getSampleWeight = {
            number: s => s.count || 1,
            protected: s => +s.protected * (s.count || 1),
            depth: s => s.aggregated ? s.avgDepth * s.count : s.depth,
            date: s => {
                if (s.aggregated) {
                    return (s.date[1] - new Date(1990)) * s.count;
                } else {
                    return s.date - new Date(1990);
                }
            }
        },

        convertResults = results => results.samples.map(s => {
            return {
                location: new google.maps.LatLng(s.latitude, s.longitude),
                weight: getSampleWeight[weightKey](s),
            };
        }),

        heatMap;

    function init(map) {
        console.info('Initializing HeatMap control');

        $('.control-panel-heatmap-toggle').click(function () {
            state = !state;
            $(this).toggleClass('active', state);

            update();
        });

        return initHeatMap(map);
    }

    function initHeatMap(map) {
        heatMap = new google.maps.visualization.HeatmapLayer({
            data: [],
            radius: 30,
        });

        heatMap.setMap(map);
        google.maps.event.addListener(map, 'zoom_changed', setRadius);
        Samples.onUpdate(results => draw(convertResults(results)));
    }

    function setRadius() {
        heatMap.setOptions({
            radius: heatMap.getMap().getZoom() * 10 - ZOOM_FACTOR
        });
    }

    function update() {
        return Samples.getAggregatedSamples()
            .then(convertResults)
            .then(draw);
    }

    function draw(data) { heatMap.setData(state ? data : []); }


    Object.assign(HeatMap, { init, initHeatMap, getHeatMap: () => heatMap });
}(window.Controls.HeatMap = {}, window.Config));
