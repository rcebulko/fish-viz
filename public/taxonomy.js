// Provides interface into taxonomy hierarchy
// must be loaded after `api.js`
(function (exports) {
    var root;

    function init(cb) {
        API.fetchSpeciesData(data => {
            data.forEach(s => new Species(s));
            cb(root);
        });
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
        this._selected = true;
        this.instances[this.id()] = this;
        this.parent().addChild(this);
    };
    Species.prototype.toString = function () { return this._commonName; };
    Species.prototype.id = function () { return this._code; };
    Species.prototype.parent = function () { return this.genus(); };
    Species.prototype.isSelected = function () { return this._selected; };
    Species.prototype.select = function (state) {
        if (typeof state === 'undefined') { state = true; }
        this._selected = state;
    };
    Species.prototype.deselect = function () {
        this.select(false);
    };
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
    // `init` can inherit from the Species method
    Genus.prototype.toString = function () { return this.id(); };
    Genus.prototype.id = function () { return this._genusName; };
    Genus.prototype.parent = function () { return this.family(); };
    Genus.prototype.select = function (state) {
        if (typeof state === undefined) { state = true; }
        this._selected = state;
        this.children().forEach(c => c.select(state));
    };
    // `isSelected` can inherit from the Species method
    // `deselect` can inherit from the Species method
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
    // `init` can inherit from the Species method
    // `toString` can inherit from the Genus method
    Family.prototype.id = function () { return this._familyName; };
    Family.prototype.parent = () => root;
    // `isSelected` can inherit from the Genus method
    // `select` can inherit from the Genus method
    // `deselect` can inherit from the Species method
    // `child` can inherit from the Genus method
    // `children` can inherit from the Genus method
    // `addChild` can inherit from the Genus method


    ////////////////
    // Root class //
    ////////////////

    function Root() {
        this._children = {};
    }

    // Prototype inheritance
    Root.prototype = new Family();

    // Instance methods
    // `toString` can inherit from the Genus method
    Root.prototype.id = () => 'Root';
    Root.prototype.parent = () => null;
    // `child` can inherit from the Genus method
    // `children` can inherit from the Genus method
    // `addChild` can inherit from the Genus method


    root = new Root();

    exports.Taxonomy = {
        species: Species.prototype.instances,
        genuses: Genus.prototype.instances,
        families: Family.prototype.instances,
        root,
        init
    }
}(window));

// "code": "ABU SAXA",
// "species": "saxatilis",
// "genus": "Abudefduf",
// "family": "Pomacentridae",
// "scientificName": "Abudefduf saxatilis",
// "commonName": "Sergeant Major",
