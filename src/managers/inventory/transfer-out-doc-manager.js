'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;

var TransferOutDoc = BateeqModels.inventory.TransferOutDoc;
var TransferOutItem = BateeqModels.inventory.TransferOutItem;


module.exports = class TransferOutDocManager {
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
                    validTransferOutDoc._createdDate = new Date();
                    var tasks = [this.transferOutDocCollection.insert(validTransferOutDoc)];
                    
                    for (var item of validTransferOutDoc.items) {
                        tasks.push(this.inventoryManager.out(validTransferOutDoc.sourceId, validTransferOutDoc.code, item.itemId, item.quantity, item.remark))
                    }

                    Promise.all(tasks)
                        .then(results => {
                            var id = results[0];
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
                    this.transferOutDocCollection.update(validTransferOutDoc)
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

    delete(transferOutDoc) {
        return new Promise((resolve, reject) => {
            this._validate(transferOutDoc)
                .then(validTransferOutDoc => {
                    validTransferOutDoc._deleted = true;
                    this.transferOutDocCollection.update(validTransferOutDoc)
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

            // 1. begin: Declare promises.
            var getTransferOutDoc = this.transferOutDocCollection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                        code: valid.code
                    }]
            });
            // 1. end: Declare promises.

            var getSource = this.storageManager.getSingleByIdOrDefault(transferOutDoc.sourceId);
            var getDestination = this.storageManager.getSingleByIdOrDefault(transferOutDoc.destinationId);
            var getItems = [];

            if (valid.items && valid.items.length > 0) {
                for (var item of valid.items) {
                    getItems.push(this.itemManager.getSingleByIdOrDefault(item.itemId));
                }
            }
            else {
                errors["items"] = "items is required";
            }

            Promise.all([getTransferOutDoc, getSource, getDestination].concat(getItems))
                .then(results => {
                    var _transferOutDoc = results[0];
                    var source = results[1];
                    var destination = results[2]; 
                    
                    if (!valid.code || valid.code == '')
                        errors["code"] = "code is required";
                    else if (_transferOutDoc) {
                        errors["code"] = "code already exists";
                    }

                    if (!valid.sourceId || valid.sourceId == '')
                        errors["sourceId"] = "sourceId is required";
                    if (!source) {
                        errors["sourceId"] = "sourceId not found";
                    }
                    else {
                        valid.sourceId = source._id;
                        valid.source = source;
                    }

                    if (!valid.destinationId || valid.destinationId == '')
                        errors["destinationId"] = "destinationId is required";
                    if (!destination) {
                        errors["destinationId"] = "destinationId not found";
                    }
                    else {
                        valid.destinationId = destination._id;
                        valid.destination = destination;
                    } 
                    var items = results.slice(3, results.length)
                    // 2a. begin: Validate error on item level.
                    if (items.length > 0) {
                        var itemErrors = [];
                        for (var variant of items) {
                            var index = items.indexOf(variant);
                            var item = valid.items[index];
                            var itemError = {};

                            if (!item.itemId || item.itemId == '') {
                                itemError["itemId"] = "itemId is required";
                            }
                            else {
                                for (var i = valid.items.indexOf(item) + 1; i < valid.items.length; i++) {
                                    var otherItem = valid.items[i];
                                    if (item.itemId == otherItem.itemId) {
                                        itemError["itemId"] = "itemId already exists on another detail";
                                    }
                                }
                            }
                            if (!variant) {
                                itemError["itemId"] = "itemId not found";
                            }
                            else {
                                item.itemId = variant._id;
                                item.item = variant;
                            }

                            if (item.quantity == undefined || (item.quantity && item.quantity == '')) {
                                itemError["quantity"] = "quantity is required";
                            }
                            else if (parseInt(item.quantity) <= 0) {
                                itemError["quantity"] = "quantity must be greater than 0";
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
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }
                    valid = new TransferOutDoc(valid);
                    valid.stamp(this.user.username, 'manager');
                    resolve(valid)
                })
                .catch(e => {
                    reject(e);
                });
        }); 
    } 
}; 