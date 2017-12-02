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

        formatter = { to: formatTimestamp, from: timestamp }
        range = [timestamp('2013'), timestamp('2016')];


    function init() {
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
        slider.on('set', changed);
        changed(range)
    }

    function changed(values) {
        range = [new Date(+values[0]), new Date(+values[1])];

        console.info('Set date range to [%s, %s]',
            formatTimestamp(range[0]),
            formatTimestamp(range[1]));
    }

    function onChange(callback) {
        slider.on('set', () => callback(range));
    }

    function get() { return range; }


    Object.assign(exports, { init, onChange, get });
}(window.Controls.DateRange = {}));
