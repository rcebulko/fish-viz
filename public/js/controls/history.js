(function (History) {
    var components = {},

        appState = Cookies.getJSON('appState') || {},
        state = appState.state || {},

        history = appState.history || [],
        future = appState.future || [],

        listeners = [],

        maxHistory = 20,
        maxFuture = 20;

    function init(controls) {
        controls.forEach(register);
        $('.control-panel-undo').click(undo);
        $('.control-panel-redo').click(redo);
    }

    function undo() { shiftState(history, future); }
    function redo() { shiftState(future, history); }

    function saveState() {
        Cookies.set('appState', { state, history, future });
    }

    function prune() {
        history = history.slice(-maxHistory);
        future = future.slice(0, maxFuture);
    }

    function shiftState(popQ, pushQ) {
        var shifted = popQ.pop();

        if (shifted) {
            components[shifted[0]].setState(shifted[1]);
            pushState(pushQ, shifted[0]);

            executeListeners(shifted[0]);
        }

        return shifted;
    }

    function pushState(Q, name) {
        Q.push([name, state[name]]);
        state[name] = components[name].getState();

        prune();
        saveState();
    }


    function register(component) {
        components[component.name] = component;

        component.onValueChanged(newVal => {
            future = [];
            pushState(history, component.name);
        });

        if (state[component.name]) {
            console.debug('Initializing %s with stored value', component.name);
            component.setState(state[component.name]);
        } else {
            state[component.name] = component.getState();
        }
    }


    function onStateChanged(callback) { listeners.push(callback); }

    function executeListeners(component) {
        listeners.forEach(cb => cb(component));
    }


    Object.assign(History, {
        init,
        register,

        undo,
        redo,

        onStateChanged,
        getStates: () => history.concat([state]).concat(future)
    });
}(window.Controls.History = {}))
