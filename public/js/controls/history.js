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

    function undo() {
        console.debug('Popped history state:', shiftState(history, future));
        console.debug('New future:', future);

    }

    function redo() {
        console.debug('Popped future state:', shiftState(future, history));
        console.debug('New history:', history);

    }


    function initComponent(name) {
        var component = components[name];

        component.onChangeState(newVal => {
            console.debug('Pushing history state:', [name, state[name]]);

            future = [];
            pushState(history, name);
            // history.push([name, state[name]]);
            // state[name] = components[name].saveState();

            console.debug('New history state:', Object.assign({}, state));
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

        getHistory: () => history,
        getFuture: () => future,
        getStates: () => history.concat([state]).concat(future),
    });
}(window.Controls.History = window.Controls.History || {}))
