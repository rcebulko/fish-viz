var dispatch = d3.dispatch(
    'taxa_loaded',
    'taxa_mouseover',
    'taxa_mouseout',
    'taxa_click',

    'samples_loaded',

    'filter_loaded',
    'filter_plot',
    'plot_mouseover',
    'plot_mouseout',

    'rectangle_mouseover',
    'rectangle_mouseout',

    'selection_focus',
    'selection_unfocus',

    'filter_changed',
    'filter_data',
    'filter_datum_focus',
    'filter_datum_unfocus',

    'geo_datum_focus',
    'geo_datum_unfocus',
);

// TODO really I should not be reading the whole data right now..  but should
// be reading the data according to the filter..

// moved into geo.js
// d3.csv('subsamples.csv', function(error, data) {
//   if (error) throw error;
//   dispatch.call('samples_loaded', null, data);
// });
