// Dependencies:
// - noUiSlider

window.Controls = window.Controls || {};
(function (exports) {
    var slider = null,

        timestamp = str => new Date(str).getTime(),
        formatTimestamp = ts => new Date(ts).toLocaleDateString('en-US', {
            month: 'short', year: 'numeric'
        }),

        year = timestamp('2001') - timestamp('2000'),

        formatter = { to: formatTimestamp, from: timestamp },
        range = [timestamp('2013'), timestamp('2016')],

        isChanged;


    function init() {
        console.info('Initializing date range slider control');

        slider = noUiSlider.create(document.querySelector('.date-range'), {
            range: { min: timestamp('1999'), max: timestamp('2018') },
            step: year / 12, // step by month (roughly)
            start: range,
            connect: [false, true, false],
            limit: 10 * year, // limit to 10 year range
            behaviour: 'drag',
            orientation: 'vertical',
            tooltips: [formatter, formatter],
        });

        slider.on('change', () => {
            // when both handles are dragged, the slider double-fires events
            isChanged = slider.get()
                .map(valStr => +valStr)
                .some((val, i) => val !== range[i]);
        });
        onChange(changed);
        set(range);
    }

    function changed() {
        if (isChanged) {
            range = slider.get().map(ts => +ts);

            console.info('Set date range to [%s, %s]',
                formatTimestamp(range[0]),
                formatTimestamp(range[1]));
        }
    }


    function get() { return range; }
    function set(newDateRange) {
        slider.set(newDateRange.map(d => new Date(d)));
    }
    function onChange(callback) {
        slider.on('set', () => {
            if (isChanged) callback(get());
        });
    }


    function onChangeState(callback) {
        slider.on('change', () => {
            if (isChanged) callback(get());
        });
    }


    Object.assign(exports, {
        init,

        get,
        set,
        onChange,

        saveState: get,
        loadState: set,
        onChangeState,

        formatTimestamp,
    });
}(window.Controls.DateRange = {}));
