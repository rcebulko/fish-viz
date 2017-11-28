var dispatch = d3.dispatch(
    'taxa_loaded',
    'taxa_mouseover',
    'taxa_mousemove',
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

    'filter_plot_changed',
    'filter_hmap_changed',
    'kernel_changed',
);
