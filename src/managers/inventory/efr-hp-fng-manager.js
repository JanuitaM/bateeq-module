'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;

var FinishedGoodsDoc = BateeqModels.inventory.FinishedGoodsDoc;
var TransferInDoc = BateeqModels.inventory.TransferInDoc;
var TransferInItem = BateeqModels.inventory.TransferInItem;
var TransferOutDoc = BateeqModels.inventory.TransferOutDoc;
var TransferOutItem = BateeqModels.inventory.TransferOutItem;
var Item = BateeqModels.master.Item;
var generateCode = require('../../utils/code-generator');

const moduleId = "EFR-HP/FNG";
const moduleIdIn = "EFR-TB/FNG";
const moduleIdOut = "EFR-KB/SAB";
module.exports = class FinishedGoodsManager {
    constructor(db, user) {
        this.db = db;
        this.user = user;
        this.finishedGoodsDocCollection = this.db.use(map.inventory.FinishedGoodsDoc);
        this.transferInDocCollection = this.db.use(map.inventory.TransferInDoc);
        this.transferOutDocCollection = this.db.use(map.inventory.TransferOutDoc);

        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var ItemManager = require('../master/item-manager');
        this.itemManager = new ItemManager(db, user);

        var InventoryManager = require('./inventory-manager');
        this.inventoryManager = new InventoryManager(db, user);

        var TransferInDocManager = require('./transfer-in-doc-manager');
        this.transferInDocManager = new TransferInDocManager(db, user);

        var TransferOutDocManager = require('./transfer-out-doc-manager');
        this.transferOutDocManager = new TransferOutDocManager(db, user);

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
            var deleted = {
                _deleted: false
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


            this.finishedGoodsDocCollection
                .where(query)
                .page(_paging.page, _paging.size)
                .orderBy(_paging.order, _paging.asc)
                .execute()
                .then(finishedGoodsDocs => {
                    resolve(finishedGoodsDocs);
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
                .then(finishedGoodsDoc => {
                    resolve(finishedGoodsDoc);
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
                .then(finishedGoodsDoc => {
                    resolve(finishedGoodsDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getByCodeOrDefault(code) {
        return new Promise((resolve, reject) => {
            var query = {
                code: code,
                _deleted: false
            };
            this.getSingleByQueryOrDefault(query)
                .then(finishedGoodsDoc => {
                    resolve(finishedGoodsDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByQuery(query) {
        return new Promise((resolve, reject) => {
            this.finishedGoodsDocCollection
                .single(query)
                .then(finishedGoodsDoc => {
                    resolve(finishedGoodsDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getSingleByQueryOrDefault(query) {
        return new Promise((resolve, reject) => {
            this.finishedGoodsDocCollection
                .singleOrDefault(query)
                .then(finishedGoodsDoc => {
                    resolve(finishedGoodsDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    create(finishedGoodDoc) {
        return new Promise((resolve, reject) => {
            this._validate(finishedGoodDoc)
                .then(validFinishedGoodDoc => {
                    var codeTransferIn = generateCode(moduleIdIn);
                    var codeTransferOut = generateCode(moduleIdOut);
                    var codeFinishedGood = generateCode(moduleId);
                    var getMethods = [];

                    //Create Promise Create Transfer In and generate Model
                    var validTransferInDoc = {};
                    validTransferInDoc.code = codeTransferIn;
                    validTransferInDoc.reference = codeFinishedGood;
                    validTransferInDoc.sourceId = finishedGoodDoc.sourceId;
                    validTransferInDoc.destinationId = finishedGoodDoc.destinationId;
                    validTransferInDoc.items = [];
                    for (var item of finishedGoodDoc.items) {
                        var newitem = {};
                        newitem.itemId = item.item._id;
                        newitem.quantity = item.quantity;
                        validTransferInDoc.items.push(newitem);
                    }
                    validTransferInDoc = new TransferInDoc(validTransferInDoc);
                    getMethods.push(this.transferInDocManager.create(validTransferInDoc));

                    //Create Promise Create Transfer Out and generate Model
                    var validTransferOutDoc = {};
                    validTransferOutDoc.code = codeTransferOut;
                    validTransferOutDoc.reference = codeFinishedGood;
                    validTransferOutDoc.sourceId = finishedGoodDoc.sourceId;
                    validTransferOutDoc.destinationId = finishedGoodDoc.destinationId;
                    validTransferOutDoc.items = [];
                    for (var item of finishedGoodDoc.items) {
                        for (var finishing of item.item.finishings) {
                            var newitem = {};
                            newitem.itemId = finishing.item._id;
                            newitem.quantity = finishing.quantity;
                            validTransferOutDoc.items.push(newitem);
                        }
                    }
                    validTransferOutDoc = new TransferOutDoc(validTransferOutDoc);
                    getMethods.push(this.transferOutDocManager.create(validTransferOutDoc));

                    //Create Transfer In
                    //Create Transfer Out 
                    Promise.all(getMethods)
                        .then(results => {
                            var transferInResultId = results[0];
                            var transferOutResultId = results[1];
                            getMethods = [];
                            //Create Promise Get Transfer In using ID
                            getMethods.push(this.transferInDocManager.getSingleByIdOrDefault(transferInResultId));
                            //Create Promise Get Transfer Out using ID
                            getMethods.push(this.transferOutDocManager.getSingleByIdOrDefault(transferOutResultId));

                            //Get Transfer In
                            //Get Transfer Out
                            Promise.all(getMethods)
                                .then(transferResults => {
                                    getMethods = [];
                                    var transferInData = transferResults[0];
                                    var transferOutData = transferResults[1];

                                    //Create Finishing Good Model
                                    var validFinishedGoodDoc = {};
                                    validFinishedGoodDoc.code = codeFinishedGood;
                                    validFinishedGoodDoc.transferInDocumentId = transferInResultId;
                                    validFinishedGoodDoc.transferInDocument = transferInData;
                                    validFinishedGoodDoc.transferOutDocumentId = transferOutResultId;
                                    validFinishedGoodDoc.transferOutDocument = transferOutData;
                                    validFinishedGoodDoc.storageId = finishedGoodDoc.sourceId;
                                    validFinishedGoodDoc = new FinishedGoodsDoc(validFinishedGoodDoc);

                                    //Create Finishing Good
                                    this.finishedGoodsDocCollection.insert(validFinishedGoodDoc)
                                        .then(id => {
                                            resolve(id);
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

    update(finishedGoodDoc) {
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    delete(finishedGoodDoc) {
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    _validate(finishedGoodDoc) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = finishedGoodDoc; 
            this.moduleManager.getByCode(moduleId)
                .then(module => {
                    var config = module.config; 
                    var getItemComponents = [];

                    if (!valid.sourceId || valid.sourceId == '')
                        errors["sourceId"] = "sourceId is required";
                    else {
                        if (config) {
                            if (config.source) {
                                var isAny = false;
                                if (config.source.type == "selection") {
                                    for (var sourceId of config.source.value) {
                                        if (sourceId.toString() == valid.sourceId.toString()) {
                                            isAny = true;
                                            break;
                                        }
                                    }
                                }
                                else {
                                    if (config.source.value.toString() == valid.sourceId.toString())
                                        isAny = true;
                                }
                                if (!isAny)
                                    errors["sourceId"] = "sourceId is not valid";
                            }
                        }
                    }

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
                    
                    if (!valid.items || valid.items.length == 0) {
                        errors["items"] = "items is required";
                    }
                    else {
                        var itemErrors = [];
                        for (var item of valid.items) {
                            var itemError = {};
                            if (!item.itemId || item.itemId == "") {
                                itemError["itemId"] = "itemId is required";
                            }
                            else {
                                for (var i = valid.items.indexOf(item) + 1; i < valid.items.length; i++) {
                                    var otherItem = valid.items[i];
                                    if (item.itemId == otherItem.itemId) {
                                        itemError["itemId"] = "itemId already exists on another detail";
                                    }
                                }
                                var itemError = {};
                                if (item.item) {
                                    if (!item.item.finishings || item.item.finishings.length == 0) {
                                        itemError["finishings"] = "Component is required";
                                    }
                                    else {
                                        var finishingErrors = [];
                                        for (var finishing of item.item.finishings) {
                                            var getItemComponent = Promise.resolve(null);
                                            var finishingError = {};
                                            if (!finishing.itemId || finishing.itemId == "") {
                                                finishingError["itemId"] = "Component ItemId is required";
                                            }
                                            else {
                                                for (var i = item.item.finishings.indexOf(finishing) + 1; i < item.item.finishings.length; i++) {
                                                    var otherItem = item.item.finishings[i];
                                                    if (finishing.itemId == otherItem.itemId) {
                                                        finishingError["itemId"] = "Component itemId already exists on another detail";
                                                    }
                                                }
                                            }
                                            if (finishing.quantity == undefined || (finishing.quantity && finishing.quantity == '')) {
                                                finishingError["quantity"] = "quantity is required";
                                            }
                                            else if (parseInt(finishing.quantity) <= 0) {
                                                finishingError["quantity"] = "quantity must be greater than 0";
                                            }
                                            else {
                                                getItemComponent = this.inventoryManager.getByStorageIdAndItemId(valid.sourceId, finishing.itemId);
                                            }
                                            getItemComponents.push(getItemComponent)
                                            finishingErrors.push(finishingError);
                                        }
                                        for (var finishingError of finishingErrors) {
                                            for (var prop in finishingError) {
                                                itemError.finishings = finishingErrors;
                                                break;
                                            }
                                            if (itemError.finishings)
                                                break;
                                        }
                                    }
                                }
                                for (var prop in itemError) {
                                    itemError["item"] = itemError;
                                    break;
                                }
                            }
                            if (item.quantity == undefined || (item.quantity && item.quantity == '')) {
                                itemError["quantity"] = "quantity is required";
                            }
                            else if (parseInt(item.quantity) <= 0) {
                                itemError["quantity"] = "quantity must be greater than 0";
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
                    }
                    for (var prop in errors) {
                        var ValidationError = require('../../validation-error');
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    Promise.all(getItemComponents)
                        .then(itemComponents => {
                            var itemErrors = [];
                            for (var item of valid.items) {
                                var itemError = {};
                                var itemError = {};
                                var finishingErrors = [];
                                var index = 0;
                                for (var finishing of item.item.finishings) {
                                    var finishingError = {};
                                    if (itemComponents[index]) {
                                        if (finishing.quantity > itemComponents[index].quantity) {
                                            finishingError["quantity"] = "Quantity is bigger than Stock";
                                        }
                                    }
                                    index++;
                                    finishingErrors.push(finishingError);
                                }
                                for (var finishingError of finishingErrors) {
                                    for (var prop in finishingError) {
                                        itemError.finishings = finishingErrors;
                                        break;
                                    }
                                    if (itemError.finishings)
                                        break;
                                }
                                for (var prop in itemError) {
                                    itemError["item"] = itemError;
                                    break;
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
                            for (var prop in errors) {
                                var ValidationError = require('../../validation-error');
                                reject(new ValidationError('data does not pass validation', errors));
                            }
                            resolve(valid);
                        })
                })
                .catch(e => {
                    reject(new Error(`Unable to load module:${moduleId}`));
                });
        });
    }
};