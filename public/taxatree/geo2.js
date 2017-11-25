var overlay;
SampleOverlay.prototype = new google.maps.OverlayView();

function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 11,
    center: {lat: 62.323907, lng: -150.109291},
    mapTypeId: 'satellite'
  });

  overlay = new SampleOverlay(map);
}

/** @constructor */
function SampleOverlay(map) {
  this.map = map;
  this.setMap(map);
}

SampleOverlay.prototype.onAdd = function() {
  var layer = d3
    .select(this.getPanes().overlayLayer)
    .append('div')
      .attr('class', 'stasiont');
};

SampleOverlay.prototype.draw = function() {
  var projection = this.getProjection();

  var g = svg.selectAll('g')
          .data(data)
  .enter()
  .append('g')
  layer.select('svg').remove();

};

google.maps.event.addDomListener(window, 'load', initMap);
