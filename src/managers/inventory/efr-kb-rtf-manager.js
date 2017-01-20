'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var generateCode = require('../../utils/code-generator');
var map = BateeqModels.map;

var TransferOutDoc = BateeqModels.inventory.TransferOutDoc;
var TransferOutItem = BateeqModels.inventory.TransferOutItem;

const moduleId = "EFR-KB/RTF";

module.exports = class PusatReturTokoKirimBarangReturManager {
    constructor(db, user) {
        this.db = db;
        this.user = user;
        this.transferOutDocCollection = this.db.use(map.inventory.TransferOutDoc);
        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var ItemManager = require('../master/item-manager');
        this.itemManager = new ItemManager(db, user);

        var InventoryManager = require('./inventory-manager');
        this.inventoryManager = new InventoryManager(db, user);

        var TrasferOutManager = require('./transfer-out-doc-manager');
        this.transferOutDocManager = new TrasferOutManager(db, user);

        var ModuleManager = require('../master/module-manager');
        this.moduleManager = new ModuleManager(db, user);

        var TokoKirimBarangReturnManager = require('../inventory/efr-kb-rtp-manager');
        this.tokoKirimBarangReturnManager = new TokoKirimBarangReturnManager(db, user);
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

    getSingleByIdOrDefault(id) {
        return new Promise((resolve, reject) => {
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleByQueryOrDefault(query)
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
        })
    }

    getSingleByQueryOrDefault(query) {
        return new Promise((resolve, reject) => {
            this.transferOutDocCollection
                .singleOrDefault(query)
                .then(transferOutDoc => {
                    resolve(transferOutDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
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
            var getKbRtp; 
            if (!valid.sourceId || valid.sourceId == '')
                errors["sourceId"] = "sourceId is required";

            if (!valid.destinationId || valid.destinationId == '')
                errors["destinationId"] = "destinationId is required";

            if (!valid.reference) {
                errors["reference"] = "reference is required";
            }
            else {
                getKbRtp = this.tokoKirimBarangReturnManager.getByCodeOrDefault(valid.reference);
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
            Promise.all([getKbRtp].concat(getItem))
                .then(results => { 
                    var itemErrors = [];
                    var dataKbRtp = results[0];
                    if (!dataKbRtp) {
                        errors["reference"] = "reference not found";
                    }
                    var inventoryItems = results.slice(1, results.length)
                    if (inventoryItems.length > 0) {
                        
                        for (var inventoryItem of inventoryItems) {
                            var index = inventoryItems.indexOf(inventoryItem);
                            var item = valid.items[index];
                            var itemError = {};
                            
                            if (item.quantity == undefined || item.quantity == "") {
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
                }).catch(e => {
                    reject(e);
                })
        });
    }
}; 