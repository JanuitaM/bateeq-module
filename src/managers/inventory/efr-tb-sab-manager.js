'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;

var TransferInDoc = BateeqModels.inventory.TransferInDoc;
var TransferInItem = BateeqModels.inventory.TransferInItem;
var Item = BateeqModels.master.Item;
var generateCode = require('../../utils/code-generator');

const moduleId = "EFR-TB/SAB";
module.exports = class FinishingTerimaKomponenManager {
    constructor(db, user) {
        this.db = db;
        this.user = user;
        this.transferInDocCollection = this.db.use(map.inventory.TransferInDoc);
        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var ItemManager = require('../master/item-manager');
        this.itemManager = new ItemManager(db, user);

        var InventoryManager = require('./inventory-manager');
        this.inventoryManager = new InventoryManager(db, user);

        var TransferInDocManager = require('./transfer-in-doc-manager');
        this.transferInDocManager = new TransferInDocManager(db, user);

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
                .then(transferInDoc => {
                    resolve(transferInDoc);
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
        })
    }

    create(transferInDoc) {
        return new Promise((resolve, reject) => {
            //Validate Model Input
            this._validate(transferInDoc)
                .then(validTransferInDoc => {
                    //Generate Code  
                    validTransferInDoc.code = generateCode(moduleId);
                    //Create Components to Article Variant if dont Any
                    this._validateFinishingVariant(validTransferInDoc)
                        .then(readyTransferInDoc => {
                            //Update Article Variant, add Finishings object
                            this._appendItem(readyTransferInDoc)
                            .then(latestTransferInDoc => {
                                    // Create View Model to Transfer In
                                    var getTransferIns = [];
                                    var valid = latestTransferInDoc;
                                    var NewTransferInDoc = {};
                                    NewTransferInDoc.sourceId = valid.sourceId;
                                    NewTransferInDoc.destinationId = valid.destinationId;
                                    NewTransferInDoc.code = valid.code;
                                    NewTransferInDoc.reference = valid.reference;
                                    NewTransferInDoc.items = [];
                                    for (var item of valid.items) {
                                        for (var finishing of item.item.finishings) {
                                            if (finishing.quantity > 0) {
                                                var item = {};
                                                item.itemId = finishing.item._id;
                                                item.quantity = finishing.quantity;
                                                NewTransferInDoc.items.push(item);
                                            }
                                        }
                                    }
                                    NewTransferInDoc = new TransferInDoc(NewTransferInDoc);
                                    //Create Transfer In
                                    this.transferInDocManager.create(NewTransferInDoc)
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

    update(transferInDoc) {
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    delete(transferInDoc) {
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    _validate(transferInDoc) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = transferInDoc;
            this.moduleManager.getByCode(moduleId)
                .then(module => {
                    var config = module.config;

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
                                            var finishingError = {};
                                            if (!finishing.itemId || finishing.itemId == "") {
                                                //finishingError["itemId"] = "Component ItemId is required";
                                            }
                                            else {
                                                for (var i = item.item.finishings.indexOf(finishing) + 1; i < item.item.finishings.length; i++) {
                                                    var otherItem = item.item.finishings[i];
                                                    if (finishing.itemId == otherItem.itemId) {
                                                        finishingError["itemId"] = "Component itemId already exists on another detail";
                                                    }
                                                }
                                            }

                                            if (!finishing.item.name || finishing.item.name == "") {
                                                finishingError["itemId"] = "Component ItemId is required";
                                            }

                                            if (finishing.quantity == undefined || (finishing.quantity && finishing.quantity == '')) {
                                                finishingError["quantity"] = "quantity is required";
                                            }
                                            else if (parseInt(finishing.quantity) < 0) {
                                                finishingError["quantity"] = "quantity must be greater 0";
                                            }

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

                    resolve(valid);
                })
                .catch(e => {
                    reject(new Error(`Unable to load module:${moduleId}`));
                });
        });
    }

    _validateFinishingVariant(transferInDoc) {
        return new Promise((resolve, reject) => {
            var valid = transferInDoc;
            var getFinishings = [];
            for (var item of valid.items) {
                for (var finishing of item.item.finishings) {
                    if (!finishing.itemId || finishing.itemId == "") {
                        var now = new Date();
                        var stamp = now / 1000 | 0;
                        var code = stamp.toString(36);

                        //finishing.item = {};
                        finishing.item.code = code;
                        finishing.item.size = "Component";
                        finishing.item.description = "Component Finishings";
                        finishing.item = new Item(finishing.item);
                        getFinishings.push(this.itemManager.create(finishing.item));
                    }
                    else {
                        getFinishings.push(Promise.resolve(null));
                    }
                }
            }
            Promise.all(getFinishings)
                .then(results => {
                    var index = 0;
                    for (var item of valid.items) {
                        for (var finishing of item.item.finishings) {
                            if (!finishing.itemId || finishing.itemId == "") {
                                finishing.item._id = results[index];
                                finishing.itemId = results[index];
                                finishing.item = new Item;
                                (finishing.item);
                            }
                            index++;
                        }
                    }
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    _appendItem(transferInDoc) {
        return new Promise((resolve, reject) => {
            var valid = transferInDoc;
            var getItems = [];
            for (var item of valid.items) {
                var av = new Item(item.item);
                getItems.push(this.itemManager.update(av));
            }
            Promise.all(getItems)
                .then(results => {
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }
};
