// Provides interface into filters
(function (exports) {
    var plotduration = 500;

    var fid_ = 0;
    function nextFid() {
        fid_ += 1;
        return 'Filter_' + fid_;
    }

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

        this.div = d3.select('#plots').append('div')
            .style('border-color', this.color);
        this.svg = this.div.append('svg');
        this.circles_uscope = null;
        this.extents = {};

        this.instances[this.fid] = this;
    };

    Filter.prototype.filters = function() {
        return Object.values(Filter.prototype.instances);
    };

    Filter.prototype.accessors = {
        nt: d => Date.parse(d.date)/1000,
        nl: d => d.length,
    };

    Filter.prototype.remove = function() {
        // delete this.instances[this.fid];
        // this.rectangle.setMap(null);
        // this.plot.remove();
    };

    function normalize_wext(sel, ext, accessor, key) {
        sel.each(function(d) {
            d[key] = (accessor(d) - ext[0]) / (ext[1] - ext[0]);
        });
    }

    function normalize(sel, accessor, key) {
        var ext = d3.extent(sel.data(), accessor);
        normalize_wext(sel, ext, accessor, key);
    }

    var geo_xscale = d3.scaleLinear().range([0, 100]);
    var geo_yscale = d3.scaleLinear().range([0, 100]);

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

    Filter.prototype.plot = function(data) {
        // update extents
        Object.entries(this.accessors).forEach(function(entry) {
            var key = entry[0],
                accessor = entry[1];
            this.extents[key] = d3.extent(data, accessor);
        }, this);

        // actual updates
        var circles = this.svg.selectAll('circle').data(data, d => d.id);

        circles
            .exit()
                .transition()
                    .duration(plotduration)
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
                .duration(plotduration)
                .attr('r', 2);

        this.circles_uscope = circles_escope
            .merge(circles);

        this.filters().forEach(function(filter) {
            filter.updateCircles();
        });
    };

    Filter.prototype.updateCircles = function() {
        var allextents = this.allextents()
        this.circles_uscope
            // .call(normalize_wext, this.extents.nt, this.accessors.nt, 'nt')
            // .call(normalize_wext, this.extents.nl, this.accessors.nl, 'nl')
            .call(normalize_wext, allextents.nt, this.accessors.nt, 'nt')
            .call(normalize_wext, allextents.nl, this.accessors.nl, 'nl')
            .transition()
                .duration(500)
                .attr('cx', d => geo_xscale(d.nt) + '%')
                .attr('cy', d => geo_yscale(d.nl) + '%');
    };


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

    // function (accessor, key) {
    //     var ext = [undefined, undefined];
    //     filters().forEach({
    //         var ext = d3.extent(filter.data, accessor);
    //     });
    // }

    exports.FilterManager = {
        getFromRect,
        getFromFid,
    };
}(window));
