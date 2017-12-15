(function (History, Config) {
    var components = {},

        appState = loadState() || {},
        state = appState.state || {},

        history = appState.history || [],
        future = appState.future || [],

        listeners = [],

        maxHistory = Config.maxHistory,
        maxFuture = Config.maxFuture;

    function init(controls) {
        controls.forEach(register);
        window.components = components;
        $('.control-panel-undo').click(undo);
        $('.control-panel-redo').click(redo);
    }

    function undo() { shiftState(history, future); }
    function redo() { shiftState(future, history); }

    function loadState() {
        return {
            state: JSON.parse(localStorage.state || false),
            history: JSON.parse(sessionStorage.history || false),
            future: JSON.parse(sessionStorage.future || false),
        }
    }
    function saveState() {
        localStorage.state = JSON.stringify(state);
        sessionStorage.history = JSON.stringify(history);
        sessionStorage.future = JSON.stringify(future);
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

        if (typeof state[component.name] !== 'undefined') {
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
}(window.Controls.History = {}, window.Config))
