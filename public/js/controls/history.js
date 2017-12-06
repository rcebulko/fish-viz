// Dependencies:
// - controls
// - - jQuery
// - - JS Cookie
// - - controls/date-range
// - - - noUiSlider
// - - controls/region
// - - controls/select-taxonomy
// - - - Select2
// - - - Taxonomy

window.Controls = window.Controls || {};
(function (exports) {
    var components = {},
        state = {},
        history = [],
        undoHandlers = [];

    function init() {
        components = {
            dateRange: Controls.DateRange,
            region: Controls.Region,
            taxonomy: Controls.SelectTaxonomy,
            // taxonomyEnabled: Viz.TaxonomyTree,
        }

        Object.keys(components).forEach(initComponent);
    }

    function undo() {
        var prev = history.pop();
        if (prev) {
            console.debug('Popped history state:', Object.assign({}, state));

            components[prev[0]].loadState(prev[1]);
            executeUndoHandlers(prev[0]);
        }
    }


    function initComponent(name) {
        var component = components[name];

        component.onChangeState(newVal => {
            console.debug('Pushing history state:', state[name]);

            history.push([name, state[name]]);
            state[name] = components[name].saveState();

            console.debug('New history state:', Object.assign({}, state));
        });
        state[name] = components[name].saveState();
    }


    function onUndo(callback) {
        undoHandlers.push(callback);
    }

    function executeUndoHandlers(undoComponent) {
        undoHandlers.forEach(cb => cb(undoComponent));
    }


    Object.assign(exports, { init, undo, onUndo, history });
}(window.Controls.History = window.Controls.History || {}))
