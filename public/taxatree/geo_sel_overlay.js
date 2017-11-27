var species_code = 'ACA BAHI';

var colors = d3.scaleOrdinal(d3.schemeCategory10);
// var fid_ = 0;

// var geo_xscale = d3.scaleLinear().range([5, 95]);
// var geo_yscale = d3.scaleLinear().range([5, 95]);

var region_bounds = {
    'FLA KEYS': {
        latmi: +24.4313,
        lngmi: -82.0109,
        latma: +25.7526,
        lngma: -80.0872,
    },
    'DRY TORT': {
        latmi: +24.5420,
        lngmi: -83.1037,
        latma: +24.7364,
        lngma: -82.7703,
    },
    'SEFCRI': {
        latmi: +25.7624,
        lngmi: -80.1559,
        latma: +27.1897,
        lngma: -79.9938,
    },
};

var map, dm, svgoverlay;
var bounds;
var region_select, region_rectangles;




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

    // SVG GMAP Overlay
    function SVGOverlay(map) {
        this.setMap(map);
        this.div = null
    }

    SVGOverlay.prototype = new google.maps.OverlayView();

    SVGOverlay.prototype.onAdd = function() {
        this.div = document.createElement('div');
        this.div.classList.add('stations');
        this.getPanes().overlayMouseTarget.appendChild(this.div);

        // select_region_onchange(); ???
    }

    SVGOverlay.prototype.draw = function() {
        // var me = this;
        d3.select(this.div)
            .selectAll('svg')
            .each(transform_sample);

        draw();
    };

    SVGOverlay.prototype.svgs = function() {
        return d3.select(this.div).selectAll('svg');
    };

    svgoverlay = new SVGOverlay(map);
}

function transform_sample(d) {
    d = new google.maps.LatLng(+d.latitude, +d.longitude);
    d = svgoverlay.getProjection().fromLatLngToDivPixel(d);
    return d3.select(this)
              .style('left', d.x + 'px')
              .style('top', d.y + 'px');
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

dispatch.on('samples_loaded.geo', function(data) {
    if (svgoverlay) {
        var svgs = svgoverlay.svgs().data(data, d => d.id);

        svgs
            .exit()
                .remove();

        var svgs_escope = svgs
            .enter().append('svg');

        // var me = this;
        svgs_escope
            .merge(svgs)
                .each(transform_sample);

        svgs_escope
                .attr('class', 'marker')
                .append('circle')
                    .attr('r', d => d.length / 2.5)
                    .on('mouseover', function(d) {
                        dispatch.call('geo_datum_focus', null, d);
                    })
                    .on('mouseout', function(d) {
                        dispatch.call('geo_datum_unfocus', null, d);
                    });
    }
});

// dispatch.on('filter_datum_focus', function(d) {
// });

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

function on_filter_changed(filter) {
    var bounds = filter.rectangle.getBounds();
    // TODO this is a temporary hack..
    API.setGeoBounds(
        bounds.getSouthWest().lat(),
        bounds.getNorthEast().lat(),
        bounds.getSouthWest().lng(),
        bounds.getNorthEast().lng(),
    );

    var d = new Date();
    var dstr = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
    console.log('Data request made ' + dstr);
    API.fetchSampleData({ species_code: species_code }, function(data) {
        var d = new Date();
        var dstr = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();

        // console.log('Data fetched ' + dstr + ' for filter:', data.length);
        console.log('Data fetched ' + dstr + ' for filter');
        dispatch.call('filter_loaded', null, filter, data);
    });
}

dispatch.on('filter_changed', TimeWarp.timewarp(500, on_filter_changed));

// dispatch.on('filter_changed', function(filter) {
//     var bounds = filter.rectangle.getBounds();
//     // TODO this is a temporary hack..
//     API.setGeoBounds(
//         bounds.getSouthWest().lat(),
//         bounds.getNorthEast().lat(),
//         bounds.getSouthWest().lng(),
//         bounds.getNorthEast().lng(),
//     );

//     var d = new Date();
//     var dstr = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
//     console.log('Data request made ' + dstr);
//     API.fetchSampleData({ species_code: species_code }, function(data) {
//         var d = new Date();
//         var dstr = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();

//         // console.log('Data fetched ' + dstr + ' for filter:', data.length);
//         console.log('Data fetched ' + dstr + ' for filter');
//         dispatch.call('filter_loaded', null, filter, data);
//     });
// });

dispatch.on('filter_loaded.data', function(filter, data) {
    filter.plot(data);
    // filter.plot_all(data);
});

dispatch.on('filter_datum_focus.a', function(d) {
    svgoverlay.svgs()
        .selectAll('circle')
            .filter(cd => cd.id == d.id)
            .classed('focus', true);
    svgoverlay.draw();
});

dispatch.on('filter_datum_unfocus.a', function(d) {
    svgoverlay.svgs()
        .selectAll('circle')
            .filter(cd => cd.id == d.id)
            .classed('focus', false);
    svgoverlay.draw();
});

// dispatch.on('geo_datum_focus.a', function(d) {

//     dispatch.call('datum_focus', null, d);
// });

// dispatch.on('geo_datum_unfocus.a', function(d) {
//     dispatch.call('datum_unfocus', null, d);
// });
