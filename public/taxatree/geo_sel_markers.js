var species_code = 'ACA BAHI';

var colors = d3.scaleOrdinal(d3.schemeCategory10);
// var fid_ = 0;

// var geo_xscale = d3.scaleLinear().range([5, 95]);
// var geo_yscale = d3.scaleLinear().range([5, 95]);

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

var map, dm, bounds, rectangles = {}, plots = {};
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

    dm = new google.maps.drawing.DrawingManager({
        // drawingMode: google.maps.drawing.OverlayType.Marker,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['rectangle'],
        },
        rectangleOptions: {
            strokeOpacity: 1,
            strokeWeight: 3,
            fillOpacity: .15,
            draggable: true,
            editable: true,
            zIndex: -100,
        },
        map: map,
    });

    dm.addListener('rectanglecomplete', function(rectangle) {
        var filter = FilterManager.getFromRect(rectangle);
        dispatch.call('filter_changed', null, filter);
        rectangle.addListener('bounds_changed', function(event) {
            dispatch.call('filter_changed', null, filter);
        });

        // TODO set variables.. only way to get over weird behaviours like
        // the mouse getting out during a drag...

        // rectangle.addListener('mouseover', function(event) {
        //     dispatch.call('rectangle_mouseover', null, fid);
        // });

        // rectangle.addListener('mouseout', function(event) {
        //     dispatch.call('rectangle_mouseout', null, fid);
        // });

        // rectangle.addListener('dragstart', function(event) {
        //     dispatch.call('rectangle_mouseover', null, fid);
        // });

        // rectangle.addListener('dragend', function(event) {
        //     dispatch.call('rectangle_mouseout', null, fid);
        // });

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

        // var color;
        // if (k == 'DRY TORT')
        //     color = '#F00';
        // else if (k == 'FLA KEYS')
        //     color = '#0F0';
        // else if (k == 'SEFCRI')
        //     color = '#00F';
        // var rectangle = new google.maps.Rectangle({
        //     strokeColor: color,
        //     strokeOpacity: 0.8,
        //     strokeWeight: 2,
        //     fillColor: color,
        //     fillOpacity: 0.15,
        //     map: map,
        //     bounds: bounds,
        //     draggable: true,
        //     editable: true,
        // });

        // rectangle.addListener('bounds_changed', function(event) {
        //     var bounds = rectangle.getBounds();

        //     API.setGeoBounds(
        //         bounds.getSouthWest().lat(),
        //         bounds.getNorthEast().lat(),
        //         bounds.getSouthWest().lng(),
        //         bounds.getNorthEast().lng(),
        //     );
        //     API.fetchSampleData({ species_code: species_code }, function(data) {
        //         console.log('here');
        //     });
        // });
        // region_rectangles[k] = rectangle;
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
    google.maps.event.addListener(map, 'center_changed', function() {
        center = map.getCenter();
        if (bounds.contains(center))
            lastcenter = center;
        else {
            if (boundlimits.minlat < center.lat() && center.lat() < boundlimits.maxlat)
                newlat = center.lat();
            else
                newlat = lastcenter.lat();

            if (boundlimits.minlng < center.lng() && center.lng() < boundlimits.maxlng)
                newlng = center.lng();
            else
                newlng = lastcenter.lng();

            map.panTo(new google.maps.LatLng(newlat, newlng));
        }
    });

    google.maps.event.addListener(map, 'bounds_changed', function() {
        var bounds = map.getBounds();
        API.setGeoBounds(
            bounds.getSouthWest().lat(),
            bounds.getNorthEast().lat(),
            bounds.getSouthWest().lng(),
            bounds.getNorthEast().lng(),
        );

        draw();
    });

    overlay = new google.maps.OverlayView();
    overlay.onAdd = function() {
        layer = d3.select(this.getPanes().overlayLayer)
            .append('div')
            .attr('class', 'stations');

        // layer.append('svg');

        // layer.append('svg')
        //     .attr('width', '100')
        //     .attr('height', '100')
        //     .attr('class', 'blarg');

        // console.log('here');

        overlay.draw = function() {
            projection = this.getProjection();
            layer
                .selectAll('svg')
                .each(transform_sample);

            draw();
        };

//         select_region_onchange();
    };
    overlay.setMap(map);
}

function on_rectangle_change(event) {
    console.log(event);
    rectangle.getBounds().getNorthEast();
    rectangle.getBounds().getSouthWest();
}

function select_region_onchange() {
    var region = region_select.value;
    API.setRegion(region);

    bounds = region_bounds[region];
    map.fitBounds(bounds);

    draw();
}

function draw() {
    API.fetchSpeciesSamples(species_code, function(data) {
        console.log('Number of samples: %d', data.length);
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

var markers = {};
dispatch.on('samples_loaded.geo', function(data) {
    var oldmarkers = markers;
    markers = {};

    data.forEach(function(d) {
        var marker = markers[d.id];

        if(!marker)
            marker = new google.maps.Marker({
                position: new google.maps.LatLng(+d.latitude, +d.longitude),
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: d.length / 5,
                },
                map: map,
                zIndex: 100,
            });

        markers[d.id] = marker;
        delete oldmarkers[d.id];
    });

    Object.values(oldmarkers).forEach(function(marker) {
        marker.setMap(null);
    });

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
    // }
});

// TODO focus stuff, not important right now

// dispatch.on('plot_mouseover.select', function(fid) {
//     dispatch.call('filter_focus', null, fid);
// });

// dispatch.on('plot_mouseout.select', function(fid) {
//     dispatch.call('filter_unfocus', null, fid);
// });

// dispatch.on('rectangle_mouseover.rect', function(fid) {
//     dispatch.call('filter_focus', null, fid);
// });

// dispatch.on('rectangle_mouseout.rect', function(fid) {
//     dispatch.call('filter_unfocus', null, fid);
// });

// dispatch.on('filter_focus.all', function(fid) {
//     var plot = plots[fid];
//     plot.classed('focus', true);

//     var rectangle = rectangles[fid];
//     rectangle.setOptions({strokeWeight: 5});
// });

// dispatch.on('filter_unfocus.all', function(fid) {
//     var plot = plots[fid];
//     plot.classed('focus', false);

//     var rectangle = rectangles[fid];
//     rectangle.setOptions({strokeWeight: 3});
// });


dispatch.on('filter_changed', function(filter) {
    var bounds = filter.rectangle.getBounds();
    API.setGeoBounds(
        bounds.getSouthWest().lat(),
        bounds.getNorthEast().lat(),
        bounds.getSouthWest().lng(),
        bounds.getNorthEast().lng(),
    );
    API.fetchSampleData({ species_code: species_code }, function(data) {
        console.log('Data fetched for filter:', data.length);
        dispatch.call('filter_loaded', null, filter, data);
    });
});

dispatch.on('filter_loaded.data', function(filter, data) {
    filter.plot(data);
    // filter.plot_all(data);
});
