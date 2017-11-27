var region_bounds = {
    'DRY TORT': {
        latmi: +24.5420,
        lngmi: -83.1037,
        latma: +24.7364,
        lngma: -82.7703,
    },
    'FLA KEYS': {
        latmi: +24.4313,
        lngmi: -82.0109,
        latma: +25.7526,
        lngma: -80.0872,
    },
    'SEFCRI': {
        latmi: +25.7624,
        lngmi: -80.1559,
        latma: +27.1897,
        lngma: -79.9938,
    },
};

var map, heatmap0, heatmap1, bounds;
var region_select, region_rectangles;
var overlay, layer, projection;
var padding = 10;

function initMap() {
    map = new google.maps.Map(d3.select('#map').node(), {
        zoom: 9,
        mapTypeId: 'terrain',
        disableDefaultUI: true,
        zoomControl: true,
        scaleControl: true,
        minZoom: 8,
        maxZoom: 14,
    });

    // creating regions
    region_rectangles = {};
    Object.entries(region_bounds).forEach(function (entry) {
        var k = entry[0],
            v = entry[1];

        var bounds = new google.maps.LatLngBounds()
        bounds.extend(new google.maps.LatLng(v.latmi, v.lngmi));
        bounds.extend(new google.maps.LatLng(v.latma, v.lngma));
        region_bounds[k] = bounds;

        // region_rectangles[k] = new google.maps.Rectangle({
        //     strokeColor: '#FF0000',
        //     strokeOpacity: 0.8,
        //     strokeWeight: 2,
        //     fillColor: '#FF0000',
        //     fillOpacity: 0.15,
        //     map: map,
        //     bounds: bounds,
        // });
    });

    // creating selection options
    region_select = document.querySelector('select.geo.region');
    Object.keys(region_bounds).forEach(function (k) {
        var option = document.createElement('option');
        option.text = k;
        region_select.add(option);
    });

    select_region_onchange();
    // var region = region_select.value;
    // bounds = region_bounds[region];
    // map.fitBounds(bounds);

    // TODO screen always within bounds
    var boundlimits = {
        maxlat: bounds.getNorthEast().lat(),
        maxlng: bounds.getNorthEast().lng(),
        minlat: bounds.getSouthWest().lat(),
        minlng: bounds.getSouthWest().lng(),
    };

    var lastcenter = map.getCenter();
    var newlat, newlng;
    // google.maps.event.addListener(map, 'center_changed', function() {
    //     center = map.getCenter();
    //     if (bounds.contains(center))
    //         lastcenter = center;
    //     else {
    //         if (boundlimits.minlat < center.lat() && center.lat() < boundlimits.maxlat)
    //             newlat = center.lat();
    //         else
    //             newlat = lastcenter.lat();

    //         if (boundlimits.minlng < center.lng() && center.lng() < boundlimits.maxlng)
    //             newlng = center.lng();
    //         else
    //             newlng = lastcenter.lng();

    //         map.panTo(new google.maps.LatLng(newlat, newlng));
    //     }
    // });

    google.maps.event.addListener(map, 'bounds_changed', function() {
        var bounds = map.getBounds();
        API.setGeoBounds(
            bounds.getSouthWest().lat(),
            bounds.getNorthEast().lat(),
            bounds.getSouthWest().lng(),
            bounds.getNorthEast().lng(),
        );
    });

    google.maps.event.addListener(map, 'idle', function() {
        draw();
    });

    // overlay = new google.maps.OverlayView();
    // overlay.onAdd = function() {
    //     layer = d3.select(this.getPanes().overlayLayer)
    //         .append('div')
    //         .attr('class', 'stations');

    //     // layer.append('svg');

    //     // layer.append('svg')
    //     //     .attr('width', '100')
    //     //     .attr('height', '100')
    //     //     .attr('class', 'blarg');

    //     // console.log('here');

    //     overlay.draw = function() {
    //         projection = this.getProjection();
    //         layer
    //             .selectAll('svg')
    //             .each(transform_sample);

    //         draw();
    //     };

// //         select_region_onchange();
    // };
    // overlay.setMap(map);
}

function select_region_onchange() {
    var region = region_select.value;
    API.setRegion(region);

    bounds = region_bounds[region];
    map.fitBounds(bounds);

    draw();
}

function draw() {
    API.fetchSpeciesSamples('ACA BAHI', function(data) {
        console.log('Number of samples: %d', data.length);
        // data.forEach(function(d) {
        //     console.log(d);
        // });
        dispatch.call('samples_loaded', null, data);
    });
}

function transform_sample(d) {
    d = new google.maps.LatLng(+d.latitude, +d.longitude);
    d = projection.fromLatLngToDivPixel(d);
    return d3.select(this)
              .style('left', (d.x - padding) + 'px')
              .style('top', (d.y - padding) + 'px');
}

DateRange.onRealChange(function() {
    draw();
});

dispatch.on('samples_loaded.geo', function(data) {
    var drange = API.getDateRange(),
        from = Date.parse(drange[0])/1000,
        to = Date.parse(drange[1])/1000,
        times = 1 / (to - from);
        plus = - from  * times;


    // data.forEach(function(d) {
    //     d.t = Date.parse(d.date)/1000 * times  + plus;
    // });

    // data.forEach(function(d) {
    //     console.log(d.t);
    // });

    var data0 = data.map(d => ({
        location: new google.maps.LatLng(+d.latitude, +d.longitude),
        weight: 1 - d.t,
    }));

    var data1 = data.map(d => ({
        location: new google.maps.LatLng(+d.latitude, +d.longitude),
        weight: d.t,
    }));

    if (!heatmap1)
        var gradient1 = ['rgba(255, 0, 0, 0)', 'rgba(0, 0, 255, 1)'];
        heatmap1 = new google.maps.visualization.HeatmapLayer({
            map: map,
            gradient: gradient1,
        });

    if (!heatmap0)
        var gradient0 = ['rgba(0, 0, 255, 0)', 'rgba(255, 0, 0, 1)'];
        heatmap0 = new google.maps.visualization.HeatmapLayer({
            map: map,
            gradient: gradient0,
        });

    heatmap0.setData(data0);
    heatmap1.setData(data1);

    // if (layer) {

    //     var samples = layer.selectAll('svg').data(data, d => d.id);

    //     samples
    //         .exit().remove();

    //     samples
    //         .each(transform_sample)
    //         .enter().append('svg')
    //             .each(transform_sample)
    //             .attr('class', 'marker')
    //             .append('circle')
    //                 .attr('r', d => d.length / 2.5)
    //                 .attr('cx', padding + 5)
    //                 .attr('cy', padding + 5);

    //     // TODO not circle per sample..
    //     // but heatmap hex layout
    // }
});
