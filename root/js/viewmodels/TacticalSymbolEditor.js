/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define([
    //'text!libs/milsymbol/2525C warfighting.json',
    //'text!libs/milsymbol/2525C signals-intelligence.json',
    //'text!libs/milsymbol/2525C stability-operations.json',
    'text!libs/milsymbol/2525C emergency-managment.json',
    '../FireRestAPI',
    'knockout',
    'jquery',
    'jqueryui',
    'text'],
    function (
        //warfighting2525c,
        //signalsIntel2525c,
        //stabilityOps2525c,
        emergencyMgmt2525c,
        FireRestAPI,
        ko,
        $) {
        "use strict";
        /**
         * @constructor
         * @param {String} viewFragment HTML
         * @returns {TacticalSymbolEditor}
         */
        function TacticalSymbolEditor(viewFragment) {
            var self = this,
                //warfighting = JSON.parse(warfighting2525c),
                //signals = JSON.parse(signalsIntel2525c),
                //stability = JSON.parse(stabilityOps2525c),
                emergency = JSON.parse(emergencyMgmt2525c);

            // Load the view fragment into the DOM's body.
            // Wrap the view in a hidden div for use in a JQuery UI dialog.
            var $view = $('<div style="display: none"></div>')
                .append(viewFragment)
                .appendTo($('body'));
            this.view = $view.children().first().get(0);

            // The symbol object to be edited 
            this.symbol = ko.observable({});



            // Operational status name/value pairs for dropdown lists
            this.statusOptions = [
                //{value: "-", name: "-"},
                {value: "P", name: "P: Present"},
                //{value: "C", name: "C: Present/Fully Capable"},
                //{value: "F", name: "F: Present/Full To Capacity"},
                //{value: "D", name: "D: Present/Damaged"},
                //{value: "X", name: "X: Extinguished"},
                //{value: "A", name: "A: Anticipated/Planned"}
            ];
            this.selectedStatus = ko.observable();

            // Standard identity name/value pairs for dropdown lists
            this.affiliationOptions = [
                //{value: "U", name: "U: Unknown"},
                //{value: "F", name: "F: Friend"},
                //{value: "N", name: "N: Neutral"},
                {value: "H", name: "H: Hostile"},
                //{value: "P", name: "P: Pending"},
                //{value: "J", name: "J: Joker"},
                //{value: "K", name: "K: Faker"},
                //{value: "S", name: "S: Suspect"},
                //{value: "A", name: "A: Assumed Friend"},
                //{value: "G", name: "G: Exercise Pending"},
                //{value: "W", name: "W: Exercise Unknown"},
                //{value: "D", name: "D: Exercise Friend"},
                //{value: "L", name: "L: Exercise Neutral"},
                //{value: "M", name: "M: Exercise Assumed Friend"},
                //{value: "O", name: "O: None Specified"}
            ];
            this.selectedAffiliation = ko.observable();

            // Symbology scheme objects for dropdown lists 
            this.schemeOptions = ko.observableArray([
                //{value: "S", name: "S: " + warfighting.name, code: "WAR", symbols: warfighting},
                //{value: "I", name: "I: " + signals.name, code: "SIGINT", symbols: signals},
                //{value: "O", name: "O: " + stability.name, code: "STBOPS", symbols: stability},
                {value: "E", name: "E: " + emergency.name, code: "EMS", symbols: emergency}]);
            this.selectedScheme = ko.observable();

            this.dimensionOptions = ko.observableArray([]);
            this.selectedDimension = ko.observable();

            this.functionOptions = ko.observableArray([]);
            this.selectedFunction = ko.observable();

            this.modifierOptions1 = ko.observableArray([]);
            this.selectedModifier1 = ko.observable();

            this.modifierOptions2 = ko.observableArray([]);
            this.selectedModifier2 = ko.observable();

            this.id = ko.observable();
            this.start_time = ko.observable();
            this.end_time = ko.observable();
            this.latitutde = ko.observable();
            this.longitude = ko.observable();
            this.altitude = ko.observable();

            /**
             * Builds the dimension options when the selected symbology scheme changes.
             * @param {Object} scheme 
             */
            this.selectedScheme.subscribe(function (scheme) {
                self.dimensionOptions.removeAll();
                for (var obj in scheme.symbols) {
                    if (scheme.symbols[obj].name) {
                        self.dimensionOptions.push({
                            name: scheme.symbols[obj].name,
                            functions: scheme.symbols[obj]["main icon"],
                            modifiers1: scheme.symbols[obj]["modifier 1"],
                            modifiers2: scheme.symbols[obj]["modifier 2"]});
                    }
                }
            });

            /**
             * Builds the function and modifier options when the seleted dimension changes.
             * @param {Object} dimension 
             */
            this.selectedDimension.subscribe(function (dimension) {
                var functions, obj, item, lastItemIdx;
                self.functionOptions.removeAll();
                self.modifierOptions1.removeAll();
                self.modifierOptions2.removeAll();
                if (dimension) {
                    // Extract the functions for this dimension
                    functions = dimension.functions;
                    for (obj in functions) {
                        item = functions[obj];
                        lastItemIdx = item.name.length - 1;
                        self.functionOptions.push({
                            // Replace preceeding elements in the name hierarchy wih en dashes  
                            name: "\u2013 ".repeat(lastItemIdx) + item.name[lastItemIdx],
                            function: functions[obj]});
                    }
                    // Extract the modifiers for this dimension
                    for (obj in dimension.modifiers1) {
                        self.modifierOptions1.push({
                            value: obj,
                            name: dimension.modifiers1[obj].name
                        });
                    }
                    if (dimension.name === "Ground Equipment") {
                        self.modifierOptions1.push({value: "M", name: "Mobility"});
                        self.modifierOptions1.push({value: "N", name: "Towed Array"});
                    }
                    for (obj in dimension.modifiers2) {
                        self.modifierOptions2.push({
                            value: obj,
                            name: dimension.modifiers2[obj].name
                        });
                    }
                }
            });

            this.selectedModifier1.subscribe(function (modifier1) {
                if (modifier1) {
                    if (modifier1.value === "M") {
                        self.modifierOptions2.removeAll();
                        self.modifierOptions2.push({value: "O", name: "Wheeled/Limited XCountry"});
                        self.modifierOptions2.push({value: "P", name: "Wheeled Cross Country"});
                        self.modifierOptions2.push({value: "Q", name: "Tracked"});
                        self.modifierOptions2.push({value: "R", name: "Wheeled and Tracked"});
                        self.modifierOptions2.push({value: "S", name: "Towed"});
                        self.modifierOptions2.push({value: "T", name: "Rail"});
                        self.modifierOptions2.push({value: "U", name: "Over the Snow"});
                        self.modifierOptions2.push({value: "V", name: "Sled"});
                        self.modifierOptions2.push({value: "W", name: "Pack Animals"});
                        self.modifierOptions2.push({value: "X", name: "Barge"});
                        self.modifierOptions2.push({value: "Y", name: "Amphibious"});
                    }
                    if (modifier1.value === "N") {
                        self.modifierOptions2.removeAll();
                        self.modifierOptions2.push({value: "S", name: "Towed Array (Short)"});
                        self.modifierOptions2.push({value: "L", name: "Towed Array (Long)"});
                    }
                }
            });


            /**
             * Prepopulates the option lists when the symbol code changes.
             * Invoked by open().
             * @param {String} newSymbol symbol code 
             */
            this.symbol.subscribe(function (newSymbol) {
                var symbolCode = newSymbol.symbolCode(),
                    codingScheme = symbolCode.substring(0, 1),
                    stdIdenitiy = symbolCode.substring(1, 2),
                    battleDim = symbolCode.substring(2, 3),
                    statusValue = symbolCode.substring(3, 4),
                    functionId = symbolCode.substring(4, 10),
                    modifierValue1 = symbolCode.substring(10, 11),
                    modifierValue2 = symbolCode.substring(11, 12),
                    scheme, affiliation, status, icon, dimension, modifier1, modifier2;

                scheme = self.schemeOptions().find(function (element) {
                    return element.value === codingScheme;
                });
                self.selectedScheme(scheme);

                dimension = self.dimensionOptions().find(function (element) {
                    return element.functions.find(function (iconElement) {
                        return iconElement["battle dimension"] === battleDim
                            && iconElement["code"] === functionId;
                    });
                });
                self.selectedDimension(dimension);

                if (self.selectedDimension()) {
                    // The 'functions' obserable array contains the name/function pairs
                    // for the selected dimension
                    icon = self.functionOptions().find(function (element) {
                        return element.function.code === functionId;
                    });
                    self.selectedFunction(icon);
                }

                affiliation = self.affiliationOptions.find(function (element) {
                    return element.value === stdIdenitiy;
                });
                self.selectedAffiliation(affiliation);

                status = self.statusOptions.find(function (element) {
                    return element.value === statusValue;
                });
                self.selectedStatus(status);

                modifier1 = self.modifierOptions1().find(function (element) {
                    return element.value === modifierValue1;
                });
                self.selectedModifier1(modifier1);
                
                modifier2 = self.modifierOptions2().find(function (element) {
                    return element.value === modifierValue2;
                });
                self.selectedModifier2(modifier2);


            });

            /**
             * Updates symbol code in the current symbol object.
             * Invoked by the dialog Save button.
             */
            this.onSave = function () {
                var icon = self.selectedFunction() ? self.selectedFunction().function : null,
                    codingScheme = self.selectedScheme() ? self.selectedScheme().value : "S",
                    stdIdentity = self.selectedAffiliation() ? self.selectedAffiliation().value : "U",
                    operationalStatus = self.selectedStatus() ? self.selectedStatus().value : "-",
                    battleDim = icon ? icon["battle dimension"] : "Z",
                    functionId = icon ? icon["code"] : "------",
                    modifier1 = self.selectedModifier1() ? self.selectedModifier1().value : "-",
                    modifier2 = self.selectedModifier2() ? self.selectedModifier2().value : "-",
                    symbolCode;

                symbolCode =
                    codingScheme +
                    stdIdentity +
                    battleDim +
                    operationalStatus +
                    functionId +
                    modifier1 +
                    modifier2;

                console.log(symbolCode);
                self.symbol().symbolCode(symbolCode);
                
                if (self.symbol().userCreated && self.symbol().dbLat == null){
                    // If a user created symbol doesn't  have a dbLat it hasn't been pushed to the database yet. need to create the DB entry and update the db params of the symbol
                    var createFireQueryURL = "http://nasaspaceappschallenge2018.ddns.net:8081/api/fires/";
                    var CreateFireQuery = new FireRestAPI(createFireQueryURL);
                    var params = {lat: parseFloat(self.symbol().latitude()), lon: parseFloat(self.symbol().longitude()), alt: parseFloat(self.symbol().altitude())};
                    CreateFireQuery.createFire(self.symbol().manager, params);
                    self.symbol().dbLat = parseFloat(self.symbol().latitude());
                    self.symbol().dbLon = parseFloat(self.symbol().longitude());
                    self.symbol().dbAlt = parseFloat(self.symbol().altitude());
                } else if ((self.symbol().dbLat != parseFloat(self.symbol().latitude()) || 
                    self.symbol().dbLon != parseFloat(self.symbol().longitude()) || 
                    self.symbol().dbAlt != parseFloat(self.symbol().altitude())) || 
                    self.symbol().dbTimeExtinguished != self.symbol().koTimeExtinguished() ||
                    self.symbol().dbIsVerified != self.symbol().koIsVerified()) {
                    // process any change thru api
                    var updateFireQueryURL = "http://nasaspaceappschallenge2018.ddns.net:8081/api/fires/" + self.symbol().fid;
                    //var updateFireQueryURL = "http://localhost:4000/api/fires/" + self.symbol().fid;
                    var updateFireQuery = new FireRestAPI(updateFireQueryURL);
                    var params = {lat: parseFloat(self.symbol().latitude()), lon: parseFloat(self.symbol().longitude()), alt: parseFloat(self.symbol().altitude()),
                                 verified: self.symbol().koIsVerified(), exttime: self.symbol().koTimeExtinguished()};
                    updateFireQuery.updateFire(self.symbol().manager, params);
                }
            };

            // this.onFirstSave = function () {
            //     var icon = self.selectedFunction() ? self.selectedFunction().function : null,
            //     codingScheme = self.selectedScheme() ? self.selectedScheme().value : "S",
            //     stdIdentity = self.selectedAffiliation() ? self.selectedAffiliation().value : "U",
            //     operationalStatus = self.selectedStatus() ? self.selectedStatus().value : "-",
            //     battleDim = icon ? icon["battle dimension"] : "Z",
            //     functionId = icon ? icon["code"] : "------",
            //     modifier1 = self.selectedModifier1() ? self.selectedModifier1().value : "-",
            //     modifier2 = self.selectedModifier2() ? self.selectedModifier2().value : "-",
            //     symbolCode;

            //     symbolCode =
            //         codingScheme +
            //         stdIdentity +
            //         battleDim +
            //         operationalStatus +
            //         functionId +
            //         modifier1 +
            //         modifier2;

            //     console.log(symbolCode);
            //     self.symbol().symbolCode(symbolCode);
                

            //     // process any change thru api
            //     //var updateFireQueryURL = "http://nasaspaceappschallenge2018.ddns.net:8081/api/fires/" + self.symbol().fid;
            //     //var updateFireQueryURL = "http://localhost:4000/api/fires/" + self.symbol().fid;
            //     //var updateFireQuery = new FireRestAPI(updateFireQueryURL);
            //     //var params = {lat: parseFloat(self.symbol().latitude()), lon: parseFloat(self.symbol().longitude()), alt: parseFloat(self.symbol().altitude()),
            //     //            verified: self.symbol().koIsVerified(), exttime: self.symbol().koTimeExtinguished()};
            //     //updateFireQuery.updateFire(self.symbol().manager, params);
            // }


            /**
             * Opens a dialog to edit the symbol.
             * @param {TacticalSymbol} symbol
             */
            this.open = function (symbol) {
                console.log("Open Symbol: " + symbol.name());
                // Update observable(s)
                self.symbol(symbol);
                this.verifiedChanged = false;
                this.locationChanged = false;
                this.extTimeChanged = false;
                // Open the dialog
                var $symbolEditor = $(self.view);
                $symbolEditor.dialog({
                    autoOpen: false,
                    title: "Edit Fire Emergency Symbol",
                    buttons: {
                        "Save": function () {
                            self.onSave();
                            $(this).dialog("close");
                        },
                        Cancel: function () {
                            $(this).dialog("close");
                        }
                    }
                });
                $symbolEditor.dialog("open");
            };


            // Binds the view to this view model.
            ko.applyBindings(this, this.view);
        }

        return TacticalSymbolEditor;
    }
);