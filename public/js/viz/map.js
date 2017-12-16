(function (Map, TaxonomyTree, Samples, Controls, Config) {
    var REGION_BOUNDS = Config.regionBounds,
        ZOOM_CHANGE_DEBOUNCE_MS = Config.zoomChangeDebounce,
        ZOOM_DEBOUNCE_MS = Config.zoomDebounce,
        PAN_THROTTLE_MS = Config.panThrottle,

        // let GMap resolve the promise as a callback
        mapLoaded = null,
        googlePromise = new Promise((resolve, reject) => { mapLoaded = resolve; }),

        tip = d3.tip()
            .attr('class', 'd3-tip')
            .direction('n')
            .html(sample => sample.html()),

        $mapWrapper = $(),
        map, mapNode, bounds, overlay, lasso,

        isLoading = false,
        loading = state => {
            if (state === isLoading) return;
            $mapWrapper.toggleClass('loading', isLoading = state);
        };


    function init() {
        return googlePromise
            .then(() => {
                console.info('Initializing map visualization');


                $mapWrapper = $('.map-wrapper');
                mapNode = d3.select('.map-view').node();
                map = new google.maps.Map(mapNode, {
                    zoom: 9,
                    mapTypeId: 'terrain',
                    disableDefaultUI: true,
                    zoomControl: true,
                    scaleControl: true,
                    minZoom: 8,
                    maxZoom: 14,
                });

                Controls.HeatMap.init(map);
                initBounds();
                initOverlay();
                initPan();
                setTimeout(initZoom, 5000);
                initLasso();

                Controls.Region.onChanged(fitRegion);
                Samples.onNew(drawNewSamples);
                Samples.onUpdate(results => {
                    drawNewSamples(results);
                    loading(false)
                });
                TaxonomyTree.onFocused(restyleFocus);
            }).then(() => {
                loading(true);
                Samples.getAggregatedSamples(map.getZoom());
            }).then(initHistory);
    }

    function initBounds() {
        Object.keys(REGION_BOUNDS).forEach(function (region) {
            var rb = REGION_BOUNDS[region],
                bounds = new google.maps.LatLngBounds();
            bounds.extend(new google.maps.LatLng(rb.lat[0], rb.lon[0]));
            bounds.extend(new google.maps.LatLng(rb.lat[1], rb.lon[1]));
            REGION_BOUNDS[region] = bounds;
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

        google.maps.event.addListener(map, 'center_changed', throttle(() =>
            Samples.getAggregatedSamples(), PAN_THROTTLE_MS));
    }

    function initZoom() {
        var zoomed = false;
        google.maps.event.addListener(map, 'idle', () => {
            if (zoomed) {
                Samples.getAggregatedSamples(map.getZoom());
                zoomed = false;
            }
        });
        google.maps.event.addListener(map, 'zoom_changed', () => zoomed = true);
    }

    function initLasso() {
        var baseClass = 'sample',
            possibleClass = 'lasso-possible',
            selectedClass = 'lasso-selected',

            willSelectClass = state =>
                d => Controls.LassoSelect.willSelect(d.id, state);

        lasso = d3.lasso()
            .targetArea(d3.select('.lasso-overlay'))
            .on('start', () => $('.map-overlay').addClass('lasso-active'))
            .on('draw', () => {
                lasso.possibleItems()
                    .classed(possibleClass, willSelectClass(true))
                lasso.notPossibleItems()
                    .classed(possibleClass, willSelectClass(false))


                updateSummaries(d3.selectAll('.lasso-possible').data());
            })
            .on('end', () => {
                var selection;

                $('.map-overlay').removeClass('lasso-active');

                lasso.selectedItems()
                    .classed(possibleClass, false)
                    .classed(selectedClass, willSelectClass(true))
                lasso.notSelectedItems()
                    .classed(possibleClass, false)
                    .classed(selectedClass, willSelectClass(false))

                selection = d3.selectAll('.lasso-selected').data();
                Controls.LassoSelect.setValue(selection.map(s => s.id));
                updateSummaries(selection);
            });

        d3.select('.lasso-overlay').call(lasso)
        updateSummaries([]);
    }

    function updateSummaries(selection) {
        var counts = {};

        selection.forEach(s => {
            counts[s.species.id()] = (counts[s.species.id()] || 0) +
                s.aggregated().totalNumber
        });

        $summs = $('.summaries');
        if (Object.keys(counts).length) {
            $summs.html('');
            Object.keys(counts).forEach(id => {
                $summs.append('<li class="summary">' +
                    '<span class="drag-handle">☰</span><i>' +
                    Taxonomy.species[id].name() +
                    ':</i> ' +
                    counts[id] +
                    '<svg class="summary-viz"></svg>' +
                    '</li>')
            });

            Sortable.create($summs[0], {
                animation: 250
            })
        } else {
            $summs.html('No data selected')
        }
    }


    // sample pruning and merging
    function geoPruneSamples(samples) {
        var view = map.getBounds().toJSON(),

            height = view.north - view.south,
            width = view.east - view.west,

            expandedBounds = new google.maps.LatLngBounds(
                { lat: view.south - height, lng: view.west - width },
                { lat: view.north + height, lng: view.east + width },
            ),
            i, key;

        return samples.filter(s =>
                expandedBounds.contains({ lat: s.latitude, lng: s.longitude }));
    }

    function drawNewSamples(results) {
        var samples = geoPruneSamples(results.samples),
            nodes = overlay.children().data(samples, d => d.id),
            newNodes = nodes.enter().append('svg').classed('sample', true);

        loading(true);
        console.debug('Drawing %d new samples', samples.length);

        if (results.redraw) {
            nodes.exit()
                .transition()
                .delay(1000)
                .remove();
            nodes.exit()
                .selectAll('.sample-marker')
                .transition()
                .duration(1000)
                .attr('r', 0)
        }

        drawNewNodes(newNodes);
        nodes.merge(newNodes)
            .selectAll('.sample-marker')
            .transition()
            .duration(1000)
            .attr('r', s => s.radius());

        lasso.items(nodes.merge(newNodes));
        restyleFocus();
    }

    function drawNewNodes(newNodes) {
        overlay.draw();

        // initialize d3-tip on each marker SVG
        newNodes.selectAll('svg')
            ._parents
            .map(d3.select)
            .forEach(viz => viz.call(tip));

        newNodes.append('circle')
            .classed('sample-marker', true)
            .style('fill', d => d.species.color)
            .style('stroke', '#000')
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .attr('r', 0)
        // newNodes.selectAll('.sample-marker')
            // .attr('')
    }

    function restyleFocus(inFocus) {
        if (inFocus) {
            overlay.children()
                .style('opacity', d => d.species.isFocused() ? 1 : 0.1)
        } else {
            overlay.children()
                .style('opacity', 1)
        }
    }

    function fitRegion(region) {
        bounds = REGION_BOUNDS[region];
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
        }, ZOOM_CHANGE_DEBOUNCE_MS);

        MapState.prototype.onValueChanged = function (cb) {
            this.listeners.push(cb);
        };

        Controls.History.register(new MapState());
    }


    Object.assign(Map, {
        init,
        mapLoaded,

        getMap: () => map,
    });
}(window.Viz.Map = {},
    window.Viz.TaxonomyTree,
    window.Samples,
    window.Controls,
    window.Config));
