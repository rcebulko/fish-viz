// Dependencies:
// - Color Scheme
// - api

(function (exports) {
    var root,
        initPromise = null,
        scheme = new ColorScheme,
        enabled = [],
        enabledLimit = 5;


    function init() {
        if (initPromise === null) {
            console.info('Initializing taxonomy');

            initPromise = API.fetchSpecies().then(data => {
                data.forEach(s => new Species(s));
                root.colorize();

                return root;
            });
        }

        return initPromise;
    }

    function pickColors(seed, variation) {
        var colors = seed.distance(0.4)
            .scheme('analogic')
            .variation(variation)
            .colors();

        // remove the light colors (2, 6, and 10) and any pure grays
        return colors
            .slice(0, 2)
            .concat(colors.slice(3, 6))
            .concat(colors.slice(7, 10))
            .filter(c => !(
                c.slice(0, 2) === c.slice(2, 4) &&
                c.slice(2, 4) === c.slice(4, 6)) );
    }

    function cullEnabled() {
        enabled.slice(0, -5).forEach(s => s.disable());
    }

    function fromKey(key) {
        var type_id = key.split('__');
        return Taxonomy[type_id[0]][type_id[1]];
    }


    ///////////////////
    // Species class //
    ///////////////////

    function Species(properties) {
        if (properties) {
            this._code           = properties.code;
            this._speciesName    = properties.species;
            this._genusName      = properties.genus;
            this._familyName     = properties.family;
            this._scientificName = properties.scientificName;
            this._commonName     = properties.commonName;
            this._type           = 'species';

            this.init();
        }
    }

    // Class map of IDs to Species
    Species.prototype.instances = {};

    // Instance methods
    Species.prototype.init = function () {
        this.instances[this.id()] = this;
        this.parent().addChild(this);
        this._selected = this._enabled = this._focused = false;
    };
    Species.prototype.name = function () { return this._commonName; }
    Species.prototype.extraInfo = function () { return this._scientificName; }
    Species.prototype.toString = function () {
        return this.name() + ' (' + this.extraInfo() + ')';
    };
    Species.prototype.id = function () { return this._code; };
    Species.prototype.key = function () { return this._type + '__' + this.id(); }
    Species.prototype.parent = function () { return this.genus(); };
    Species.prototype.isSelected = function () { return this._selected; };
    Species.prototype.select = function (state, noUpdateParent) {
        if (typeof state === 'undefined') { state = true; }
        this._selected = state;

        if (!noUpdateParent) { this.parent().updateSelected(); }
        this.enable(state, noUpdateParent);
    };
    Species.prototype.deselect = function () { this.select(false); };
    Species.prototype.isEnabled = function () { return this._enabled; };
    Species.prototype.enable = function (state, noUpdateParent) {
        if (typeof state === 'undefined') { state = true; }
        this._enabled = state && this.isSelected();

        if (!noUpdateParent) { this.parent().updateEnabled(); }

        if (!this._enabled) {
            enabled = enabled.filter(s => s !== this);
        } else if (enabled.indexOf(this) === -1) {
            enabled.push(this);
        }
    };
    Species.prototype.disable = function () { this.enable(false); };
    Species.prototype.toggle = function () { this.enable(!this.isEnabled()); };
    Species.prototype.isFocused = function () { return this._focus; }
    Species.prototype.focus = function (state) {
        if (typeof state === 'undefined') { state = true; }
        this._focus = state && this.isEnabled();
    };
    Species.prototype.unfocus = function () { this.focus(false); };
    Species.prototype.children = () => null;
    Species.prototype.family = function () { return this.genus().family(); };
    Species.prototype.genus = function () {
        if (typeof this._genus === 'undefined') {
            if (typeof Genus.prototype.instances[this._genusName] !== 'undefined') {
                this._genus = Genus.prototype.instances[this._genusName];
            } else {
                this._genus = new Genus(this._genusName, this._familyName);
            }
        }

        return this._genus;
    };
    Species.prototype.infoLines = function () {
        return [
            ['Species', this._scientificName],
            ['Common name', this._commonName],
            ['Genus', this._genusName],
            ['Family', this._familyName],
        ];
    };
    Species.prototype.html = function () {
        return this.infoLines()
            .map(lbl_val => '<b>' + lbl_val.join('</b>: '))
            .join('<br>');
    };
    Species.prototype.colorize = function (color) {
        this.color = '#' + color;
    };
    Species.prototype.allSpecies = function () {
        return [this];
    };


    /////////////////
    // Genus class //
    /////////////////

    function Genus(genusName, familyName) {
        if (genusName) {
            this._genusName  = genusName;
            this._familyName = familyName;
            this._children   = {};
            this._type       = 'genuses';

            this.init();
        }
    }

    // Prototype inheritance
    Genus.prototype = new Species();

    // Class map of IDs to Genera
    Genus.prototype.instances = {};

    // Instance methods
    Genus.prototype.name = function () { return this._genusName; }
    Genus.prototype.extraInfo = function () {
        return this.children().length + ' species';
    }
    Genus.prototype.id = function () { return this.name(); };
    Genus.prototype.parent = function () { return this.family(); };
    Genus.prototype.select = function (state, noUpdateParent) {
        if (typeof state === 'undefined') { state = true; }
        this._selected = state;
        this.children().forEach(c => c.select(state, true));

        if (this.parent() && !noUpdateParent) {
            this.parent().updateSelected();
        }

        this.enable(state, noUpdateParent);
    };
    Genus.prototype.enable = function (state, noUpdateParent) {
        if (typeof state === 'undefined') { state = true; }
        this._enabled = state && this.isSelected();
        this.children().forEach(c => c.enable(state, true));

        if (this.parent() && !noUpdateParent) {
            this.parent().updateEnabled();
        }
    };
    Genus.prototype.focus = function (state, noUpdateParent) {
        if (typeof state === 'undefined') { state = true; }
        this._focus = state && this.isEnabled();
        this.children().forEach(c => c.focus(state));
    };
    Genus.prototype.updateSelected = function () {
        this._selected = this.children().some(c => c.isSelected());

        if (this.parent()) {
            this.parent().updateSelected();
        }
    };
    Genus.prototype.updateEnabled = function () {
        this._enabled = this.children()
            .some(c => c.isSelected() && c.isEnabled());

        if (this.parent()) {
            this.parent().updateEnabled();
        }
    };
    Genus.prototype.children = function () {
        return Object.values(this._children);
    };
    Genus.prototype.child = function (name) { return this._children[name]; };
    Genus.prototype.family = function () {
        if (typeof this._family === 'undefined') {
            if (typeof Family.prototype.instances[this._familyName] !== 'undefined') {
                this._family = Family.prototype.instances[this._familyName];
            } else {
                this._family  = new Family(this._familyName);
            }
        }

        return this._family
    };
    Genus.prototype.addChild = function (child) {
        this._children[child.id()] = child;
    };
    Genus.prototype.infoLines = function () {
        return [
            ['Genus', this._genusName],
            ['Family', this._familyName],
            ['Species', this.children().length],
        ];
    };
    Genus.prototype.colorize = function (color) {
        var colors = pickColors(scheme.from_hex(color), 'default'),
            children = this.children(),
            i;

        this.color = '#' + color;

        for (i = 0; i < children.length; ++i) {
            children[i].colorize(colors[(i + 1) % colors.length])
        }
    };
    Genus.prototype.allSpecies = function () {
        return this.children()
            .map(c => c.allSpecies())
            .reduce((acc, arr) => acc.concat(arr))
    };


    //////////////////
    // Family class //
    //////////////////

    function Family(familyName) {
        if (familyName) {
            this._familyName = familyName;
            this._children   = {};
            this._type       = 'families';

            this.init();
        }
    }

    // Prototype inheritance
    Family.prototype = new Genus();

    // Class map of IDs to Families
    Family.prototype.instances = {};

    // Instance methods
    Family.prototype.name = function () { return this._familyName; }
    Family.prototype.extraInfo = function () {
        return this.children().length + ' genuses';
    }
    Family.prototype.parent = () => root;
    Family.prototype.infoLines = function () {
        return [
            ['Family', this._familyName],
            ['Genuses', this.children().length],
        ];
    }
    Family.prototype.colorize = function (hue) {
        var colors = pickColors(scheme.from_hue(hue), 'default'),
            children = this.children(),
            i;

        this.color = '#' + colors[0];

        for (i = 0; i < children.length; ++i) {
            children[i].colorize(colors[(i + 1) % colors.length])
        }
    }


    ////////////////
    // Root class //
    ////////////////

    function Root() {
        this._children = {};
        this._type = 'root'
    }

    // Prototype inheritance
    Root.prototype = new Family();

    // Instance methods
    Root.prototype.isSelected = () => true;
    Root.prototype.toString = function () {
        return this.id() + ' (' + this.children().length + ' families)';
    }
    Root.prototype.id = () => 'root';
    Root.prototype.parent = () => null;
    Root.prototype.html = () => '<b>Root</b>'
    Root.prototype.colorize = function () {
        var children = this.children(),
            stagger = children.length % 3 === 0 ? 4 : 3,
            i;

        this.color = '#cccccc';

        for (i = 0; i < children.length; ++i) {
            children[(i * stagger) % children.length].colorize((i * 3) % 255);
        }
    }


    root = new Root();

    Object.assign(exports, {
        init,

        root,
        species: Species.prototype.instances,
        genuses: Genus.prototype.instances,
        families: Family.prototype.instances,
        fromKey,

        cullEnabled,
    });
}(window.Taxonomy = window.Taxonomy || {}));
