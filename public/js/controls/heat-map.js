(function (HeatMap) {
    var state = false,

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

        convertSamples = samples => samples.map(s => {
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
        return Samples.getSamples()
            .then(convertSamples)
            .then(heatMapData => {
                heatMap = new google.maps.visualization.HeatmapLayer({
                    data: [],
                    radius: 30,
                });

                heatMap.setMap(map);
                draw(heatMapData);
                Samples.onData(samples => draw(convertSamples(samples)));
            });
    }

    function update() {
        return Samples.getSamples()
            .then(convertSamples)
            .then(draw);
    }

    function draw(data) { heatMap.setData(state ? data : []); }


    Object.assign(HeatMap, { init, initHeatMap, getHeatMap: () => heatMap });
}(window.Controls.HeatMap = {}));
