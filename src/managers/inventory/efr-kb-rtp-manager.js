'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var generateCode = require('../../utils/code-generator');
var map = BateeqModels.map;
var BaseManager = require('module-toolkit').BaseManager;
var TransferOutDoc = BateeqModels.inventory.TransferOutDoc;
var TransferOutItem = BateeqModels.inventory.TransferOutItem;

var moduleId = "EFR-KB/RTP";

module.exports = class TokoKirimBarangReturnManager extends BaseManager {
    constructor(db, user) {
        super(db,user);
        this.collection = this.db.use(map.inventory.TransferOutDoc);
        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var ItemManager = require('../master/item-manager');
        this.itemManager = new ItemManager(db, user);

        var InventoryManager = require('./inventory-manager');
        this.inventoryManager = new InventoryManager(db, user);

        var TransferOutDocManager = require('./transfer-out-doc-manager');
        this.transferOutDocManager = new TransferOutDocManager(db, user);

        var ModuleManager = require('../master/module-manager');
        this.moduleManager = new ModuleManager(db, user);

        var SPKBarangManager = require('../merchandiser/efr-pk-manager');
        this.spkBarangManager = new SPKBarangManager(db, user);
    } 
    
    _getQuery(paging) {
        var deletedFilter = {
            _deleted: false
        }, keywordFilter = {};

        var query = {};
        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");

            var filterCode = {
                'code': {
                    '$regex': regex
                }
            };
            keywordFilter = {
                '$or': [filterCode]
            };
        }
        query = { '$and': [deletedFilter, paging.filter, keywordFilter] }
        return query;
    } 

    create(transferOutDoc) {
        return new Promise((resolve, reject) => {
            this._validate(transferOutDoc)
                .then(validTransferOutDoc => {
                    validTransferOutDoc.code = generateCode(moduleId);
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
                })

        });
    }

    update(transferOutDoc) {
        return new Promise((resolve, reject) => {
            this._validate(transferOutDoc)
                .then(validTransferOutDoc => {
                    this.transferOutDocManager.update(validTransferOutDoc)
                        .then(id => {
                            resolve(id);
                        })
                        .catch(ex => {
                            reject(ex);
                        })
                })
                .catch(e => {
                    reject(e);
                })
        });
    }

    delete(transferOutDoc) {
        return new Promise((resolve, reject) => {
            this._validate(transferOutDoc)
                .then(validTransferOutDoc => {
                    validTransferOutDoc._deleted = true;
                    this.transferOutDocManager.update(validTransferOutDoc)
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

   _validate(transferOutDoc) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = transferOutDoc;
            var getSpk;
            this.moduleManager.getByCode(moduleId)
                .then(module => {
                    var config = module.config;
                    if (!valid.sourceId || valid.sourceId == '')
                        errors["sourceId"] = "sourceId is required";

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
                    if (!valid.reference) {
                        //errors["reference"] = "reference is required";
                    }
                    else {
                        getSpk = this.spkBarangManager.getByReference(valid.reference);
                    }
                    var getItem = [];
                    if (valid.items && valid.items.length > 0) {
                        for (var item of valid.items) {
                            getItem.push(this.inventoryManager.getByStorageIdAndItemIdOrDefault(valid.sourceId, item.itemId))
                        }
                    }
                    else {
                        errors["items"] = "items is required";
                    }
                    Promise.all([getSpk].concat(getItem))
                        .then(results => {
                            var index = 0;
                            var inventoryQuantity = 0;

                            var dataSpk = results[0];
                            if (!dataSpk) {
                                //errors["reference"] = "Referensi Tidak Ditemukan";
                            }
                            var items = results.slice(1, results.length)
                            if (items.length > 0) {
                                var itemErrors = [];
                                for (var item of valid.items) {
                                    var itemError = {};
                                    if (items[index] == null) {
                                        inventoryQuantity = 0;
                                    } else {
                                        inventoryQuantity = items[index].quantity;
                                    }
                                    index++;
                                    if (item.quantity > inventoryQuantity) {
                                        itemError["quantity"] = "Tidak bisa simpan jika Quantity Pengiriman > Quantity Stock";
                                    }
                                    itemErrors.push(itemError);
                                }
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
                                var ValidationError = require('module-toolkit').ValidationError;
                                reject(new ValidationError('data does not pass validation', errors));
                            }
                            resolve(valid);
                        }).catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    reject(e);
                });
        });
    }
}; 