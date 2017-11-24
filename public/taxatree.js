// node radius
var radius = 10;

function select_family_onchange() {
  taxa_select.genus.value = '*';
}

function select_genus_onchange() {
  taxa_select.species.value = '*';
}

function select_species_onchange() {
}

function draw_taxa(vData) {
  // Declare d3 layout
  var vLayout = d3
    .tree()
    .size([
      2 * Math.PI,
      Math.min(width, height)/2 - radius // margin!
    ]);

  // Layout + Data
  var vRoot = d3.hierarchy(vData);
  vRoot.count()
  vRoot.sort((a,b) => b.height - a.height || b.value - a.value);
  var vNodes = vRoot.descendants();
  var vLinks = vLayout(vRoot).links();

  // Draw on screen
  g_taxa.selectAll('path')
    .data(vLinks)
    .enter()
      .append('path')
      .attr('d', d3.linkRadial()
                    .angle(d => d.x)
                    .radius(d => d.y)
      );

  g_taxa.selectAll('circle')
    .data(vNodes)
    .classed('selected', d => d.data.selected)
    .enter()
      .append('circle')
      .attr('class', 'taxa')
      .attr('r', radius)
      .attr('transform', d => 'translate(' + d3.pointRadial(d.x, d.y) + ')')
      .on('mouseover', function(d) {
        dispatch.call('taxa_mouseover', null, d);
      })
      .on('mouseout', function(d) {
        dispatch.call('taxa_mouseout', null, d);
      })
      .on('click', function(d) {
        dispatch.call('taxa_click', null, d);
      });
};

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

function taxatree_select(d, propagate) {
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

  g_taxa
    .selectAll('circle')
    .classed('selected', d => d.data.selected);
}

// function taxatree_toggle(d) {
//   console.log('toggle:');
//   console.log(d);
// }

dispatch.on('taxa_click.taxatree', function(d) {
  taxatree_select(d, true);

  // TODO this has a bug, the event is only fired once...
  // var propagate = d3.event.ctrlKey;
  // taxatree_select(d, propagate);

  // if (d3.event.ctrlKey)
  //   taxatree_toggle(d);
  // else
  //   taxatree_select(d);
});
