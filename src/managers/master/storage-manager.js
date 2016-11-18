'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BaseManager = require('../base-manager');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;

var Storage = BateeqModels.master.Storage;


module.exports = class StorageManager extends BaseManager { 
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.master.Storage);
    }

    _getQuery(paging) {  
        var basicFilter = {
            _deleted: false
        }, keywordFilter={};
        
        var query = {};

        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");
            var filterCode = {
                'code': {
                    '$regex': regex
                }
            };
            var filterName = {
                'name': {
                    '$regex': regex
                }
            };
            
            keywordFilter = {
                '$or': [filterCode, filterName]
            }; 
        }
        query = { '$and': [basicFilter, paging.filter, keywordFilter] };
        return query;
    }
 
    _validate(storage) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = new Storage(storage);
            // 1. begin: Declare promises.
            var getStorage = this.collection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                        code: valid.code
                    }]
            });
            // 1. end: Declare promises.

            // 2. begin: Validation.
            Promise.all([getStorage])
                .then(results => {
                    var _storage = results[0];

                    if (!valid.code || valid.code == '')
                        errors["code"] = "code is required";
                    else if (_storage) {
                        errors["code"] = "code already exists";
                    }

                    if (!valid.name || valid.name == '')
                        errors["name"] = "name is required"; 

                    // 2c. begin: check if data has any error, reject if it has.
                    for (var prop in errors) {
                        var ValidationError = require('../../validation-error');
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    valid.stamp(this.user.username, 'manager');
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                })
        });
    }
};