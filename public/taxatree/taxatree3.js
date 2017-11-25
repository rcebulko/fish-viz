// node radius
var radius = 10;
var taxa_radius = Math.min(width, height)/2 - radius;

var arc, x, y, color;
var paths;

function draw_taxatree() {
    x = d3.scaleLinear().range([0, 2 * Math.PI]);
    // y = d3.scaleLinear().range([0, taxa_radius]);
    y = d3.scalePow().exponent(1.5).range([0, taxa_radius]);
    color = d3.scaleOrdinal(d3.schemeCategory20);

    // var partition = d3.partition();

    arc = d3.arc()
        .startAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x0))))
        .endAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x1))))
        .innerRadius(d => Math.max(0, y(d.y0)))
        // .outerRadius(d => Math.max(0, y(d.y1)));
        .outerRadius(d => y(1));

    // taxatree = d3.hierarchy(taxatree);
    // // This makes all leaves of the same size
    // taxatree.sum(d => d.type == 'species'? 1: undefined);
    // taxatree.count()
    // taxatree.sort((a,b) => b.height - a.height || b.value - a.value);

    // nodes = partition(taxatree).descendants();
    // nodes.forEach(function(d) {
    //   if (d.parent)
    //     d.y1 = 1;
    // });

    // paths = g_taxa
    //     .selectAll('path');

    draw_tree();

    // TODO try to have first layer same width everywhere;  this is not working
    // taxatree.value = 1;
    // taxatree.descendants().forEach(function(d) {
    //   if (d.depth == 1)
    //     d.value = d.parent.children.length;
    // });

    // g_taxa.selectAll('path')
    //   // .data(partition(taxatree).descendants())
    //   .data(nodes)
    //   .enter()
    //     .append('path')
    //     .attr('d', arc)
    //     .style('fill', d => color((d.children? d: d.parent).data.id))
    //   .on('mouseover', function(d) {
    //     dispatch.call('taxa_mouseover', null, d);
    //   })
    //   .on('mouseout', function(d) {
    //     dispatch.call('taxa_mouseout', null, d);
    //   })
    //   .on('click', function(d) {
    //     dispatch.call('taxa_click', null, d);
    //   });
}

dispatch.on('taxa_mouseover.taxatree', function(d) {
    taxa_tooltip
        .html(d.data.id)
        .style('left', d3.event.pageX + 'px')
        .style('top', (d3.event.pageY-28) + 'px')
        .transition()
            .duration(200)
            .style('opacity', .9);
});

dispatch.on('taxa_mouseout.taxatree', function() {
    taxa_tooltip
        .transition()
            .duration(500)
            .style('opacity', 0);
});

dispatch.on('taxa_click.taxatree', function(d) {
    select_node(d, false);
    // select_node(d, true);

    draw_tree();

  // g_taxa
  //   .transition()
  //     .duration(750)
  //     .tween('scale', function() {
  //       var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
  //           yd = d3.interpolate(y.domain(), [d.y0, 1]),
  //           yr = d3.interpolate(y.range(), [d.y0>0? 20: 0, taxa_radius]);
  //       return function(t) {
  //         x.domain(xd(t));
  //         y.domain(yd(t)).range(yr(t));
  //       };
  //     })
  //   .selectAll('path')
  //     .attrTween('d', d => () => arc(d));
});

function select_node(d, propagate) {
    value = !d.data.selected;
    d.data.selected = value;

    if (propagate) {
        // updates descendant values
        d.descendants().forEach(function(d) {
            d.data.selected = value;
        });

        // updates ancestor values
        d.ancestors().forEach(function(d) {
            if (d.children && d.children.every(d => d.data.selected == value))
                d.data.selected = value;
        });
    }
}

function draw_tree() {
    taxatree_ = d3.hierarchy(taxatree, function (d) {
        if (d.children) {
            children = d.children.filter(d => d.selected);
                if (children.length)
                    return children;
            }
    });

    taxatree_.count()
    // taxatree_.sort((a,b) => b.height - a.height || b.value - a.value);
    // taxatree_.sort((a,b) => b.height - a.height || a.data.id.localeCompare(b.data.id));
    // taxatree_.sort((a,b) => a.height - b.height || a.data.id.localeCompare(b.data.id));
    taxatree_.sort((a,b) => a.data.id.localeCompare(b.data.id));

    var nodes = d3.partition()(taxatree_).descendants();

    // forEach(function(d) {
    //   console.log(d);
    // });
    // var selected_nodes = nodes.filter(d => d.data.selected);

    // TODO compute new partition here..... absolutely must happen

    paths = g_taxa.selectAll('path')
            .data(nodes, d => d.data.uniq);

    paths
        .exit().remove();

    paths
        .enter().append('path')
            // .style('fill', d => color(d.data.id))
            .on('mouseover', function(d) {
                dispatch.call('taxa_mouseover', null, d);
            })
            .on('mouseout', function(d) {
                dispatch.call('taxa_mouseout', null, d);
            })
            .on('click', function(d) {
                dispatch.call('taxa_click', null, d);
            })
        .merge(paths)
            .transition()
                .duration(500)
                .attr('d', arc)
                .style('fill', d => color(d.data.id))
            // .style('fill', d => color((d.children? d: d.parent).data.id));
            // .each(function(d) {
            //     console.log(d);
            // });

    // g_taxa.selectAll('path')
    //   // .data(partition(vData).descendants())
    //   .data(selected_nodes)
    //   .exit()
    //     .remove()
    //   .enter()
    //     .append('path')
    //     .attr('d', arc)
    //     .style('fill', d => color((d.children? d: d.parent).data.id))
    //     .on('mouseover', function(d) {
    //       dispatch.call('taxa_mouseover', null, d);
    //     })
    //     .on('mouseout', function(d) {
    //       dispatch.call('taxa_mouseout', null, d);
    //     })
    //     .on('click', function(d) {
    //       dispatch.call('taxa_click', null, d);
    //     });
}
