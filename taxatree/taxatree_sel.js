var taxa_selectors;

function draw_taxa(taxatree) {
  var taxah = d3.hierarchy(taxatree);

  familyh = taxah.descendants().filter(d => d.data.type == 'family')
  d3.select('select.taxa.family').selectAll('option')
  .data(familyh)
  .enter()
    .append('option')
      .attr('value', d => d.data.id)
      .text(d => d.data.id);

  genush = taxah.descendants().filter(d => d.data.type == 'genus')
  d3.select('select.taxa.genus').selectAll('option')
  .data(genush)
  .enter()
    .append('option')
      .attr('value', d => d.data.id)
      .text(d => d.data.id);

  speciesh = taxah.descendants().filter(d => d.data.type == 'species')
  d3.select('select.taxa.species').selectAll('option')
    .data(speciesh)
    .enter()
      .append('option')
        .attr('value', d => d.data.id)
        .text(d => d.data.id)
    .on('change', function(e) {
      console.log('HERE');
    });
}

function loss() {
  taxa_selectors = {};
  taxah.descendants().forEach(function(d) {
    if (d.data.type != 'root') {
      var selector = taxa_selectors[d.data.type];
      if (!selector) {
        selector = document.querySelector('select.taxa.'+d.data.type);
        taxa_selectors[d.data.type] = selector;
      }

      var option = document.createElement('option');
      option.value = d.data.id;
      option.innerHTML = d.data.id;
      selector.appendChild(option);
    }
  });

  var myselect = d3.select('body')
    .append('select')
        .attr('class', 'myselect')
  .attr('multiple', 'multiple')
    .on('change', onchange)

  var data = ['here', 'it', 'is'];
  var options = myselect.selectAll('option')
  .data(data).enter()
  .append('option')
  .text(d => d);

  function onchange() {
    selectValues = d3.select('select.myselect').selectAll('option')
    .filter(d => this.selected);

    console.log(selectValues);
    selectValues.forEach(function(d) {
      console.log(d);
    });

    // d3.select('body')
    // .append('p')
    // .text(selectValue + ' is the last one');
  }
}

function select_family_onchange() {
  // options = taxa_selectors.family.options
  // for(var i = 0; i < options.length; i++) {
  //   option = taxa_selectors.family.options[i];

  // }

  // select_genus_onchange();
}

function select_genus_onchange() {
  select_species_onchange();
}

function select_species_onchange() {
}
