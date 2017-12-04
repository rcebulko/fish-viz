// Dependencies:
// - d3
// - taxonomy
// - select-taxonomy

window.Viz = window.Viz || {};
(function (exports) {
    var x = d3.scaleLinear().range([0, 100]),
        y = d3.scalePow().exponent(1.5).range([0, 100]),
        color = d3.scaleOrdinal(d3.schemeCategory20),
        transitionDuration = 200,

        viz = null,
        width = 0,
        height = 0,

        tip = d3.tip().attr('class', 'd3-tip')
            .html(d => d.data.html())
            .direction('s'),

        styleOpacity = d => d.data.isEnabled() ? 1 : 0.25,
        styleStroke = d => d.data.isFocused() ? '#FFF' : '#000',
        styleStrokeWidth = d => {
            if (!d.data.isEnabled()) {
                return 1;
            } else if (!d.data.isFocused()) {
                return 2;
            } else {
                return 4;
            }
        };


    function init() {
        console.info('Initializing taxonomy tree visualization');

        viz = d3.select('.taxonomy-tree').append('g');
        width = +viz.attr('width');
        height = +viz.attr('height');
        viz.call(tip);

        onToggled(() => {
            viz.selectAll('rect')
                .style('opacity', styleOpacity)
                .style('stroke-width', styleStrokeWidth);
        });

        onFocused(() => {
            viz.selectAll('rect')
                .style('stroke', styleStroke)
                .style('stroke-width', styleStrokeWidth);
        });

        Controls.SelectTaxonomy.onChange(draw);
        draw();
    }

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

        rects
            .enter().append('rect')
                .attr('fill', d => d.data.color)
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .on('mouseover', focus)
                .on('mouseout', unfocus)
                .on('click', toggle)
                .style('stroke', styleStroke)
                .style('stroke-width', styleStrokeWidth)
                .style('opacity', styleOpacity)
            .merge(rects)
                .transition()
                    .duration(transitionDuration)
                    .attr('x', d => x(d.x0) + '%')
                    .attr('y', d => y(d.y0) + '%')
                    .attr('width', d => (x(d.x1) - x(d.x0)) + '%')
                    .attr('height', d => (y(1) - y(d.y0)) + '%');

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
    }

    function toggle(d) {
        d.data.toggle();
        Taxonomy.cullEnabled();

        console.info(
            (d.data.isEnabled() ? 'En' : 'Dis') +
            'abled ' +
            d.data);

        $(document).trigger('taxonomy_change.toggled', d.data);
    }

    function onToggled(callback) {
        $(document).on('taxonomy_change.toggled', (evt, s) => callback(s));
    }


    function setFocus(d, state) {
        d.data.focus(state);
        $(document).trigger('taxonomy_change.focused', d.data);
    }

    function focus(d) { setFocus(d, true); }
    function unfocus(d) { setFocus(d, false); }

    function onFocused(callback) {
        $(document).on('taxonomy_change.focused', (evt, s) => callback(s));
    }

    Object.assign(exports, { init, draw, onToggled })
}(window.Viz.TaxonomyTree = window.Viz.TaxonomyTree || {}));
