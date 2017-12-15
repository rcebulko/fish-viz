(function (exports) {
    var MONTH_MS = 1000 * 60 * 60 * 24 * 30,

        fmtDates = dateRange => {
            if (dateRange[1] - dateRange[0] < MONTH_MS) {
                return Controls.DateRange.format(dateRange[0]);
            } else {
                return dateRange.map(Controls.DateRange.format).join(' to ');
            }
        };


    function Sample(sampleData, species) {
        if (sampleData) {
            Object.assign(this, sampleData, {
                isAggregated: false,
                date: new Date(sampleData.date),
            });

            if (typeof species === 'undefined') {
                this.species = Taxonomy.species[this.species_code];
            } else {
                this.species = species;
            }

            delete this.species_code;
        }
    }

    Sample.prototype.aggregated = function () {
        return new AggregatedSample(this);
    };
    Sample.prototype.merge = function (other) {
        return new MergedSample(this, other);
    };

    Sample.prototype.radius = function () { return this.length; };

    Sample.prototype.titleHtml = function() {
        return '<b>Sample</b>';
    };
    Sample.prototype.infoLines = function () {
        return [
            ['Date', Controls.DateRange.format(this.date)],
            ['Latitude', this.latitude.toFixed(5)],
            ['Longitude', this.longitude.toFixed(5)],
            ['Depth', this.depth.toFixed(0)],
            ['Length', this.length.toFixed(2)],
            ['Number', this.number.toFixed(1)],
        ];
    };
    Sample.prototype.infoHtml = function () {
        return this.infoLines()
            .map(lbl_val => '<b>' + lbl_val.join('</b>: '))
            .join('<br>');
    };
    Sample.prototype.html = function () {
        return [
            this.titleHtml(),
            this.infoHtml(),
            this.species.html()
        ].join('<br><br>');
    };


    function AggregatedSample(sample) {
        if (sample) {
            Object.assign(this, sample, {
                isAggregated: true,
                ids: [sample.id],
                sampleCount: 1,
                date: [sample.date, sample.date],
                length: [sample.length, sample.length],
                avgLength: sample.length,
                number: [sample.number, sample.number],
                totalNumber: sample.number
            });
        }
    }
    AggregatedSample.prototype = new Sample();
    AggregatedSample.prototype.aggregated = function () { return this; }
    AggregatedSample.prototype.radius = function () { return this.avgLength; };

    AggregatedSample.prototype.titleHtml = function() {
        return '<b>Samples</b>: ' + this.sampleCount;
    };
    AggregatedSample.prototype.infoLines = function () {
        return [
            ['Date', fmtDates(this.date)],
            ['Latitude', '~' + this.latitude.toFixed(5)],
            ['Longitude', '~' + this.longitude.toFixed(5)],
            ['Depth', this.depth.map(d => d.toFixed(0)).join(' - ')],
            ['Length', this.length.map(len => len.toFixed(2)).join(' - ')],
            ['Avg. Length', this.avgLength.toFixed(2)],
            ['Number', this.number.map(n => n.toFixed(1)).join(' - ')],
            ['Total Number', this.totalNumber.toFixed(0)],
        ];
    };

    function MergedSample(left, right) {
        var left = left.aggregated(),
            right = right.aggregated(),

            total = key => left[key] + right[key],
            avg = (key, weightKey) => (
                left[key] * left[weightKey] +
                right[key] * right[weightKey]) / total(weightKey),
            range = key => [
                Math.min(left[key][0], right[key][0]),
                Math.max(left[key][1], right[key][1])
            ];

            this.left = left;
            this.right = right;

            this.id = left.id;
            this.species = left.species;
            this.ids = left.ids.concat(right.ids);
            this.sampleCount = total('sampleCount');
            this.date = range('date');
            this.depth = range('depth');
            this.latitude = avg('latitude', 'sampleCount');
            this.longitude = avg('longitude', 'sampleCount');
            this.length = range('length');
            this.avgLength = avg('avgLength', 'totalNumber');
            this.number = range('number');
            this.totalNumber = total('totalNumber');
    }
    MergedSample.prototype = new AggregatedSample();


    window.Sample = Sample;
}(window));