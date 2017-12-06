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
        future = [],

        listeners = [];

    function init() {
        components = {
            dateRange: Controls.DateRange,
            region: Controls.Region,
            taxonomy: Controls.SelectTaxonomy,
        }

        Object.keys(components).forEach(initComponent);
    }


    function shiftState(popQ, pushQ) {
        var shifted = popQ.pop();

        if (shifted) {
            components[shifted[0]].loadState(shifted[1]);
            pushState(pushQ, shifted[0]);

            executeListeners(shifted[0]);
        }

        return shifted;
    }

    function pushState(Q, name) {
        Q.push([name, state[name]]);
        state[name] = components[name].saveState();
    }

    function undo() { shiftState(history, future); }
    function redo() { shiftState(future, history); }

    function initComponent(name) {
        var component = components[name];

        component.onChangeState(newVal => {
            future = [];
            pushState(history, name);
        });

        state[name] = components[name].saveState();
    }


    function onChangeState(callback) {
        listeners.push(callback);
    }

    function executeListeners(component) {
        listeners.forEach(cb => cb(component));
    }


    Object.assign(exports, {
        init,

        undo,
        redo,

        onChangeState,
    });
}(window.Controls.History = window.Controls.History || {}))
