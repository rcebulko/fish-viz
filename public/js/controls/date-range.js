// Dependencies:
// - noUiSlider
// - Controls.Control

(function (Controls) {
    var timestamp = str => new Date(str).getTime(),
        formatTimestamp = ts => new Date(ts)
            .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            .replace(' ', '-'),

        year = timestamp('2001') - timestamp('2000'),

        formatter = { to: formatTimestamp, from: timestamp },
        range = [timestamp('2013'), timestamp('2016')];


    // date range control initialization
    function DateRange() {}
    Controls.register(DateRange, function (initRange) {
        this.slider = noUiSlider.create(document.querySelector('.date-range'), {
            range: { min: timestamp('1999'), max: timestamp('2018') },
            step: year / 12, // step by month (roughly)
            start: initRange,
            connect: [false, true, false],
            limit: 10 * year, // limit to 10 year range
            behaviour: 'drag',
            orientation: 'vertical',
            tooltips: [formatter, formatter],
        });

        this.slider.on('set', () => {
            if (!this.isWriting && this.isChanged()) this.loadValue();
        });
    });


    // utility method to prevent double-events
    DateRange.prototype.isChanged = function () {
        return this.slider.get()
            .map(d => +d)
            .some((d, i) => d !== this.getValue()[i]);
    };


    // display and logging
    DateRange.prototype.valueToString = range => {
        return '[' + range.map(formatTimestamp).join(', ') + ']';
    };

    DateRange.prototype.format = formatTimestamp;


    // read/write the values from/to the range slider
    DateRange.prototype.readValue = function () {
        return this.slider.get().map(valStr => +valStr);
    };

    DateRange.prototype.writeValue = function (newDateRange) {
        this.isWriting = true;
        this.slider.set(newDateRange);
        this.isWriting = false;
    };


    Controls.DateRange = new DateRange();
}(window.Controls = window.Controls || {}));
