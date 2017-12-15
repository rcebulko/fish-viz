(function (Controls, Config) {
    function init() {
        console.info('Initializing controls');

        initControlsState();

        return Promise.all([
            Controls.SplitPane.init([100, 250]),
            Controls.MouseAction.init(),
            Controls.LassoSelect.init([]),
            Controls.Region.init(Config.initRegion),
            Controls.DateRange.init(Config.initDateRange
                .map(d => new Date('' + d).getTime())),
            Controls.SelectTaxonomy.init({ selected: [], enabled: [] }),
        ]).then(() => Controls.History.init(Controls.registered));
    }

    function initControlsState() {
        function ControlsState () {
            this.name = 'Controls';
            this.listeners = [];
            this.visible = true;

            this.$toggle = $('.control-panel-toggle').click(() => this.toggle());
        }

        ControlsState.prototype.toggle = function () {
            this.setState(!this.getState());
            this.triggerChanged();
        }
        ControlsState.prototype.getState = function () { return this.visible; };
        ControlsState.prototype.setState = function (state) {
            if (this.visible === state) return;
            this.visible = state;
            this.$toggle
                .parents('.control-panel')
                .toggleClass('hidden', !this.visible)
        };

        ControlsState.prototype.triggerChanged = function () {
            this.listeners.forEach(cb => cb(this.visible));
        };
        ControlsState.prototype.onValueChanged = function (cb) {
            this.listeners.push(cb);
        };

        Controls.History.register(new ControlsState());
    }

    function onChanged(callback) {
        ['Region', 'DateRange', 'SelectTaxonomy']
            .forEach(Ctl => Controls[Ctl].onChanged(() => callback()));
    }

    function get(property) {
        return {
            dateRange: Controls.DateRange,
            region: Controls.Region,
            species: Controls.SelectTaxonomy,
            lasso: Controls.LassoSelect,
        }[property].getValue();
    }


    Object.assign(Controls, { init, get, onChanged })
}(window.Controls = {},
    window.Config));
