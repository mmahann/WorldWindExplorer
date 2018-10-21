/* Filename: FireRestAPI.js
 * Description: API that will query the database
 * Original Creator: NASA
 * Date created: ?
 * Modified by: Gus Schultz
 */


/*
 * Copyright 2003-2006, 2009, 2017, United States Government, as represented by the Administrator of the
 * National Aeronautics and Space Administration. All rights reserved.
 *
 * The NASAWorldWind/WebWorldWind platform is licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @exports FireRestAPI
 */
define([
    'model/military/TacticalSymbol'
],
    function (
        TacticalSymbol
    ) {
        "use strict";

        /**
         * Constructs a FireRestAPI object for a specified FireRestAPI data source. Call [load]{@link FireRestAPI#load} to
         * retrieve the FireRestAPI and create objects for it.
         * @alias FireRestAPI
         * @constructor
         * @classdesc Parses a FireRestAPI and creates objects representing its contents.
         * <p>
         * An attribute callback may also be specified to examine each return object and configure the object created for it.
         * This function enables the application to assign independent attributes to each
         * object. An argument to this function provides any attributes specified in a properties member of FireRestAPI
         * feature.
         * @param {String|Object} dataSource The data source of the FireRestAPI. Can be a URL to an external resource,
         * or a JSON string, or a JavaScript object representing a parsed FireRestAPI string.
         * @throws {WorldWind.ArgumentError} If the specified data source is null or undefined.
         */
        var FireRestAPI = function (dataSource, WorldWind) {
            if (!dataSource) {
                throw new WorldWind.ArgumentError(
                    WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "FireRestAPI", "constructor", "missingDataSource"));
            }

            // Documented in defineProperties below.
            this._dataSource = dataSource;
        };

        Object.defineProperties(FireRestAPI.prototype, {
            /**
             * The FireRestAPI data source as specified to this FireRestAPI's constructor.
             * @memberof FireRestAPI.prototype
             * @type {String|Object}
             * @readonly
             */
            dataSource: {
                get: function () {
                    return this._dataSource;
                }
            },
        });

        /**
         * Retrieves the FireRestAPI, parses it and creates objects representing its contents. The result is several layers
         * containing the created objects.
         * @param symbolManager is an Explorer specific class to handle the creation and management of tactical symbols.
         */

        FireRestAPI.prototype.retrieveFires = function (symbolManager) {
            var dataSourceType = (typeof this.dataSource);
            var loadComplete = false;   // set to false, override if metadata successfully loaded
            if (dataSourceType === 'string'){
                if(symbolManager) {
                    this.requestFiresXHR(symbolManager);
                    loadComplete = true;
                } else {
                    throw new WorldWind.ArgumentError(WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "FireRestAPI", "retrieveFires", 
                        "missingSymbolManager"));
                } 
            } else {
                throw new WorldWind.ArgumentError(WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "FireRestAPI", "retrieveFires",
                    "Unsupported data source type: " + dataSourceType));
            }
            return loadComplete;
        };

        // Calls API to update the existing placemark in the database
        FireRestAPI.prototype.updateFire = function(symbolManager, params) {
            var dataSourceType = (typeof this.dataSource);
            if(dataSourceType === 'string'){
                if(symbolManager){
                    this.updateFireXHR(params)
                } else {
                    throw new WorldWind.ArgumentError(WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "FireRestAPI", "updateFire", 
                    "missingSymbolManager"));
                }
            } else {
                throw new WorldWind.ArgumentError(WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "FireRestAPI", "updateFire",
                    "Unsupported data source type: " + dataSourceType));
            }
        };

        // Calls API to create a fire in the database
        FireRestAPI.prototype.createFire = function (symbolManager, params) {
            var dataSourceType = (typeof this.dataSource);
            if(dataSourceType === 'string'){
                if(symbolManager){
                    this.createFireXHR(params)
                } else {
                    throw new WorldWind.ArgumentError(WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "FireRestAPI", "createFire", 
                    "missingSymbolManager"));
                }
            } else {
                throw new WorldWind.ArgumentError(WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "FireRestAPI", "createFire",
                    "Unsupported data source type: " + dataSourceType));
            }
        }

        FireRestAPI.prototype.createFireXHR = function (params, xhr = new XMLHttpRequest()) {
            xhr.open("POST", this.dataSource, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onreadystatechange = (function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        // do nothing on status good
                        // TODO: Maybe we should clear the symbol manager on a good update and force a refresh of the data?
                    }
                    else {
                        WorldWind.Logger.log(WorldWind.Logger.LEVEL_WARNING,
                            "FireRestAPI fire update failed (" + xhr.statusText + "): " + this.dataSourceurl);
                    }
                }
            }).bind(this);

            xhr.onerror = function () {
                WorldWind.Logger.log(WorldWind.Logger.LEVEL_WARNING, "FireRestAPI fires retrieval failed: " + url);
            };

            xhr.ontimeout = function () {
                WorldWind.Logger.log(WorldWind.Logger.LEVEL_WARNING, "FireRestAPI fires retrieval timed out: " + url);
            };

            var body = {lat: params.lat, lon: params.lon, alt: params.alt};
            xhr.send(JSON.stringify(body));
        }

        // Get FireRestAPI metadata string using XMLHttpRequest. Internal use only.
        FireRestAPI.prototype.requestFiresXHR = function (symbolManager, xhr = new XMLHttpRequest()) {
            xhr.open("GET", this.dataSource, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.onreadystatechange = (function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        this.handleFires(FireRestAPI.tryParseJSONString(xhr.response), symbolManager);
                    }
                    else {
                        WorldWind.Logger.log(WorldWind.Logger.LEVEL_WARNING,
                            "FireRestAPI fires retrieval failed (" + xhr.statusText + "): " + this.dataSource);
                    }
                }
            }).bind(this);

            xhr.onerror = function () {
                WorldWind.Logger.log(WorldWind.Logger.LEVEL_WARNING, "FireRestAPI fires retrieval failed: " + url);
            };

            xhr.ontimeout = function () {
                WorldWind.Logger.log(WorldWind.Logger.LEVEL_WARNING, "FireRestAPI fires retrieval timed out: " + url);
            };

            xhr.send(null);
        };

        FireRestAPI.prototype.updateFireXHR = function (params, xhr = new XMLHttpRequest()) {
            xhr.open("PUT", this.dataSource, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onreadystatechange = (function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        // do nothing on status good
                        // TODO: Maybe we should clear the symbol manager on a good update and force a refresh of the data?
                    }
                    else {
                        WorldWind.Logger.log(WorldWind.Logger.LEVEL_WARNING,
                            "FireRestAPI fire update failed (" + xhr.statusText + "): " + this.dataSourceurl);
                    }
                }
            }).bind(this);

            xhr.onerror = function () {
                WorldWind.Logger.log(WorldWind.Logger.LEVEL_WARNING, "FireRestAPI fires retrieval failed: " + url);
            };

            xhr.ontimeout = function () {
                WorldWind.Logger.log(WorldWind.Logger.LEVEL_WARNING, "FireRestAPI fires retrieval timed out: " + url);
            };

            // create body string based on params
            if (params.exttime === null) {
                var dateString = "";
            } else {
                var dateString = params.exttime.replace('-', "")
                dateString = dateString.replace('-', "");
            }
            var body = {lat: params.lat, lon: params.lon, alt: params.alt, verified: params.verified, exttime: dateString};
            xhr.send(JSON.stringify(body));
        };

        // Handles the object created from the FireRestAPI data source. Internal use only.
        FireRestAPI.prototype.handleFires = function (obj, symbolManager) {
            if (!obj) {
                throw new WorldWind.ArgumentError(
                    WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "FireRestAPI", "handleFires", "Invalid FireRestAPI object"));
            } else if (!symbolManager) {
                throw new WorldWind.ArgumentError(
                    WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "FireRestAPI", "handleFires", "Invalid symbolManager object"));
            }

            // Create empty variables outside of the loop so they are not created and destroyed on each iteration
            var firePlacemark = [];
            var firePosition = {};
            var fid = null;
            var timeReportedStamp = null;
            var timeExtinguishedStamp = null;
            var verified = false;

            // Loop thru the length of obj to process each row of return data
            for (var i = 0; i < obj.data.length; i++) {
                // Format data for ease of use in WW datatypes.
                firePosition = new WorldWind.Position(obj['data'][i]['fire_lat'], obj['data'][i]['fire_lon'], obj['data'][i]['fire_alt']);
                fid = obj['data'][i]['fid'];
                timeReportedStamp = obj['data'][i]['reportedtimemark'];
                timeExtinguishedStamp = obj['data'][i]['fire_extinguished']
                verified = obj['data'][i]['fire_verified'];
                firePlacemark[i] = new TacticalSymbol(                
                    symbolManager, firePosition, { symbolCode: "EHIPC-------", timeReported: timeReportedStamp, timeExtinguished: timeExtinguishedStamp, isMoveable: false, user: false, verified: verified, fid: fid});

                symbolManager.addSymbol(firePlacemark[i]);
                
            }
        };

        /**
         * Tries to parse a JSON string into a JavaScript object.
         * @param {String} str the string to try to parse.
         * @returns {Object} the object if the string is valid JSON; otherwise null.
         */
        FireRestAPI.tryParseJSONString = function (str) {
            try {
                return JSON.parse(str);
            } catch (e) {
                return null;
            }
        };

        return FireRestAPI;
    }
);