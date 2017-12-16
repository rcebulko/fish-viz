(function (History, Config) {
    var RUN_PLAYBACK = Config.playbackMode,

        components = {},

        appState = loadState() || {},
        state = appState.state || {},

        history = appState.history || [],
        future = appState.future || [],

        listeners = [],

        maxHistory = Config.maxHistory,
        maxFuture = Config.maxFuture;

    function init(controls) {
        controls.forEach(register);

        $('.control-panel-undo').click(undo);
        $('.control-panel-redo').click(redo);
    }

    function undo() { return shiftState(history, future); }
    function redo() { return shiftState(future, history); }

    function loadState() {
        var pb;

        if (RUN_PLAYBACK) {
            pb = JSON.parse('{"initState":{"Region":"DRY TORT","DateRange":[1234008000000,1492257600000],"SelectTaxonomy":{"selected":["species__ABU SAXA","species__ACA ASPE","species__ACA BAHI","species__ACA CHIR","species__CAR RUBE","species__ELA BIPI"],"enabled":["species__ABU SAXA","species__ACA ASPE","species__ACA BAHI","species__ACA CHIR","species__CAR RUBE","species__ELA BIPI"]},"MapState":{"center":{"lat":24.63307440983275,"lng":-82.88326998901368},"zoom":12},"LassoSelect":["48322533","107425089","151773498","29483452","35068001","113258628","202437650","215792596","92024857","125461513","67060205","252199817","215157716","115457542","75380113","77070358","10573108","186826016","161153268","267438086",1086374,"153783418","135694643","167595517","250250949",1031189,"64842860","266759630","61176623","83177365","18055802","96235417","142515696","84106970","68579922","210449430","266846349","91404569","222303838","89603294","44183521","241222913","31103099","112927552","50326820",821855,"217177173","161933311","104593216","184033632","218572761","232462747","149049087","54873640","251131334","237533056","255950219","118589198"],"Controls":false},"playback":[["MapState",{"center":{"lat":25.484241291308575,"lng":-80.53887238769532},"zoom":9}],["DateRange",[1273536000000,1486987200000]],["DateRange",[1197115200000,1486987200000]],["DateRange",[1197115200000,1376308800000]],["DateRange",[1239278400000,1418472000000]],["DateRange",[1313064000000,1492257600000]],["MapState",{"center":{"lat":25.345317632235577,"lng":-80.20962586669923},"zoom":12}],["MapState",{"center":{"lat":24.936930617655094,"lng":-80.68650117187501},"zoom":10}],["MapState",{"center":{"lat":25.09373364013835,"lng":-81.04905000000002},"zoom":8}],["Controls",false],["Region","FLA KEYS"],["Controls",true],["Controls",false],["Controls",false],["Controls",false],["Controls",false],["Controls",false],["Controls",false],["MapState",{"center":{"lat":24.63307440983275,"lng":-82.88326998901368},"zoom":10}],["SelectTaxonomy",{"selected":["species__ABU SAXA","species__ACA ASPE","species__ACA BAHI","species__ACA CHIR","species__CAR RUBE","species__ELA BIPI"],"enabled":["species__ABU SAXA","species__ACA ASPE","species__ACA BAHI","species__ACA CHIR"]}]]}');

            return {
                state: pb.initState,
                history: [],
                future: pb.playback,
            };
        } else {
            return {
                state: JSON.parse(localStorage.state || false),
                history: JSON.parse(sessionStorage.history || false),
                future: JSON.parse(sessionStorage.future || false),
            };
        }
    }

    function saveState() {
        localStorage.state = JSON.stringify(state);
        sessionStorage.history = JSON.stringify(history);
        sessionStorage.future = JSON.stringify(future);
    }

    function exportPlayback() {
        var currState = Object.assign({}, state),
            nextState,
            remaining = history.slice(),
            playback = future.slice(),

            logMe = () => console.log(
                Object.assign({}, currState),
                remaining.slice(),
                playback.slice());

        logMe();
        while (nextState = remaining.pop()) {
            playback.push([nextState[0], currState[nextState[0]]]);
            currState[nextState[0]] = nextState[1];
            logMe();
        }

        return { initState: currState, playback };
    }

    function runPlayback() {
        console.info('Running playback');

        var promChain = Promise.all([]),
            playbackLog = [],
            lastStep,
            lastTime = performance.now(),

            isReady = () => !Viz.Map.isLoading(),
            waitForReady = () => new Promise(resolve => {
                var itvl = setInterval(() => {
                    if (isReady()) {
                        clearInterval(itvl);
                        resolve();
                        console.debug('Ready')
                    }
                    console.debug('Waiting...')
                }, 1000);
            }),
            whenReady = fn => promChain = promChain.then(waitForReady).then(fn);


        return new Promise(resolve => {
            var takeSteps = () => {
                var now = performance.now();

                if (lastStep) {
                    playbackLog.push({
                        component: lastStep[0],
                        value: lastStep[1],
                        time: now - lastTime
                    });
                }

                lastTime = now;
                lastStep = redo();

                if (future.length) {
                    whenReady(takeSteps);
                } else {
                    resolve(playbackLog);
                }
            };

            whenReady(takeSteps);
        })
    }

    function prune() {
        if (RUN_PLAYBACK) return;

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

        if (!RUN_PLAYBACK) {
            component.onValueChanged(newVal => {
                future = [];
                pushState(history, component.name);
            });
        }

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
        exportPlayback,
        runPlayback,
        getStates: () => history.concat([state]).concat(future)
    });
}(window.Controls.History = {}, window.Config));
