(function (Map, TaxonomyTree, Samples, Controls) {
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

    // let GMap resolve the promise as a callback
    mapLoaded = null,
    googlePromise = new Promise((resolve, reject) => { mapLoaded = resolve; }),

    tip = d3.tip().attr('class', 'd3-tip')
        .direction('n')
        .html(sample => {
            return [
                '<b>Sample</b>',
                [
                    ['Date', Controls.DateRange.format(sample.date)],
                    ['Latitude', sample.latitude.toFixed(5)],
                    ['Longitude', sample.longitude.toFixed(5)],
                    ['Depth', sample.depth],
                    ['Length', sample.length],
                    ['Number', sample.number],
                    ['Protected', sample.protected ? 'Yes' : 'No'],
                ].map(lbl_val => '<b>' + lbl_val.join('</b>: ')).join('<br>'),
                sample.species.html(),
            ].join('<br><br>')
        }),

    map, bounds, overlay;


    function init() {
        var settings = Cookies.getJSON('map-settings') || {};

        return googlePromise
            .then(() => {
                console.info('Initializing map visualization');

                map = new google.maps.Map(d3.select('.map-view').node(), {
                    zoom: 9,
                    mapTypeId: 'terrain',
                    disableDefaultUI: true,
                    zoomControl: true,
                    scaleControl: true,
                    minZoom: 8,
                    maxZoom: 14,
                });

                initBounds();
                initOverlay();
                initPan();
                initZoom();

                Controls.Region.onChanged(fitRegion);
                Samples.onChanged(drawSamples);
                TaxonomyTree.onFocused(restyle);
            })
            .then(draw)
            .then(() => {
                initHistory();
            });
    }


    function initBounds() {
        Object.keys(regionBounds).forEach(function (region) {
            var rb = regionBounds[region],
                bounds = new google.maps.LatLngBounds();
            bounds.extend(new google.maps.LatLng(rb.lat[0], rb.lon[0]));
            bounds.extend(new google.maps.LatLng(rb.lat[1], rb.lon[1]));
            regionBounds[region] = bounds;
        });

        fitRegion(Controls.Region.getValue());
    }

    function initOverlay() {
        // SVG GMap Overlay
        function SVGOverlay(map) {
            this.setMap(map);
            this.overlay = d3.select();
        }

        SVGOverlay.prototype = new google.maps.OverlayView();

        SVGOverlay.prototype.onAdd = function () {
            var div = document.createElement('div');
            this.getPanes().overlayMouseTarget.appendChild(div);
            this.overlay = d3.select(div).attr('class', 'map-overlay');
        }

        SVGOverlay.prototype.draw = function () {
            this.children().each(transformSample);
        };

        SVGOverlay.prototype.children = function () {
            return this.overlay.selectAll('svg');
        };

        function transformSample (d) {
            var proj = overlay.getProjection().fromLatLngToDivPixel(
                new google.maps.LatLng(+d.latitude, +d.longitude))

            return d3.select(this)
                .style('left', proj.x + 'px')
                .style('top', proj.y + 'px');
        }

        overlay = new SVGOverlay(map);
    }

    function initPan() {
        var center = map.getCenter();

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
    }

    function initZoom() {
        google.maps.event.addListener(map, 'bounds_changed',
            () => overlay.draw());
    }


    function draw() {
        return Samples.getSamples().then(drawSamples);
    }

    function drawSamples(samples) {
        var nodes = overlay.children().data(samples, d => d.id),
            newNodes = nodes.enter().append('svg');

        nodes.exit().remove();
        overlay.draw();

        // initialize d3-tip on each marker SVG
        newNodes.selectAll('svg')
            ._parents
            .map(d3.select)
            .forEach(vis => vis.call(tip));

        newNodes
            .append('circle')
                .style('fill', d => d.species.color)
                .style('stroke', '#000')
                .style('stroke-width', 1)
                .attr('r', d => Math.log2(2 + d.number) * 2)
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)

        restyle();
    }

    function restyle(inFocus) {
        if (inFocus) {
            overlay.children()
                .style('opacity', d => d.species.isFocused() ? 1 : 0.1)
        } else {
            overlay.children()
                .style('opacity', 1)
        }
    }

    function fitRegion(region) {
        bounds = regionBounds[region];
        map.fitBounds(bounds);
    }


    // history interface
    function initHistory() {
        function MapState () {
            this.name = 'MapState';
            this.listeners = [];
            google.maps.event.addListener(map, 'bounds_changed', () =>
                !this.isWriting && this.triggerChanged());
        }

        MapState.prototype.getState = function () {
            return { center: map.getCenter(), zoom: map.getZoom() }
        };

        MapState.prototype.setState = function (newState) {
            this.isWriting = true;
            map.panTo(newState.center);
            map.setZoom(newState.zoom);
            this.isWriting = false;
        };

        MapState.prototype.triggerChanged = debounce(function () {
            this.listeners.forEach(cb => cb());
        }, 3000);

        MapState.prototype.onValueChanged = function (cb) {
            this.listeners.push(cb);
        };

        Controls.History.register(new MapState());
    }


    Object.assign(Map, { init, mapLoaded })
}(window.Viz.Map = {},
    window.Viz.TaxonomyTree,
    window.Samples,
    window.Controls));
