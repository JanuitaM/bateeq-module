 'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;
var generateCode = require('../../utils/code-generator');

var TransferOutDoc = BateeqModels.inventory.TransferOutDoc;
var TransferOutItem = BateeqModels.inventory.TransferOutItem;

const moduleId = "EFR-KB/ALT";

module.exports = class AlterationOutManager {
    constructor(db, user){
        this.db = db;
        this.user = user;
        this.transferOutDocCollection = this.db.use(map.inventory.TransferOutDoc);
        
        var TransferOutDocManager = require('./transfer-out-doc-manager');
        this.transferOutDocManager = new TransferOutDocManager(db,user);

        var FinishingTerimaBarangReturManager = require('./efr-tb-bjr-manager');
        this.finishingTerimaBarangReturManager = new FinishingTerimaBarangReturManager(db,user);

        var TransferInDocManager = require('./transfer-in-doc-manager');
        this.transferInDocManager = new TransferInDocManager(db,user);

        var ModuleManager = require('../core/module-manager');
        this.moduleManager = new ModuleManager(db,user);
    }

    read(paging){
        var _paging = Object.assign({
            page : 1,
            size : 20,
            order: "_id",
            asc : true
        },paging);

        return new Promise((resolve, reject) => {
            var deleted = {
                _deleted: false,
                code: {
                        '$regex': new RegExp("^[A-Z0-9]+\/" + moduleId + "\/[0-9]{2}\/[0-9]{4}$","i")}
            };
            
            var query = _paging.keyword ? {
                '$and': [deleted]
            } : deleted;

            if (_paging.keyword) {
                var regex = new RegExp(_paging.keyword, "i");
                var filterCode = {
                    'code': {
                        '$regex': regex
                    }
                };
                var $or = {
                    '$or': [filterCode]
                };
                query['$and'].push($or);
            }

            this.transferOutDocCollection
                .where(query)
                .page(_paging.page, _paging.size)
                .orderBy(_paging.order, _paging.asc)
                .execute()
                .then(transferOutDocs => {
                    resolve(transferOutDocs);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getByCode(code) {
        return new Promise((resolve, reject) => {
            var query = {
                code: code,
                _deleted: false
            };
            this.getSingleOrDefaultByQuery(query)
                .then(transferOutDoc => {
                    resolve(transferOutDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getById(id) {
        return new Promise((resolve, reject) => {
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleByQuery(query)
                .then(transferOutDoc => {
                    resolve(transferOutDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getByReference(ref) {
        return new Promise((resolve, reject) => {
            var query = {
                reference: ref,
                _deleted: false
            };
            this.getSingleOrDefaultByQuery(query)
                .then(transferOutDoc => {
                    resolve(transferOutDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByQuery(query) {
        return new Promise((resolve, reject) => {
            this.transferOutDocCollection
                .single(query)
                .then(transferOutDoc => {
                    resolve(transferOutDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    

    getSingleOrDefaultByQuery(query) {
        return new Promise((resolve, reject) => {
            this.transferOutDocCollection
                .singleOrDefault(query)
                .then(transferOutDoc => {
                    resolve(transferOutDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    create(transferOutDoc) {
        return new Promise((resolve, reject) => {

            this._validate(transferOutDoc)
                .then(validTransferOutDoc => {
                    validTransferOutDoc.code = generateCode(moduleId)
                    this.transferOutDocManager.create(validTransferOutDoc)
                        .then(id => {
                                resolve(id);
                        })
                        .catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    update(transferOutDoc){
        return new Promise((resolve,reject) =>{

        });
    }

    _validate(transferOutDoc){
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = transferOutDoc;
            this.moduleManager.getByCode(moduleId)
            .then(module => {
                var config = module.config;
                valid.source = config.source;
                valid.sourceId = config.source.value.toString();
                valid.destination = config.destination;
                valid.destinationId = config.destination.value.toString();

                var getbjrInByCode =  this.finishingTerimaBarangReturManager.getByCode(valid.reference);
                var getAltOutByRef = this.getByReference(valid.reference);

                Promise.all([getbjrInByCode,getAltOutByRef])
                .then(results =>{
                    var bjrTransferIn = results[0];
                    var altTransferOut = results[1];
                    if(bjrTransferIn){
                        if (valid.items && valid.items.length > 0) {
                            
                        var itemErrors = [];
                            for(var item of valid.items){
                                var itemError = {};
                                for(var item2 of bjrTransferIn.items){
                                    if(item.articleVariantId.toString() == item2.articleVariantId.toString()){
                                        if(item.quantity > item2.quantity){
                                            itemError["articleVariantId"] = "item retur harus lebih kecil atau sama dengan";
                                        }
                                    }
                                }
                                itemErrors.push(itemError);
                            }

                            for (var itemError of itemErrors) {
                                for (var prop in itemError) {
                                    errors.items = itemErrors;
                                    break;
                                }
                                if (errors.items)
                                    break;
                            }
                        }else{
                            errors["items"] = "items is required";
                        }
                    }else{
                            errors["reference"] = "reference not found";
                    }

                    // if(altTransferOut){
                    //         errors["reference"] = "reference already used";
                    // }

                    // 2c. begin: check if data has any error, reject if it has.
                    
                    
                    for (var prop in errors) {
                        var ValidationError = require('../../validation-error');
                        reject(new ValidationError('data does not pass validation', errors));
                    }
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                });

            })
            .catch(e => {
                reject(new Error(`Unable to load module:${moduleId}`));
            });
        });
    }
}