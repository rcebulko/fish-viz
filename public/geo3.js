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

var map, bounds;
var region_select, region_rectangles;
var overlay, layer, svg, projection;
var padding = 10;
var markers = [];

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

        region_rectangles[k] = new google.maps.Rectangle({
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.15,
            map: map,
            bounds: bounds,
        });
    });

    // creating selection options
    region_select = document.querySelector('select.geo.region');
    Object.keys(region_bounds).forEach(function (k) {
        var option = document.createElement('option');
        option.text = k;
        region_select.add(option);
    });

    var region = region_select.value;
    bounds = region_bounds[region];
    map.fitBounds(bounds);

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

    // TODO Center of screen always in bounds..
    // var boundlimits = {
    //   maxlat: bounds.getNorthEast().lat(),
    //   maxlng: bounds.getNorthEast().lng(),
    //   minlat: bounds.getSouthWest().lat(),
    //   minlng: bounds.getSouthWest().lng(),
    // };

    // var lastcenter = map.getCenter();
    // var newlat, newlng;
    // google.maps.event.addListener(map, 'center_changed', function() {
    //   center = map.getCenter();
    //   if (bounds.contains(center))
    //     lastcenter = center;
    //   else {
    //     if (boundlimits.minlat < center.lat() && center.lat() < boundlimits.maxlat)
    //       newlat = center.lat();
    //     else
    //       newlat = lastcenter.lat();

    //     if (boundlimits.minlng < center.lng() && center.lng() < boundlimits.maxlng)
    //       newlng = center.lng();
    //     else
    //       newlng = lastcenter.lng();

    //     map.panTo(new google.maps.LatLng(newlat, newlng));
    //   }
    // });

    overlay = new google.maps.OverlayView();
    overlay.onAdd = function() {
        layer = d3.select(this.getPanes().overlayLayer);

        // svg = layer.append('svg')
        //     .attr('class', 'stations')
        //     .attr('width', 100)
        //     .attr('height', 100)
        //     .style('background-color', 'black');

        overlay.draw = function() {
            projection = this.getProjection();

            // svg.call(transform_svg);

            // layer
            //     .selectAll('circle')
            //     .each(transform_sample);

            draw();
        };

//         select_region_onchange();
    };
    overlay.setMap(map);
}

function select_region_onchange() {
    var region = region_select.value;

    API.setRegion(region);

    bounds = region_bounds[region];
    map.fitBounds(bounds);

    draw();
}

function draw() {
    // TODO development only
    // API.setDateRange('2015-01-01', '2017-01-01');

    var bounds = map.getBounds();
    API.setGeoBounds(
        bounds.getSouthWest().lat(),
        bounds.getNorthEast().lat(),
        bounds.getSouthWest().lng(),
        bounds.getNorthEast().lng(),
    );

    API.fetchSpeciesSamples('ACA BAHI', function(data) {
        console.log('Number of samples: %d', data.length);
        dispatch.call('samples_loaded', null, data);
    });
}

// function transform_svg(s) {
//     var region_select = document.querySelector('select.geo.region');
//     var region = region_select.value;
//     var bounds = region_bounds[region];
//     var mi = bounds.getSouthWest();
//     var ma = bounds.getNorthEast();

//     var mipix = projection.fromLatLngToContainerPixel(mi);
//     var mapix = projection.fromLatLngToContainerPixel(ma);
//     return d3.select(this)
//         .attr('width', mapix.x - mipix.x)
//         .attr('height', mapix.y - mipix.y);
// }

// function transform_sample(d) {
//     d = new google.maps.LatLng(+d.latitude, +d.longitude);
//     d = projection.fromLatLngToDivPixel(d);
//     return d3.select(this)
//               .style('left', (d.x - padding) + 'px')
//               .style('top', (d.y - padding) + 'px');
// }

dispatch.on('samples_loaded.geo', function(data) {
    if (layer) {

        markers.forEach(function(m) {
            m.setMap(null);
        });

        markers = data.map(function(d) {
            var position = new google.maps.LatLng(+d.latitude, +d.longitude);
            return new google.maps.Marker({
                position: position,
                map: map,
            });
        });




        // var samples = layer.selectAll('circle').data(data);

        // samples
        //     .exit().remove();

        // samples
        //     .each(transform_sample)
        //     .enter().append('circle')
        //         .attr('class', 'sample')
        //         .each(transform_sample)
        //         .attr('r', 5)
        //         .attr('cx', padding + 5)
        //         .attr('cy', padding + 5);
    }
});
