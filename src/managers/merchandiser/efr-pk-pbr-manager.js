'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;
var generateCode = require('../../utils/code-generator');

var SPKDoc = BateeqModels.merchandiser.SPK;
var SPKItem = BateeqModels.merchandiser.SPKItem;

var moduleId = "EFR-PK/PBR";

module.exports = class SPKBarangJadiReturManager {
    constructor(db, user) {
        this.db = db;
        this.user = user;
        this.SPKDocCollection = this.db.use(map.merchandiser.SPKDoc);
        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var ItemManager = require('../master/item-manager');
        this.itemManager = new ItemManager(db, user);

        var InventoryManager = require('../inventory/inventory-manager');
        this.inventoryManager = new InventoryManager(db, user);

        var ModuleManager = require('../core/module-manager');
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


            this.SPKDocCollection
                .where(query)
                .page(_paging.page, _paging.size)
                .orderBy(_paging.order, _paging.asc)
                .execute()
                .then(spkDoc => {
                    resolve(spkDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleById(id) {
        return new Promise((resolve, reject) => {
            if (id === '')
                resolve(null);
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleByQuery(query)
                .then(spkDoc => {
                    resolve(spkDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByIdOrDefault(id) {
        return new Promise((resolve, reject) => {
            if (id === '')
                resolve(null);
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleByQueryOrDefault(query)
                .then(spkDoc => {
                    resolve(spkDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByQuery(query) {
        return new Promise((resolve, reject) => {
            this.SPKDocCollection
                .single(query)
                .then(spkDoc => {
                    resolve(spkDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getSingleByQueryOrDefault(query) {
        return new Promise((resolve, reject) => {
            this.SPKDocCollection
                .singleOrDefault(query)
                .then(spkDoc => {
                    resolve(spkDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }


    create(spkDoc) {
        return new Promise((resolve, reject) => {
            this._validate(spkDoc)
                .then(validSpkDoc => {
                    validSpkDoc.code = generateCode(moduleId);
                    validSpkDoc.packingList = generateCode('EFR-KB/PBR');
                    var date = new Date();
                    var password = (generateCode(("0" + date.getDate()).slice(-2))).split('/').join('');
                    validSpkDoc.password = password;
                    this.SPKDocCollection.insert(validSpkDoc)
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

    createDraft(spkDoc) {
        return new Promise((resolve, reject) => {
            spkDoc.isDraft = true;
            this.create(spkDoc)
                .then(id => {
                    resolve(id);
                })
                .catch(e => {
                    reject(e);
                })
        });
    }

    updateDraft(spkDoc) {
        return new Promise((resolve, reject) => {
            spkDoc.isDraft = true;
            this.update(spkDoc)
                .then(id => {
                    resolve(id);
                })
                .catch(e => {
                    reject(e);
                })
        });

    }

    update(spkDoc) {
        return new Promise((resolve, reject) => {
            this._validate(spkDoc)
                .then(validSpkDoc => {
                    this.SPKDocCollection.update(validSpkDoc)
                        .then(id => {
                            resolve(id);
                        })
                        .catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    reject(e);
                })
        });
    }

    updateNotDraft(spkDoc) {
        return new Promise((resolve, reject) => {
            spkDoc.isDraft = false;
            this.update(spkDoc)
                .then(id => {
                    resolve(id);
                })
                .catch(e => {
                    reject(e);
                })
        });

    }

    delete(spkDoc) {
        return new Promise((resolve, reject) => {
            this._validate(spkDoc)
                .then(validSpkDoc => {
                    validSpkDoc._deleted = true;
                    this.SPKDocCollection.update(validSpkDoc)
                        .then(id => {
                            resolve(id);
                        })
                        .catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    reject(e);
                })
        });
    }

    _validate(spkDoc) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = spkDoc;
            this.moduleManager.getByCode(moduleId)
                .then(module => {
                    // 1. begin: Declare promises.
                    var getSPKDoc = this.SPKDocCollection.singleOrDefault({
                        "$and": [{
                            _id: {
                                '$ne': new ObjectId(valid._id)
                            }
                        }, {
                                code: valid.code
                            }]
                    });
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

                    var getDestination = this.storageManager.getSingleByIdOrDefault(valid.destinationId);
                    var getSource = this.storageManager.getSingleByIdOrDefault(valid.sourceId);

                    var getItem = [];

                    if (valid.items && valid.items.length > 0) {
                        for (var item of valid.items) {
                            // getItems.push(this.itemManager.getSingleByIdOrDefault(item.articleVariantId));
                            getItem.push(this.inventoryManager.getByStorageIdAndItemIdOrDefault(valid.sourceId, item.articleVariantId))
                        }
                    }
                    else {
                        errors["items"] = "items is required";
                    }
                    Promise.all([getSPKDoc, getDestination, getSource].concat(getItem))
                        .then(results => {
                            var _spkDoc = results[0];
                            var destination = results[1];
                            var source = results[2];

                            if (!destination) {
                                errors["destinationId"] = "destinationId in storage is not found";
                            } else {
                                valid.destinationId = destination._id;
                                valid.destination = destination;
                            }

                            if (!source) {
                                errors["sourceId"] = "sourceId in storage is not found";
                            }
                            else {
                                valid.sourceId = source._id;
                                valid.source = source;
                            }

                            if (valid._id == '') {
                                var getSPKDoc = this.SPKDocCollection.where(valid._id);
                                if (getSPKDoc.isDraft == false) {
                                    errors["isDraft"] = "this doc can not update because status not draft";
                                }
                            }

                            if (valid.date == "mm/dd/yyyy" || valid.date == "" || valid.date == undefined) {
                                errors["date"] = "date is required";
                            }

                            var inventoryItems = results.slice(3, results.length);
                            // 2a. begin: Validate error on item level.
                            if (inventoryItems.length >0 ) {
                                var itemErrors = [];
                                for (var inventoryItem of inventoryItems) {
                                    var index = inventoryItems.indexOf(inventoryItem);
                                    var item = valid.items[index];
                                    var itemError = {};

                                    if (!item.articleVariantId || item.articleVariantId == '') {
                                        itemError["articleVariantId"] = "articleVariantId is required";
                                    }
                                    if (inventoryItems[index] != null) {
                                        if (!inventoryItem.articleVariantId) {
                                            itemError["articleVariantId"] = "articleVariantId not found";
                                        }
                                        else {
                                            item.articleVariantId = inventoryItem.articleVariantId;
                                            item.articleVariant = inventoryItem.articleVariant;
                                        }
                                    }

                                    if (item.quantity == undefined || (item.quantity && item.quantity == '')) {
                                        itemError["quantity"] = "quantity is required";
                                    }
                                    else if (parseInt(item.quantity) <= 0) {
                                        itemError["quantity"] = "quantity must be greater than 0";
                                    }

                                    if (inventoryItems[index] == null) {
                                        var inventoryQuantity = 0;
                                    } else {
                                        var inventoryQuantity = inventoryItems[index].quantity;
                                    }
                                    if (item.quantity > inventoryQuantity) {
                                        itemError["quantity"] = "Tidak bisa simpan jika Quantity Pengiriman > Quantity Stock";
                                    }

                                    itemErrors.push(itemError);
                                }
                                // 2a. end: Validate error on item level.
                                // 2b. add item level errors to parent error, if any.
                                for (var itemError of itemErrors) {
                                    for (var prop in itemError) {
                                        errors.items = itemErrors;
                                        break;
                                    }
                                    if (errors.items)
                                        break;
                                }
                            }

                            // 2c. begin: check if data has any error, reject if it has.
                            for (var prop in errors) {
                                var ValidationError = require('../../validation-error');
                                reject(new ValidationError('data does not pass validation', errors));
                            }
                            valid = new SPKDoc(valid);
                            valid.stamp(this.user.username, 'manager');
                            resolve(valid)
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

};