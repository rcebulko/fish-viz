var dispatch = d3.dispatch(
    'taxa_loaded',
    'taxa_mouseover',
    'taxa_mouseout',
    'taxa_click',
    'samples_loaded',
);

// TODO really I should not be reading the whole data right now..  but should
// be reading the data according to the filter..

// moved into geo.js
// d3.csv('subsamples.csv', function(error, data) {
//   if (error) throw error;
//   dispatch.call('samples_loaded', null, data);
// });
