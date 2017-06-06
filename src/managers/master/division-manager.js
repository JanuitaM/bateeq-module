"use strict";

var ObjectId = require("mongodb").ObjectId;

require("mongodb-toolkit");

var DLModels = require("bateeq-models");
var map = DLModels.map;
var Division = DLModels.master.Division;
var BaseManager = require("module-toolkit").BaseManager; 
var generateCode = require("../../utils/code-generator");

module.exports = class DivisionManager extends BaseManager {

    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.master.collection.Division);
    }

    _getQuery(paging) {
        var _default = {
                _deleted: false
            },
            pagingFilter = paging.filter || {},
            keywordFilter = {},
            query = {};

        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");
            var codeFilter = {
                "code": {
                    "$regex": regex
                }
            };
            var nameFilter = {
                "name": {
                    "$regex": regex
                }
            };
            keywordFilter["$or"] = [codeFilter, nameFilter];
        }
        query["$and"] = [_default, keywordFilter, pagingFilter];
        return query;
    }

    _validate(unit) {
        var errors = {};
        var valid = unit;
        // 1. begin: Declare promises.
        var getunitPromise = this.collection.singleOrDefault({
            _id: {
                '$ne': new ObjectId(valid._id)
            },
            code: valid.code
        });

        // 2. begin: Validation.
        return Promise.all([getunitPromise])
            .then(results => {
                var _division = results[0];

                if (!valid.code || valid.code == "")
                    errors["code"] = "code is required";
                else if (_division) {
                    errors["code"] = "code is already exists";
                }

                if (!valid.name || valid.name == "")
                    errors["name"] = "name is required";

                if (Object.getOwnPropertyNames(errors).length > 0) {
                    var ValidationError = require("module-toolkit").ValidationError;
                    return Promise.reject(new ValidationError("data does not pass validation", errors));
                }

                valid = new Division(unit);
                valid.stamp(this.user.username, "manager");
                return Promise.resolve(valid);
            });
    }
    getDivision() {
        return new Promise((resolve, reject) => {
            var query = {
                _deleted: false
            };

            this.collection
                .where(query)
                .execute()
                .then(divisions => {
                    resolve(divisions);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    insert(dataFile) {
        return new Promise((resolve, reject) => {
            var division;
            this.getDivision()
                .then(results => {
                    division = results.data;
                    var data = [];
                    if (dataFile != "") {
                        for (var i = 1; i < dataFile.length; i++) {
                            data.push({ "name": dataFile[i][0], "description": dataFile[i][1] });
                        }
                    }
                    var dataError = [], errorMessage;
                    for (var i = 0; i < data.length; i++) {
                        errorMessage = ""; 
                        if (data[i]["name"] === "" || data[i]["name"] === undefined) {
                            errorMessage = errorMessage + "Nama tidak boleh kosong, ";
                        }
                        for (var j = 0; j < division.length; j++) { 
                            if ((division[j]["name"]).toLowerCase() === (data[i]["name"]).toLowerCase()) {
                                errorMessage = errorMessage + "Nama tidak boleh duplikat";
                            }
                        }
                        if (errorMessage !== "") {
                            dataError.push({"name": data[i]["name"], "description": data[i]["description"], "Error": errorMessage });
                        }
                    }
                    if (dataError.length === 0) {
                        var newDivision = [];
                        for (var i = 0; i < data.length; i++) {
                            var valid = new Division(data[i]);
                            valid.code= generateCode();
                            valid.stamp(this.user.username, 'manager');
                            this.collection.insert(valid)
                                .then(id => {
                                    this.getSingleById(id)
                                        .then(resultItem => {
                                            newDivision.push(resultItem)
                                            resolve(newDivision);
                                        })
                                        .catch(e => {
                                            reject(e);
                                        });
                                })
                                .catch(e => {
                                    reject(e);
                                });
                        }
                    } else {
                        resolve(dataError);
                    }
                })
        })
    }

    _createIndexes() {
        var dateIndex = {
            name: `ix_${map.master.collection.Unit}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        };

        var codeIndex = {
            name: `ix_${map.master.collection.Unit}_code`,
            key: {
                code: 1
            },
            unique: true
        };

        return this.collection.createIndexes([dateIndex, codeIndex]);
    }

}
