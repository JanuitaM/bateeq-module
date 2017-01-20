'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;
var Material = BateeqModels.master.Material;
var ItemManager = require('./item-manager');

module.exports = class MaterialManager extends ItemManager {
    constructor(db, user) {
        super(db, user);
    }

    _getQuery(paging) {
        var basicFilter = {
            _deleted: false,
            _type: 'material'
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

    _validate(data) {
        return super._validate(new Material(data));
        // var errors = {};
        // return new Promise((resolve, reject) => {
        //     // 1. begin: Declare promises.
        //     var getItem = this.collection.singleOrDefault({
        //         "$and": [{
        //             _id: {
        //                 '$ne': new ObjectId(data._id)
        //             }
        //         }, {
        //             code: data.code
        //         }]
        //     });
        //     // 1. end: Declare promises.

        //     // 2. begin: Validation.
        //     Promise.all([getItem])
        //         .then(results => {
        //             var _item = results[0];

        //             if (!data.code || data.code == '')
        //                 errors["code"] = "code is required";
        //             else if (_item)
        //                 errors["code"] = "code already exists";

        //             if (!data.name || data.name == '')
        //                 errors["name"] = "name is required";

        //             if (!data.uom || data.uom == '')
        //                 errors["uom"] = "uom is required";

        //             this.componentHelper.validate(data.components)
        //                 .then(result => {
        //                     data.components = result.components;

        //                     // 2c. begin: check if data has any error, reject if it has.
        //                     for (var prop in errors) {
        //                         var ValidationError = require('../../validation-error');
        //                         reject(new ValidationError('data does not pass validation', errors));
        //                     }

        //                     var valid = new Item(data);
        //                     valid.stamp(this.user.username, 'manager');
        //                     resolve(valid);
        //                 })
        //                 .catch(e => {
        //                     errors["components"] = e;

        //                     // 2c. begin: check if data has any error, reject if it has.
        //                     for (var prop in errors) {
        //                         var ValidationError = require('../../validation-error');
        //                         reject(new ValidationError('data does not pass validation', errors));
        //                     }
        //                 });
        //         })
        //         .catch(e => {
        //             reject(e);
        //         })
        // });
    }
};