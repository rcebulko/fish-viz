// Dependencies:
// - api

(function (exports) {
    var root,
        initPromise = null;


    function init() {
        if (initPromise === null) {
            initPromise = API.fetchSpecies().then(data => {
                data.forEach(s => new Species(s));
                return root;
            });
        }

        return initPromise;
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

            this.init();
        }
    }

    // Class map of IDs to Species
    Species.prototype.instances = {};

    // Instance methods
    Species.prototype.init = function () {
        this.instances[this.id()] = this;
        this.parent().addChild(this);
        this._selected = this._enabled = false;
    };
    Species.prototype.toString = function () {
        return this._scientificName + ' (' + this._commonName + ')';
    };
    Species.prototype.id = function () { return this._code; };
    Species.prototype.parent = function () { return this.genus(); };
    Species.prototype.isSelected = function () { return this._selected; };
    Species.prototype.select = function (state, noUpdateParent) {
        if (typeof state === 'undefined') { state = true; }
        this._selected = state;
        this.enable(state, noUpdateParent);

        if (!noUpdateParent) { this.parent().updateSelected(); }
    };
    Species.prototype.deselect = function () { this.select(false); };
    Species.prototype.isEnabled = function () { return this._enabled; };
    Species.prototype.enable = function (state, noUpdateParent) {
        if (typeof state === 'undefined') { state = true; }
        this._enabled = state;

        if (!noUpdateParent) { this.parent().updateEnabled(); }
    };
    Species.prototype.disable = function () { this.enable(false); };
    Species.prototype.toggle = function () { this.enable(!this.isEnabled()); };
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


    /////////////////
    // Genus class //
    /////////////////

    function Genus(genusName, familyName) {
        if (genusName) {
            this._genusName = genusName;
            this._familyName = familyName;
            this._children = {};

            this.init();
        }
    }

    // Prototype inheritance
    Genus.prototype = new Species();

    // Class map of IDs to Genera
    Genus.prototype.instances = {};

    // Instance methods
    Genus.prototype.toString = function () {
        return this.id() + ' (' + this.children().length + ' species)';
    };
    Genus.prototype.id = function () { return this._genusName; };
    Genus.prototype.parent = function () { return this.family(); };
    Genus.prototype.select = function (state, noUpdateParent) {
        if (typeof state === 'undefined') { state = true; }
        this._selected = state;
        this.children().forEach(c => c.select(state, true));

        if (this.parent() && !noUpdateParent) {
            this.parent().updateSelected();
        }
    };
    Genus.prototype.enable = function (state, noUpdateParent) {
        if (typeof state === 'undefined') { state = true; }
        this._enabled = state;
        this.children().forEach(c => c.enable(state, true));

        if (this.parent() && !noUpdateParent) {
            this.parent().updateEnabled();
        }
    };
    Genus.prototype.updateSelected = function () {
        this._selected = this.children().some(c => c.isSelected());

        if (this.parent()) {
            this.parent().updateSelected();
        }
    }
    Genus.prototype.updateEnabled = function () {
        this._enabled = this.children().some(c => c.isEnabled());

        if (this.parent()) {
            this.parent().updateEnabled();
        }
    }
    Genus.prototype.children = function () {
        return Object.values(this._children);
    }
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
    }


    //////////////////
    // Family class //
    //////////////////

    function Family(familyName) {
        if (familyName) {
            this._familyName = familyName;
            this._children = {};

            this.init();
        }
    }

    // Prototype inheritance
    Family.prototype = new Genus();

    // Class map of IDs to Families
    Family.prototype.instances = {};

    // Instance methods
    Family.prototype.toString = function () {
        return this.id() + ' (' + this.children().length + ' genuses)';
    }
    Family.prototype.id = function () { return this._familyName; };
    Family.prototype.parent = () => root;


    ////////////////
    // Root class //
    ////////////////

    function Root() {
        this._children = {};
    }

    // Prototype inheritance
    Root.prototype = new Family();

    // Instance methods
    Root.prototype.isSelected = () => true;
    Root.prototype.isEnabled = () => true;
    Root.prototype.toString = function () {
        return this.id() + ' (' + this.children().length + ' families)';
    }
    Root.prototype.id = () => 'Root';
    Root.prototype.parent = () => null;


    root = new Root();

    Object.assign(exports, {
        species: Species.prototype.instances,
        genuses: Genus.prototype.instances,
        families: Family.prototype.instances,
        root,
        init
    });
}(window.Taxonomy = window.Taxonomy || {}));
