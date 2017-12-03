// Dependencies:
// - d3
// - taxonomy

window.Viz = window.Viz || {};
(function (exports) {
    var x = d3.scaleLinear().range([0, 100]),
        y = d3.scalePow().exponent(1.5).range([0, 100]),
        color = d3.scaleOrdinal(d3.schemeCategory20),
        transitionDuration = 200,

        viz = null,
        width = 0,
        height = 0,

        fillColor = d => d.data.isEnabled() ? color(d.data.id()) : '#333';


    function init() {
        console.info('Initializing taxonomy tree visualization');

        viz = d3.select('.taxonomy-tree').append('g');
        width = +viz.attr('width');
        height = +viz.attr('height');

        onToggled(draw);
        Controls.SelectTaxonomy.onChange(draw);
        draw();
    }

    // dispatch.on('taxa_mouseover.taxatree', function(d) {
    //     tip_taxa
    //         .html(d.data.id())
    //         .transition()
    //             .duration(200)
    //             .style('opacity', .9);
    //     dispatch.call('taxa_mousemove', null, d);
    // });

    // dispatch.on('taxa_mousemove.taxatree', function(d) {
    //     tip_taxa
    //         .style('left', d3.event.pageX + 'px')
    //         .style('top', (d3.event.pageY-32) + 'px')
    // });

    // dispatch.on('taxa_mouseout.taxatree', function() {
    //     tip_taxa
    //         .transition()
    //             .duration(500)
    //             .style('opacity', 0);
    // });

    function draw() {
        var tree = d3.hierarchy(Taxonomy.root, d => {
                var children = d.children();

                if (children) {
                    children = children.filter(child => child.isSelected());

                    if (children.length) {
                        return children;
                    }
                }
            }),

            minX0 = Infinity,
            maxX1 = -Infinity,
            xf,

            nodes, rects;

        tree.count();
        tree.sort((a,b) => a.data.id().localeCompare(b.data.id()));

        nodes = d3.partition()(tree).descendants();
        rects = viz.selectAll('rect').data(nodes, d => d.data.id());

        rects.style('fill', fillColor);
        rects.exit()
            .on('click', null)
            .each(function(d) {
                minX0 = Math.min(minX0, d.x0);
                maxX1 = Math.max(maxX1, d.x1);
            })
            .transition()
                .duration(transitionDuration)
                .attr('x', d => x(minX0 / (1 - maxX1 + minX0)) + '%')
                .attr('width', '0%')
            .remove();

        rects
            .enter().append('rect')
                .style('fill', fillColor)
                .style('stroke-width', 2)
                .style('stroke', '#000')
                // .on('mouseover', function(d) {

                //     dispatch.call('taxa_mouseover', null, d);
                // })
                // .on('mousemove', function(d) {
                //     dispatch.call('taxa_mousemove', null, d);
                // })
                // .on('mouseout', function(d) {
                //     dispatch.call('taxa_mouseout', null, d);
                // })
                .on('click', function(d) {
                    d.data.toggle();
                    console.log(
                        (d.data.isEnabled() ? 'En' : 'Dis') +
                        'abled ' +
                        d.data)

                    $(document).trigger('taxonomy_change.toggled', d.data);
                })
            .merge(rects)
                .transition()
                    .duration(transitionDuration)
                    .attr('x', d => x(d.x0) + '%')
                    .attr('y', d => y(d.y0) + '%')
                    .attr('width', d => (x(d.x1) - x(d.x0)) + '%')
                    .attr('height', d => (y(1) - y(d.y0)) + '%');
    }

    function onToggled(callback) {
        $(document).on('taxonomy_change.toggled', (evt, s) => callback(s));
    }


    Object.assign(exports, { init, draw, onToggled })
}(window.Viz.TaxonomyTree = window.Viz.TaxonomyTree || {}));
