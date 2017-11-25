// must be loaded after `api.js`
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
}

var map, bounds;
var region_select, region_rectangles;

function initMap() {
  map = new google.maps.Map(d3.select('#map').node(), {
    zoom: 9,
    mapTypeId: 'terrain',
    disableDefaultUI: true,
    zoomControl: true,
    scaleControl: true,
    minZoom: 8,
    maxZoom: 12,
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

  select_region_onchange();

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

  API.fetchSampleData({ limit: 100 }, data => {
    dispatch.call('samples_loaded', null, data);
  });
}

function select_region_onchange() {
  region = region_select.value;
  bounds = region_bounds[region];
  map.fitBounds(bounds);
}

dispatch.on('samples_loaded.geo', function(data) {
  var overlay = new google.maps.OverlayView();
  overlay.onAdd = function() {
    var layer = d3
      .select(this.getPanes().overlayLayer)
      .append('div')
      .attr('class', 'stations');

    overlay.draw = function() {
      var projection = this.getProjection(),
          padding = 10;

      var marker = layer.selectAll('svg')
          // .data(d3.entries(data))
          .data(data)
          .each(transform)
          .enter()
            .append('svg')
            .each(transform)
            .attr('class', 'marker');

      marker
        .append('circle')
        .attr('r', 5)
        .attr('cx', padding + 5)
        .attr('cy', padding + 5);

      function transform(d) {
        d = new google.maps.LatLng(+d.LAT_DEGREES, +d.LON_DEGREES);
        d = projection.fromLatLngToDivPixel(d);
        return d3.select(this)
                  .style('left', (d.x - padding) + 'px')
                  .style('top', (d.y - padding) + 'px');
      }

    };
  };
  overlay.setMap(map);

});
