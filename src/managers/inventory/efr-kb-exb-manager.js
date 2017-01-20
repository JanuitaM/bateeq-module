'use strict';
//require('js-toolkit').Promise.ext;

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;

var ExpeditionDoc = BateeqModels.inventory.ExpeditionDoc;
var TransferOutDoc = BateeqModels.inventory.TransferOutDoc;
var TransferOutItem = BateeqModels.inventory.TransferOutItem;
var SPK = BateeqModels.merchandiser.SPK;
var generateCode = require('../../utils/code-generator');

const moduleId = "EFR-KB/EXB";
module.exports = class PusatBarangBaruKirimBarangJadiAksesorisManager {
    constructor(db, user) {
        this.db = db;
        this.user = user;
        this.expeditionDocCollection = this.db.use(map.inventory.ExpeditionDoc);

        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var TransferOutDocManager = require('./transfer-out-doc-manager');
        this.transferOutDocManager = new TransferOutDocManager(db, user);

        var SpkManager = require('../merchandiser/efr-pk-manager');
        this.spkManager = new SpkManager(db, user);

        var ModuleManager = require('../master/module-manager');
        this.moduleManager = new ModuleManager(db, user);
    }

    read(paging) {
        var _paging = Object.assign({
            page: 1,
            size: 20,
            order: '_id',
            asc: true
        }, paging);

        return new Promise((resolve, reject) => {
            var regexModuleId = new RegExp(moduleId, "i");
            var filter = {
                _deleted: false,
                'code': {
                    '$regex': regexModuleId
                }
            };
            var query = _paging.keyword ? {
                '$and': [filter]
            } : filter;

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


            this.expeditionDocCollection
                .where(query)
                .page(_paging.page, _paging.size)
                .orderBy(_paging.order, _paging.asc)
                .execute()
                .then(expeditionDocs => {
                    resolve(expeditionDocs);
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
                .then(expeditionDoc => {
                    resolve(expeditionDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByIdOrDefault(id) {
        return new Promise((resolve, reject) => {
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleByQueryOrDefault(query)
                .then(expeditionDoc => {
                    resolve(expeditionDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByQuery(query) {
        return new Promise((resolve, reject) => {
            this.expeditionDocCollection
                .single(query)
                .then(expeditionDoc => {
                    resolve(expeditionDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getSingleByQueryOrDefault(query) {
        return new Promise((resolve, reject) => {
            this.expeditionDocCollection
                .singleOrDefault(query)
                .then(expeditionDoc => {
                    resolve(expeditionDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    create(expeditionDoc) {
        return new Promise((resolve, reject) => {
            //Validate Input Model
            this._validate(expeditionDoc)
                .then(validatedExpeditionDoc => {
                    var getTransferOuts = [];
                    //Create Promise to Create Transfer Out
                    for (var spkDocument of validatedExpeditionDoc.spkDocuments) {
                        //getTransferOuts.push(this.transferOutDocManager.create(validTransferOutDoc));
                        var f = (spkDoc, outManager) => {
                            return () => {
                                var code = generateCode(moduleId);
                                var validTransferOutDoc = {};
                                validTransferOutDoc.code = code;
                                validTransferOutDoc.reference = spkDoc.spkDocument.packingList;
                                validTransferOutDoc.sourceId = spkDoc.spkDocument.sourceId;
                                validTransferOutDoc.destinationId = expeditionDoc.destinationId;
                                validTransferOutDoc.items = [];
                                for (var item of spkDoc.spkDocument.items) {
                                    var newitem = {};
                                    newitem.itemId = item.itemId;
                                    newitem.quantity = item.quantity;
                                    validTransferOutDoc.items.push(newitem);
                                }
                                return outManager.create(validTransferOutDoc)
                            }
                        };
                        getTransferOuts.push(f(spkDocument, this.transferOutDocManager));
                    }
                    //Create Transfer Out
                    //Promise.all(getTransferOuts)
                    require('js-toolkit').Promise.ext;
                    Promise.chain(getTransferOuts)
                        .then(results => {
                            getTransferOuts = [];
                            //Create Promise Get Transfer Out using ID
                            for (var transferOutResultId of results) {
                                getTransferOuts.push(this.transferOutDocManager.getSingleByIdOrDefault(transferOutResultId));
                            }
                            //Get Transfer Out
                            Promise.all(getTransferOuts)
                                .then(transferOutResults => {
                                    //Create Expedition Model
                                    var validExpeditionDoc = {};
                                    validExpeditionDoc.code = generateCode(moduleId);
                                    validExpeditionDoc.expedition = validatedExpeditionDoc.expedition;
                                    validExpeditionDoc.weight = validatedExpeditionDoc.weight;
                                    validExpeditionDoc.transferOutDocuments = [];
                                    validExpeditionDoc.spkDocuments = validatedExpeditionDoc.spkDocuments
                                    for (var transferOut of transferOutResults) {
                                        validExpeditionDoc.transferOutDocuments.push(transferOut);
                                    }
                                    validExpeditionDoc = new ExpeditionDoc(validExpeditionDoc);
                                    //Create Promise Expedition 
                                    this.expeditionDocCollection.insert(validExpeditionDoc)
                                        .then(resultExpeditionId => {
                                            //Get Expedition Data
                                            this.getSingleByIdOrDefault(resultExpeditionId)
                                                .then(resultExpedition => {
                                                    var getSPKData = [];
                                                    //Create Promise get SPK Data for update
                                                    for (var spkDocument of validExpeditionDoc.spkDocuments) {
                                                        getSPKData.push(this.spkManager.getSingleByIdOrDefault(spkDocument.spkDocumentId));
                                                    }
                                                    //Get SPK Data
                                                    Promise.all(getSPKData)
                                                        .then(resultSPKs => {
                                                            //Create Promise Update SPK Data
                                                            var getUpdateSPKData = [];
                                                            for (var resultSPK of resultSPKs) {
                                                                resultSPK.expeditionDocumentId = resultExpeditionId;
                                                                resultSPK.expeditionDocument = resultExpedition;
                                                                resultSPK = new SPK(resultSPK);
                                                                getUpdateSPKData.push(this.spkManager.update(resultSPK));
                                                            }
                                                            //Update SPK Data
                                                            Promise.all(getUpdateSPKData)
                                                                .then(resultUpdateSPKs => {
                                                                    resolve(resultExpeditionId);
                                                                })
                                                                .catch(e => {
                                                                    reject(e);
                                                                });
                                                        })
                                                        .catch(e => {
                                                            reject(e);
                                                        });
                                                })
                                                .catch(e => {
                                                    reject(e);
                                                });
                                        })
                                        .catch(e => {
                                            reject(e);
                                        });
                                })
                                .catch(e => {
                                    reject(e);
                                });
                        })
                        .catch(e => {
                            reject(e);
                        });
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    update(expeditionDoc) {
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    delete(expeditionDoc) {
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    _validate(expeditionDoc) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = expeditionDoc;
            this.moduleManager.getByCode(moduleId)
                .then(module => {
                    var config = module.config;
                    var getPromise = [];

                    if (!valid.destinationId || valid.destinationId == '')
                        errors["destinationId"] = "destinationId is required";
                    else {
                        if (config) {
                            if (config.destination) {
                                var isAny = false;
                                if (config.destination.type == "selection") {
                                    for (var destinationId of config.destination.value) {
                                        if (destinationId.toString() == valid.destinationId.toString()) {
                                            isAny = true;
                                            break;
                                        }
                                    }
                                }
                                else {
                                    if (config.destination.value.toString() == valid.destinationId.toString())
                                        isAny = true;
                                }
                                if (!isAny)
                                    errors["destinationId"] = "destinationId is not valid";
                            }
                        }
                    }

                    if (!valid.weight || valid.weight == '')
                        errors["weight"] = "weight is required";

                    if (!valid.expedition || valid.expedition == '')
                        errors["expedition"] = "expedition is required";

                    if (!valid.spkDocuments || valid.spkDocuments.length == 0) {
                        errors["spkDocuments"] = "spkDocuments is required";
                    }
                    else {
                        var spkDocumentErrors = [];
                        for (var spkDocument of valid.spkDocuments) {
                            var spkDocumentError = {};
                            if (!spkDocument.spkDocumentId || spkDocument.spkDocumentId == "") {
                                spkDocumentError["spkDocumentId"] = "packing list is required";
                                getPromise.push(Promise.resolve(null));
                            }
                            else {
                                for (var i = valid.spkDocuments.indexOf(spkDocument) + 1; i < valid.spkDocuments.length; i++) {
                                    var otherItem = valid.spkDocuments[i];
                                    if (spkDocument.spkDocumentId == otherItem.spkDocumentId) {
                                        spkDocumentError["spkDocumentId"] = "spkDocumentId already exists on another detail";
                                    }
                                }

                                if (spkDocument.spkDocument.destinationId.toString() != valid.destinationId.toString())
                                    spkDocumentError["spkDocumentId"] = "spkDocumentId's Destination is not right";

                                getPromise.push(this.spkManager.getSingleByIdOrDefault(spkDocument.spkDocumentId));
                            }
                            spkDocumentErrors.push(spkDocumentError);
                        }
                        for (var spkDocumentError of spkDocumentErrors) {
                            for (var prop in spkDocumentError) {
                                errors.spkDocuments = spkDocumentErrors;
                                break;
                            }
                            if (errors.spkDocuments)
                                break;
                        }
                    }
                    for (var prop in errors) {
                        var ValidationError = require('../../validation-error');
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    Promise.all(getPromise)
                        .then(spkDocuments => {
                            var spkDocumentErrors = [];
                            var index = 0;
                            for (var spkDocument of valid.spkDocuments) {
                                var spkDocumentError = {};
                                if (spkDocuments[index]) {
                                    var spkspkDocumentError = {};
                                    if (spkDocument.spkDocument) {
                                        if (!spkDocument.spkDocument.items || spkDocument.spkDocument.items.length == 0) {
                                            spkspkDocumentError["items"] = "items is required";
                                        }
                                        else {
                                            var itemErrors = [];
                                            for (var item of spkDocument.spkDocument.items) {
                                                var itemError = {};
                                                if (item.quantity == undefined || (item.quantity && item.quantity == '')) {
                                                    itemError["quantity"] = "quantity is required";
                                                }
                                                else if (parseInt(item.quantity) <= 0) {
                                                    itemError["quantity"] = "quantity must be greater than 0";
                                                }
                                                if (item.quantitySend == undefined || (item.quantitySend && item.quantitySend == '')) {
                                                    itemError["quantitySend"] = "quantitySend is required";
                                                }
                                                else if (parseInt(item.quantitySend) <= 0) {
                                                    itemError["quantitySend"] = "quantitySend must be greater than 0";
                                                }
                                                if (item.quantitySend != item.quantity) {
                                                    itemError["quantitySend"] = "quantitySend not equal to quantity";
                                                }
                                                itemErrors.push(itemError);
                                            }
                                            for (var itemError of itemErrors) {
                                                for (var prop in itemError) {
                                                    spkspkDocumentError.items = itemErrors;
                                                    break;
                                                }
                                                if (spkspkDocumentError.items)
                                                    break;
                                            }
                                        }
                                    }

                                    for (var prop in spkspkDocumentError) {
                                        spkDocumentError["spkDocument"] = spkspkDocumentError;
                                        break;
                                    }
                                    spkDocument.spkDocument = spkDocuments[index];
                                }
                                // else {
                                //     spkDocumentError["spkDocument"] = "SPK Document not found";
                                // } 
                                index++;
                                spkDocumentErrors.push(spkDocumentError);
                            }
                            for (var spkDocumentError of spkDocumentErrors) {
                                for (var prop in spkDocumentError) {
                                    errors.spkDocuments = spkDocumentErrors;
                                    break;
                                }
                                if (errors.spkDocuments)
                                    break;
                            }

                            for (var prop in errors) {
                                var ValidationError = require('../../validation-error');
                                reject(new ValidationError('data does not pass validation', errors));
                            }

                            valid = new ExpeditionDoc(valid);
                            valid.stamp(this.user.username, 'manager');
                            resolve(valid)
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
};