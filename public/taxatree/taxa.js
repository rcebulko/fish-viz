var svg_taxa = d3.select('svg#taxatree'),
    width = +svg_taxa.attr('width'),
    height = +svg_taxa.attr('height');

// Prepare our physical space
var g_taxa = svg_taxa.append('g')
          .attr('transform', 'translate(' + width/2 + ',' + height/2 + ')');

// Adding taxa tooltip
var taxa_tooltip = d3 .select('body')
                      .append('div')
                        .attr('class', 'taxa tooltip')
                        .style('opacity', 0);

var taxa_select = {
  family: document.querySelector('select.taxa.family'),
  genus: document.querySelector('select.taxa.genus'),
  species: document.querySelector('select.taxa.species'),
};

var taxatree;

API.fetchSpeciesData(function(data) {
    // patching data - TODO do this at DB level
    data.forEach(function (d) {
        if (!d.family)
            d.family = 'NA';
    });

    data = data.filter(function (d) {
        return d.family != 'NA' && d.genus != 'UNK' && d.species != 'SPE.';
    });

    // creating hierarchical taxa tree
    taxatree = {
        type: 'root',
        id: 'root',
        children: [],
        selected: true,
    };
    data.forEach(function (d) {
        var family = d.family,
            genus = d.genus,
            species = d.species;
            id = family + genus + species;
            
        var family_node = taxatree.children.find(child => child.id == family);
        if (!family_node) {
            family_node = {
                type: 'family',
                uniq: family,
                id: family,
                parent: taxatree,
                children: [],
                selected: true,
            };
            taxatree.children.push(family_node);
        }

        var genus_node = family_node.children.find(child => child.id == genus);
        if (!genus_node) {
            genus_node = {
                type: 'genus',
                uniq: family + ' ' + genus,
                id: genus,
                parent: family_node,
                children: [],
                selected: true,
            };
            family_node.children.push(genus_node);
        }

        var species_node = genus_node.children.find(child => child.id == species);
        if (!species_node) {
            species_node = {
                type: 'species',
                uniq: family + ' ' + genus + ' ' + species,
                id: species,
                parent: genus_node,
                selected: true,
            };    
            genus_node.children.push(species_node);
        }
    });

    draw_taxatree();
});
