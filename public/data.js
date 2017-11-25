// must be loaded after `d3-dispatch`
// must be loaded after `api.js`
var dispatch = d3.dispatch(
  'taxa_loaded',
  'taxa_mouseover',
  'taxa_mouseout',
  'taxa_click',
  'samples_loaded',
);

// API.fetchSpeciesData(data => {
//   dispatch.call('taxa_loaded', null, data);
// });

// TODO really I should not be reading the whole data right now..  but should
// be reading the data according to the filter..

// moved into geo.js
API.fetchSampleData({ limit: 100 }, data => {
  dispatch.call('samples_loaded', null, data);
});
