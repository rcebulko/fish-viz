(function (Controls) {
    var NotImplementedError = () => { throw Error('Not implemented'); };


    function Control(name, initComponent) {
        this.name = name;
        this.listeners = {};
        this.initComponent = initComponent;

        this.value = null;
        this.state = null;
    }

    Control.prototype.init = function (initVal) {
        console.info('Initializing %s control', this.name);

        return Promise.all([])
            .then(() => this.initComponent())
            .then(() => this.setValue(initVal));
    }


    // display and logging
    Control.prototype.toString = function () {
        return this.name.charAt(0).toUpperCase() + this.name.slice(1);
    }
    Control.prototype.valueToString = val => val.toString();
    Control.prototype.valueString = function () {
        return this.valueToString(this.getValue());
    };
    Control.prototype.log = function() {
        console.info('Set %s to %s', this, this.valueString());
    };


    // read/write the value from/to state/DOM/other
    Control.prototype.readValue = NotImplementedError;
    Control.prototype.writeValue = NotImplementedError;


    // accessors, mutators, and change listeners for values
    Control.prototype.getValue = function () {
        if (this.value === null) this.value = this.readValue();
        return this.value;
    };

    Control.prototype.setValue = function (newVal) {
        this._set(newVal);
        this.state = null;
        this.trigger('changed.value', newVal);
    }

    Control.prototype._set = function (newVal) {
        this.value = newVal;
        this.writeValue(newVal);
        this.log();
    };

    Control.prototype.onValueChanged = function (cb) {
        this.listen('changed.value', cb);
    };


    // serialization
    Control.prototype.serialize = val => val;
    Control.prototype.deserialize = val => val;


    // accessors, mutators, and change listeners for state
    Control.prototype.getState = function () {
        if (this.state === null) this.state = this.serialize(this.getValue());
        return this.state;
    }

    Control.prototype.setState = function (newState) {
        this._set(this.deserialize(newState));
        this.state = newState;
        this.trigger('changed.state', newState);
    }

    Control.prototype.onStateChanged = function(cb) {
        this.listen('changed.state', cb);
    };


    // events and handlers
    Control.prototype.listen = function (event, cb) {
        if (typeof this.listeners[event] === 'undefined') {
            this.listeners[event] = [];
        }

        this.listeners[event].push(cb);
    }

    Control.prototype.trigger = function (event, data) {
        (this.listeners[event] || []).forEach(cb => cb(data));
    }

    Control.prototype.onChanged = function (cb) {
        this.onValueChanged(cb);
        this.onStateChanged(cb);
    }


    Controls.Control = Control;
}(window.Controls = window.Controls || {}));
