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

const moduleId = "EFR-TB/ALT";

module.exports = class AlterationInManager {
    constructor(db, user){
        this.db = db;
        this.user = user;
        this.transferInDocCollection = this.db.use(map.inventory.TransferInDoc);

        var TransferInDocManager = require('./transfer-in-doc-manager');
        this.transferInDocManager = new TransferInDocManager(db,user);

        var AlterationOutManager = require('./efr-kb-alt-manager');
        this.alterationOutManager = new AlterationOutManager(db,user);

        var ModuleManager = require('../master/module-manager');
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

            this.transferInDocCollection
                .where(query)
                .page(_paging.page, _paging.size)
                .orderBy(_paging.order, _paging.asc)
                .execute()
                .then(transferInDocs => {
                    resolve(transferInDocs);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleById(id) {
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
            this.getSingleByQueryOrDefault(query)
                .then(transferInDoc => {
                    resolve(transferInDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByQuery(query) {
        return new Promise((resolve, reject) => {
            this.transferInDocCollection
                .single(query)
                .then(transferInDoc => {
                    resolve(transferInDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getSingleByQueryOrDefault(query) {
        return new Promise((resolve, reject) => {
            this.transferInDocCollection
                .singleOrDefault(query)
                .then(transferInDoc => {
                    resolve(transferInDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    create(transferInDoc) {
        return new Promise((resolve, reject) => {

            this._validate(transferInDoc)
                .then(validTransferInDoc => {
                    validTransferInDoc.code = generateCode(moduleId)
                    this.transferInDocManager.create(validTransferInDoc)
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

    _validate(transferInDoc){
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = transferInDoc;
            this.moduleManager.getByCode(moduleId)
            .then(module => {
                var config = module.config;
                valid.source = config.source;
                valid.sourceId = config.source.value.toString();
                valid.destination = config.destination;
                valid.destinationId = config.destination.value.toString();

                var getAltOutById = this.alterationOutManager.getByCode(valid.reference);
                var getAltInByRef = this.getByReference(valid.reference);
                Promise.all([getAltOutById, getAltInByRef])
                .then(results =>{
                    var altOut = results[0];
                    var altIn = results[1];
                    if(!altOut){
                        errors["reference"] = "reference not found";
                    } 
                    // if(altIn){
                    //     errors["reference"] = "reference already used";
                    // }
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