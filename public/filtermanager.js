// Provides interface into filters
(function (exports) {
    var uduration = 200;

    var fid_ = 0;
    function nextFid() {
        fid_ += 1;
        return 'Filter_' + fid_;
    }

    // TODO this should be handled differently...?
    var colors = d3.scaleOrdinal(d3.schemeCategory10);

    function Filter(rectangle) {
        this.rectangle = rectangle;
        this.init();
    }

    Filter.prototype.instances = {};

    Filter.prototype.init = function () {
        this.fid = nextFid();
        this.color = colors(this.fid);

        this.rectangle.setOptions({
            strokeColor: this.color,
            fillColor: this.color,
        });

        this.div = d3.select('#filters').append('div')
            .classed('filter', true)
            .style('border-color', this.color);

        this.hmap_div = this.div.append('div').classed('hmap', true);
        this.hmap_svg = this.hmap_div.append('svg');
        this.hmap_gradient = this.hmap_svg.append('defs').append('linearGradient')
            .attr('id', 'hmap_gradient_' + this.fid)
            .attr('x2', '0%')
            .attr('y2', '100%');
        this.hmap_rect = this.hmap_svg.append('rect')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'url(#hmap_gradient_' + this.fid + ')');
        this.hmap_circles_uscope = null;
        this.gextent = null;

        this.plot_div = this.div.append('div').classed('plot', true);
        this.plot_svg = this.plot_div.append('svg');
        this.plot_circles_uscope = null;
        this.extents = {};

        this.instances[this.fid] = this;
    };

    Filter.prototype.filters = function() {
        return Object.values(Filter.prototype.instances);
    };

    Filter.prototype.accessors = {
        date: d => Date.parse(d.date)/1000,
        length: d => d.length,
    };

    Filter.prototype.remove = function() {
        // delete this.instances[this.fid];
        // this.rectangle.setMap(null);
        // this.plot.remove();
    };

    // TODO ideas:
    // * toggle between inter view and intra view... (for each plot);
    // *

    Filter.prototype.allextents = function() {
        var extents = {};
        var filters = this.filters();
        Object.keys(this.accessors).forEach(function(key) {
            var allextents = [].concat.apply([], filters.map(filter => filter.extents[key]));
            extents[key] = d3.extent(allextents);
        });
        return extents;
    };

    Filter.prototype.allgextent = function() {
        var gextents = [].concat.apply([], this.filters().map(filter => filter.gextent));
        return d3.extent(gextents);
    };

    Filter.prototype.allscales = function() {
        var scales = {};
        Object.entries(this.allextents()).forEach(function(entry) {
            var key = entry[0],
                extent = entry[1];
            scales[key] = d3.scaleLinear().domain(extent);
        });
        return scales;
    };

    Filter.prototype.plot = function(data) {
        // update extents
        Object.entries(this.accessors).forEach(function(entry) {
            var key = entry[0],
                accessor = entry[1];
            this.extents[key] = d3.extent(data, accessor);
        }, this);

        this.plot_plot(data);
        this.plot_hmap(data);
    };

    Filter.prototype.plot_plot = function(data) {
        // actual updates
        var circles = this.plot_svg.selectAll('circle').data(data, d => d.id);

        circles
            .exit()
                .transition()
                    .duration(uduration)
                    .attr('r', 0)
                .remove();

        var circles_escope = circles
            .enter().append('circle')
                .attr('opacity', .5)
                .on('mouseover', function(d) {
                    dispatch.call('filter_datum_focus', null, d);
                })
                .on('mouseout', function(d) {
                    dispatch.call('filter_datum_unfocus', null, d);
                });

        circles_escope
            .transition()
                .duration(uduration)
                .attr('r', 2);

        this.plot_circles_uscope = circles_escope
            .merge(circles);

        this.filters().forEach(function(filter) {
            filter.plot_plotUpdate();
        });
    };

    Filter.prototype.plot_plotUpdate = function() {
        var accessors = this.accessors;
        var allscales = this.allscales();
        this.plot_circles_uscope
            .transition()
                .duration(uduration)
                .attr('cx', d => topercstr(allscales.date(accessors.date(d))))
                .attr('cy', d => topercstr(allscales.length(accessors.length(d))));
    };

    Filter.prototype.plot_hmap = function(data) {
        // var allextents = this.allextent();

        // TODO make global scaling...

        var nbins = 20;
        // var kscale = .05;
        var kscale = .1;
        var lscale = this.allscales().length;
        var laccessor = this.accessors.length;
        for(var gdata=[], i = 0; i < nbins; i++) {
            // var pbin = lscale.invert(i / (nbins - 1));
            var pbin = i / (nbins - 1);
            gdata[i] = d3.sum(data, function(d) {
                var pd = lscale(laccessor(d));
                return epanechikov_kernel((pbin - pd) / kscale);
            // }) / data.length;
            });
        }

        function epanechikov_kernel(u) {
            if (u < -1 || u > 1)
                return 0;
            return (1 - u * u) * 3 / 4;
        }

        this.gextent = d3.extent(gdata);
        console.log('normal gextent', this.gextent[0], this.gextent[1]);
        var stops = this.hmap_gradient.selectAll('stop').data(gdata);

        stops
            .exit()
                .remove();

        var stops_escope = stops
            .enter() .append('stop')
                .attr('offset', (d, i) => i / (nbins-1))

        this.plot_stops_uscope = stops_escope
            .merge(stops);

        this.filters().forEach(function(filter) {
            filter.plot_hmapUpdate();
        });
    };

    Filter.prototype.plot_hmapUpdate = function() {
        var allgextent = this.allgextent();
        console.log('all gextent', allgextent[0], allgextent[1]);
        var gcolor = d3.scaleLinear().domain(allgextent).range(['white', 'red']);
        // TODO the height should also be renormalized...
        this.plot_stops_uscope
            .transition()
                .duration(uduration)
                .attr('stop-color', d => gcolor(d));
    };

    // Filter.prototype.plot_hmap = function(data) {
    //     var color = d3.scaleOrdinal(d3.schemeCategory10);

    //     // NOTE dummy gradient data
    //     var ndata = 1 + Math.floor(5 * Math.random())
    //     for(data=[], i = 0; i < ndata; i++)
    //         data[i] = 100 * Math.random();

    //     var stops = this.hmap_gradient.selectAll('stop').data(data);

    //     stops
    //         .exit()
    //             .remove();

    //     stops
    //         .enter()
    //             .append('stop')
    //         .merge(stops)
    //             .attr('offset', d => d + '%')
    //             .attr('stop-color', (d, i) => color(i));
    // };

    // NOTE old hmap
    // Filter.prototype.plot_hmap = function(data) {
    //     var circles = this.hmap_svg.selectAll('circle').data(data, d => d.id);

    //     circles
    //         .exit()
    //             .transition()
    //                 .duration(uduration)
    //                 .attr('r', 0)
    //             .remove()

    //     var circles_escope = circles
    //         .enter().append('circle')
    //             .attr('opacity', .5)
    //             .on('mouseover', function(d) {
    //                 dispatch.call('filter_datum_focus', null, d);
    //             })
    //             .on('mouseout', function(d) {
    //                 dispatch.call('filter_datum_unfocus', null, d);
    //             });

    //     circles_escope
    //         .transition()
    //             .duration(uduration)
    //             .attr('r', 2);

    //     this.hmap_circles_uscope = circles_escope
    //         .merge(circles);

    //     this.filters().forEach(function(filter) {
    //         filter.plot_hmapUpdate();
    //     });

    // };

    // Filter.prototype.plot_hmapUpdate = function() {
    //     var allextents = this.allextents()
    //     this.hmap_circles_uscope
    //         // .call(normalize_wext, this.extents.nl, this.accessors.nl, 'nl')
    //         .call(normalize_wext, allextents.nl, this.accessors.nl, 'nl')
    //         .transition()
    //             .duration(500)
    //             .attr('cx', d => '50%')
    //             .attr('cy', d => geo_yscale(d.nl) + '%');
    // }

    var toperc = p => 100 * p;
    var topercstr = p => toperc(p) + '%';

    // Exported interface

    function getFromRect(rectangle) {
        // getting existing filter
        for(var filter in Filter.prototype.filters())
            if (filter.rectangle == rectangle)
                return filter;

        // creating new Filter
        return new Filter(rectangle);
    }

    function getFromFid(fid) {
        return Filter.prototype.instances[fid];
    }

    exports.FilterManager = {
        getFromRect,
        getFromFid,
    };
}(window));
