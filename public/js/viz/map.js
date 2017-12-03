// Dependencies:
// - d3

window.Viz = window.Viz || {};
(function (exports) {
    var regionBounds = {
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

    initReady = false,
    googleReady = false,

    map, bounds, center, overlay;

    function init() {
        initReady = true;
        tryInit();
    }

    function mapLoaded() {
        googleReady = true;

        initBounds();
        initOverlay();
        tryInit();
    }

    function tryInit() {
        if (!googleReady || !initReady) return;
        console.info('Initializing map visualization');

        map = new google.maps.Map(d3.select('#map').node(), {
            zoom: 9,
            mapTypeId: 'terrain',
            disableDefaultUI: true,
            zoomControl: true,
            scaleControl: true,
            minZoom: 8,
            maxZoom: 14,
        });

        fitRegion(Controls.Region.get());
        center = map.getCenter();
        overlay = new SVGOverlay(map)

        google.maps.event.addListener(map, 'center_changed', function() {
            var newCenter = map.getCenter();

            if (bounds.contains(newCenter)) {
                center = newCenter;
            } else {
                ['lat', 'lng'].forEach(dim => {
                    if (bounds.getSouthWest()[dim]() < newCenter[dim]() &&
                        newCenter[dim]() < bounds.getNorthEast()[dim]()) {
                        center[dim] = newCenter[dim];
                    }
                });

                map.panTo(center);
            }
        });

        google.maps.event.addListener(map, 'bounds_changed', draw);
        DataSource.onChange(drawSamples);
        draw();
    }

    function draw() {
        DataSource.getSamples().then(drawSamples);
    }

    function drawSamples(samples) {
        var nodes = overlay.children().data(samples, d => d.id)
            newNodes = nodes.enter().append('svg');

        nodes.exit().remove();

        newNodes.merge(nodes).each(transformSample);

        newNodes
            .attr('class', 'marker')
            .append('circle')
                .attr('fill', d => '#' + d.species.color)
                .attr('stroke', '#000')
                .attr('stroke-width', 1)
                .attr('r', d => d.length / 1.5)
                // .on('mouseover', function(d) {
                //     dispatch.call('geo_datum_focus', null, d);
                // })
                // .on('mouseout', function(d) {
                //     dispatch.call('geo_datum_unfocus', null, d);
                // });
    }

    function initBounds() {
        Object.keys(regionBounds).forEach(function (region) {
            var rb = regionBounds[region],
                bounds = new google.maps.LatLngBounds();
            bounds.extend(new google.maps.LatLng(rb.lat[0], rb.lon[0]));
            bounds.extend(new google.maps.LatLng(rb.lat[1], rb.lon[1]));
            regionBounds[region] = bounds;
        });
    }

    function fitRegion(region) {
        bounds = regionBounds[region];
        map.fitBounds(bounds);
    }


    function initOverlay() {
        SVGOverlay.prototype = new google.maps.OverlayView();

        SVGOverlay.prototype.onAdd = function() {
            var div = document.createElement('div');
            this.getPanes().overlayMouseTarget.appendChild(div);
            this.overlay = d3.select(div).attr('class', 'map-overlay');
        }

        SVGOverlay.prototype.draw = function() {
            this.children().each(transformSample);
            draw();
        };

        SVGOverlay.prototype.children = function() {
            return this.overlay.selectAll('svg');
        };

    }
    // SVG GMAP Overlay
    function SVGOverlay(map) {
        this.setMap(map);
        this.overlay = d3.select();
    }
    function transformSample (d) {
        var proj = overlay.getProjection().fromLatLngToDivPixel(
            new google.maps.LatLng(+d.latitude, +d.longitude))

        return d3.select(this)
            .style('left', proj.x + 'px')
            .style('top', proj.y + 'px')
            .style('position', 'absolute');
    }


    Object.assign(exports, { init, mapLoaded })
}(window.Viz.Map = window.Viz.Map || {}));
