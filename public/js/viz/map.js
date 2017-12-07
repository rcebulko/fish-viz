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

    month = 1000 * 60 * 60 * 24 * 30,
    fmtDates = dateRange => {
        if (dateRange[1] - dateRange[0] < month) {
            return Controls.DateRange.format(dateRange[0]);
        } else {
            return dateRange.map(Controls.DateRange.format)
                .join(' to ');
        }
    },

    fmtProtected = prot => {
        if (prot > 0.99) {
            return 'Yes';
        } else if (prot < 0.01) {
            return 'No';
        } else {
            return prot.toFixed(3) * 100 + '%';
        }
    },

    tip = d3.tip().attr('class', 'd3-tip')
        .direction('n')
        .html(sample => {
            if (sample.aggregated) {
                return [
                    '<b>' + sample.count + ' Samples</b>',
                    [
                        ['Date', fmtDates(sample.date)],
                        ['Latitude', '~' + sample.latitude.toFixed(5)],
                        ['Longitude', '~' + sample.longitude.toFixed(5)],
                        ['Depth', sample.depth.map(d => d.toFixed(0)).join(' - ')],
                        ['Length', sample.length.map(len => len.toFixed(2)).join(' - ')],
                        ['Avg. Length', sample.avgLength.toFixed(2)],
                        ['Number', sample.number.map(n => n.toFixed(1)).join(' - ')],
                        ['Total Number', sample.totalNumber.toFixed(0)],
                        ['Protected', fmtProtected(sample.protected)],
                    ].map(lbl_val => '<b>' + lbl_val.join('</b>: ')).join('<br>'),
                    sample.species.html(),
                ].join('<br><br>');
            } else {
                return [
                    '<b>Sample</b>',
                    [
                        ['Date', Controls.DateRange.format(sample.date)],
                        ['Latitude', sample.latitude.toFixed(5)],
                        ['Longitude', sample.longitude.toFixed(5)],
                        ['Depth', sample.depth.toFixed(0)],
                        ['Length', sample.length.toFixed(2)],
                        ['Number', sample.number.toFixed(1)],
                        ['Protected', sample.protected ? 'Yes' : 'No'],
                    ].map(lbl_val => '<b>' + lbl_val.join('</b>: ')).join('<br>'),
                    sample.species.html(),
                ].join('<br><br>');
            }
        }),

    $mapWrapper = $(),
    map, mapNode, bounds, overlay, lasso,

    loading = state => $mapWrapper.toggleClass('loading', state);


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

                initBounds();
                initOverlay();
                initPan();
                setTimeout(initZoom, 5000);
                initLasso();

                Controls.Region.onChanged(fitRegion);
                Samples.onData(samples => {
                    loading(true);
                    drawSamples(samples);
                });
                TaxonomyTree.onFocused(restyle);
            }).then(draw)
                .then(initHistory);
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

        google.maps.event.addListener(map, 'center_changed',
            throttle(() => draw(), 1000));
    }

    function initZoom() {
        google.maps.event.addListener(map, 'zoom_changed',
            debounce(() => draw(), 250));
    }

    function initLasso() {
        var baseClass = 'sample',
            possibleClass = 'lasso-possible',
            selectedClass = 'lasso-selected',

            willSelect = Controls.LassoSelect.willSelect,
            // willSelectClass = (state, yesClass) => {
            //     return d => willSelect(d.id, state) ? yesClass : baseClass;
            // },
            willSelectClass = state => { return d => willSelect(d.id, state); };

        lasso = d3.lasso()
            .targetArea(d3.select('.lasso-overlay'))
            .on('start', () => $('.map-overlay').addClass('lasso-active'))
            .on('draw', () => {
                lasso.possibleItems()
                    .classed(possibleClass, willSelectClass(true))
                lasso.notPossibleItems()
                    .classed(possibleClass, willSelectClass(false))
            })
            .on('end', () => {
                $('.map-overlay').removeClass('lasso-active');

                lasso.selectedItems()
                    .classed(possibleClass, false)
                    .classed(selectedClass, willSelectClass(true))
                lasso.notSelectedItems()
                    .classed(possibleClass, false)
                    .classed(selectedClass, willSelectClass(false))

                Controls.LassoSelect.setSelection(
                    d3.selectAll('.lasso-selected')
                        .data()
                        .map(s => s.id));
            });
        d3.select('.lasso-overlay').call(lasso)
    }


    function draw() {
        loading(true);
        return Samples.getSamples(drawSamples)
            .then(drawSamples, () => null);
    }

    function nearBounds() {
        var bounds = map.getBounds(),

            ne = bounds.getNorthEast(),
            sw = bounds.getSouthWest(),

            latMin = sw.lat(),
            lngMin = sw.lng(),
            latMax = ne.lat(),
            lngMax = ne.lng(),

            latRange = latMax - latMin,
            lngRange = lngMax - lngMin;

        bounds.extend({ lat: latMin - latRange, lng: lngMin - lngRange });
        bounds.extend({ lat: latMax + latRange, lng: lngMax + lngRange });
        return bounds;
    }


    // sample pruning and merging
    function geoPruneSamples(samples) {
        var viewBounds = map.getBounds(),
            edges = viewBounds.toJSON(),

            height = edges.north - edges.south,
            width = edges.east - edges.west,

            expandedBounds = new google.maps.LatLngBounds(
                { lat: edges.south - height, lng: edges.west - width },
                { lat: edges.north + height, lng: edges.east + width },
            ),

            pxPerBucket = 30,

            vertRes = 3 * mapNode.offsetHeight / pxPerBucket,
            horizRes = 3 * mapNode.offsetWidth / pxPerBucket,

            buckets = {},
            getBucket = (val, min, range, res) =>
                Math.floor(res * (val - min - range) / (3 * range)),
            getVertBucket = val =>
                getBucket(val, edges.south, height, vertRes),
            getHorizBucket = val =>
                getBucket(val, edges.west, width, horizRes),
            bucketKey = (vert, horiz) => vert + '__' + horiz,
            sampleKey = sample => bucketKey(
                getVertBucket(sample.latitude),
                getHorizBucket(sample.longitude)),
            i, key;


        samples = samples.filter(s =>
                expandedBounds.contains({ lat: s.latitude, lng: s.longitude }))

        for (i = 0; i < samples.length; ++i) {
            key = sampleKey(samples[i]);
            if (typeof buckets[key] === 'undefined') buckets[key] = [];
            buckets[key].push(samples[i]);
        }

        return Object.values(buckets)
            .map(mergeSampleBucket)
            .reduce((acc, arr) => acc.concat(arr), []);
    }

    function mergeSampleBucket(bucket) {
        var samples = {},
            i, sample;

        for (i = 0; i < bucket.length; ++i) {
            sample = bucket[i]
            if (typeof samples[sample.species_code] === 'undefined') {
                samples[sample.species_code] = sample;
            } else {
                samples[sample.species_code] = mergeSamples(
                    samples[sample.species_code],
                    sample);
            }
        }

        return Object.values(samples);
    }

    function mergeSamples(s1, s2) {
        var s1 = s1.aggregated ? s1 : aggregatedSingleton(s1);
            total = s1.totalNumber + s2.number,

            avg = key => (s1[key] * s1.totalNumber + s2[key] * s2.number) / total,
            range = key => [
                Math.min(s1[key][0], s2[key]),
                Math.max(s1[key][1], s2[key])
            ];

        if (!s1.aggregated) s1 = aggregatedSingleton(s1);

        return {
            id: s1.id + '-' + s2.id,
            count: s1.count + 1,
            aggregated: true,
            date: range('date'),
            depth: range('depth'),
            latitude: avg('latitude'),
            longitude: avg('longitude'),
            length: range('length'),
            avgLength: (s1.avgLength * s1.totalNumber + s2.length * s2.number) / total,
            number: range('number'),
            totalNumber: total,
            protected: avg('protected'),
            species: s1.species,
            species_code: s1.species_code,
        }
    }

    function aggregatedSingleton(s) {
        return Object.assign({}, s, {
            aggregated: true,
            count: 1,
            date: [s.date, s.date],
            depth: [s.depth, s.depth],
            length: [s.length, s.length],
            avgLength: [s.length],
            number: [s.number, s.number],
            totalNumber: s.number,
        });
    }


    function drawSamples(samples, partial) {
        if (!samples) return;

        var samples = geoPruneSamples(samples),
            nodes = overlay.children().data(samples, d => d.id),
            newNodes = nodes.enter().append('svg').classed('sample', true),
            complete = partial !== 'partial';

        console.debug('Drawing %d samples', samples.length);

        nodes.exit().remove();
        overlay.draw();

        // initialize d3-tip on each marker SVG
        newNodes.selectAll('svg')
            ._parents
            .map(d3.select)
            .forEach(viz => viz.call(tip));

        newNodes
            .append('circle')
                .style('fill', d => d.species.color)
                .style('stroke', '#000')
                .style('stroke-width', 1)
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
            .merge(nodes)
                .attr('r', normalizedRadiusFn(samples));

        lasso.items(nodes.merge(newNodes));
        restyle();

        if (complete) loading(false);
    }

    function normalizedRadiusFn(samples) {
        var minR = 5, maxR = 20,
            minNum = Infinity,
            maxNum = -Infinity,

            getNum = s => Math.sqrt(s.aggregated ? s.totalNumber : s.number),// Math.log(1.5),

            // scale values between 0 and 1
            znorm = val => (val - minNum) / (maxNum - minNum);

        samples.map(getNum)
            .forEach(num => {
                minNum = Math.min(minNum, num);
                maxNum = Math.max(maxNum, num);
            });

        if (minNum === maxNum) {
            return () => (minR + maxR) / 2;
        } else {
            return d => minR + znorm(getNum(d)) * (maxR - minR);
        }

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
