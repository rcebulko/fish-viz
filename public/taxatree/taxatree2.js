// node radius
var radius = 10;
var taxa_radius = Math.min(width, height)/2 - radius;

var arc, x, y;

function draw_taxa(vData) {
  x = d3.scaleLinear().range([0, 2 * Math.PI]);
  y = d3.scaleLinear().range([0, taxa_radius]);
  var color = d3.scaleOrdinal(d3.schemeCategory20);

  var partition = d3.partition();

  arc = d3.arc()
    .startAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x0))))
    .endAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x1))))
    .innerRadius(d => Math.max(0, y(d.y0)))
    .outerRadius(d => Math.max(0, y(d.y1)));

  vData = d3.hierarchy(vData);

  // This makes all leaves of the same size
  // vData.sum(d => d.type == 'species'? 1: undefined);
  vData.count()
  vData.sort((a,b) => b.height - a.height || b.value - a.value);

  // TODO try to have first layer same width everywhere;  this is not working
  // vData.value = 1;
  // vData.descendants().forEach(function(d) {
  //   if (d.depth == 1)
  //     d.value = d.parent.children.length;
  // });

  g_taxa.selectAll('path')
    .data(partition(vData).descendants())
    .enter()
      .append('path')
      .attr('d', arc)
      .style('fill', d => color((d.children? d: d.parent).data.id))
    .on('mouseover', function(d) {
      dispatch.call('taxa_mouseover', null, d);
    })
    .on('mouseout', function(d) {
      dispatch.call('taxa_mouseout', null, d);
    })
    .on('click', function(d) {
      dispatch.call('taxa_click', null, d);
    });
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
  g_taxa
    .transition()
      .duration(750)
      .tween('scale', function() {
        var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
            yd = d3.interpolate(y.domain(), [d.y0, 1]),
            yr = d3.interpolate(y.range(), [d.y0>0? 20: 0, taxa_radius]);
        return function(t) {
          x.domain(xd(t));
          y.domain(yd(t)).range(yr(t));
        };
      })
    .selectAll('path')
      .attrTween('d', d => () => arc(d));
});
