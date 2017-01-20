'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;
var ItemManager = require('./item-manager');
var FinishedGoods = BateeqModels.master.FinishedGoods;

module.exports = class FinishedGoodsManager extends ItemManager {
    constructor(db, user) {
        super(db, user); 
    }
    
    _getQuery(paging) {
        var basicFilter = {
            _deleted: false,
            _type: 'finished-goods'
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
        return super._validate(new FinishedGoods(data));
        // var errors = {};
        // return new Promise((resolve, reject) => {
        //     // 1. begin: Declare promises.
        //     var getFinishedGoods = this.collection.singleOrDefault({
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
        //     Promise.all([getFinishedGoods])
        //         .then(results => {
        //             var _item = results[0];

        //             if (!data.code || data.code == '')
        //                 errors["code"] = "code is required";
        //             else if (_item)
        //                 errors["code"] = "code already exists";

        //             if (!data.name || data.name == '')
        //                 errors["name"] = "name is required";
                        

        //             if (data.domesticCOGS == undefined || (data.domesticCOGS && data.domesticCOGS == '')) {
        //                 errors["domesticCOGS"] = "domesticCOGS is required";
        //             }
        //             else if (parseInt(data.domesticCOGS) < 0) {
        //                 errors["domesticCOGS"] = "domesticCOGS must be greater with 0";
        //             }
        //             if (data.domesticWholesale == undefined || (data.domesticWholesale && data.domesticWholesale == '')) {
        //                 errors["domesticWholesale"] = "domesticWholesale is required";
        //             }
        //             else if (parseInt(data.domesticWholesale) < 0) {
        //                 errors["domesticWholesale"] = "domesticWholesale must be greater with 0";
        //             }
        //             if (data.domesticRetail == undefined || (data.domesticRetail && data.domesticRetail == '')) {
        //                 errors["domesticRetail"] = "domesticRetail is required";
        //             }
        //             else if (parseInt(data.domesticRetail) < 0) {
        //                 errors["domesticRetail"] = "domesticRetail must be greater with 0";
        //             }
        //             if (data.domesticSale == undefined || (data.domesticSale && data.domesticSale == '')) {
        //                 errors["domesticSale"] = "domesticSale is required";
        //             }
        //             else if (parseInt(data.domesticSale) < 0) {
        //                 errors["domesticSale"] = "domesticSale must be greater with 0";
        //             }
        //             if (data.internationalCOGS == undefined || (data.internationalCOGS && data.internationalCOGS == '')) {
        //                 errors["internationalCOGS"] = "internationalCOGS is required";
        //             }
        //             else if (parseInt(data.internationalCOGS) < 0) {
        //                 errors["internationalCOGS"] = "internationalCOGS must be greater with 0";
        //             }
        //             if (data.internationalWholesale == undefined || (data.internationalWholesale && data.internationalWholesale == '')) {
        //                 errors["internationalWholesale"] = "internationalWholesale is required";
        //             }
        //             else if (parseInt(data.internationalWholesale) < 0) {
        //                 errors["internationalWholesale"] = "internationalWholesale must be greater with 0";
        //             }
        //             if (data.internationalRetail == undefined || (data.internationalRetail && data.internationalRetail == '')) {
        //                 errors["internationalRetail"] = "internationalRetail is required";
        //             }
        //             else if (parseInt(data.internationalRetail) < 0) {
        //                 errors["internationalRetail"] = "internationalRetail must be greater with 0";
        //             }
        //             if (data.internationalSale == undefined || (data.internationalSale && data.internationalSale == '')) {
        //                 errors["internationalSale"] = "internationalSale is required";
        //             }
        //             else if (parseInt(data.internationalSale) < 0) {
        //                 errors["internationalSale"] = "internationalSale must be greater with 0";
        //             }

        //             // 2c. begin: check if data has any error, reject if it has.
        //             for (var prop in errors) {
        //                 var ValidationError = require('../../validation-error');
        //                 reject(new ValidationError('data does not pass validation', errors));
        //             }

        //             var valid = new FinishedGoods(data);
        //             valid.stamp(this.user.username, 'manager');
        //             resolve(valid);
        //         })
        //         .catch(e => {
        //             reject(e);
        //         })
        // });
    }
};