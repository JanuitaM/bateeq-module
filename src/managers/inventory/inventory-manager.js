'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;
var BaseManager = require('module-toolkit').BaseManager;
var Inventory = BateeqModels.inventory.Inventory;
var InventoryMovement = BateeqModels.inventory.InventoryMovement;


module.exports = class InventoryManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.inventory.Inventory);
        this.inventoryMovementCollection = this.db.use(map.inventory.InventoryMovement);

        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var ItemManager = require('../master/item-manager');
        this.itemManager = new ItemManager(db, user);

        var InventoryMovementManager = require('./inventory-movement-manager');
        this.inventoryMovementManager = new InventoryMovementManager(db, user);
    }

    _getQuery(paging) {
        var deletedFilter = {
            _deleted: false
        }, keywordFilter = {};

        var query = {};
        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");

            var filterItemCode = {
                'item.code': {
                    '$regex': regex
                }
            };
            var filterItemName = {
                'item.name': {
                    '$regex': regex
                }
            };
            var filterStorageName = {
                'storage.name': {
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

    readByStorageId(storageId, paging) {
        var _paging = Object.assign({
            page: 1,
            size: 20,
            order: '_id',
            asc: true
        }, paging);
        return new Promise((resolve, reject) => {
            var sorting = {
                "_createdDate": -1
            };
            var deleted = {
                _deleted: false
            };
            var storage = {
                storageId: new ObjectId(storageId)
            };
            var query = {
                '$and': [deleted, storage]
            };

            if (_paging.keyword) {
                _paging.keyword = (_paging.keyword.replace('(', '\\(')).replace(')', '\\)');
                var regex = new RegExp(_paging.keyword, "i");
                var filterCode = {
                    'item.code': {
                        '$regex': regex
                    }
                };
                var filterName = {
                    'item.name': {
                        '$regex': regex
                    }
                };
                var $or = {
                    '$or': [filterCode, filterName]
                };

                query['$and'].push($or);
            }

            var _select = ["storageId", "itemId", "item.code", "item.name", "quantity"];


            this.collection
                .where(query)
                .select(_select)
                .order(sorting)
                .execute()
                .then((results) => {
                    resolve(results);
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
                .then(inventory => {
                    resolve(inventory);
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
                .then(inventory => {
                    resolve(inventory);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getByStorageIdAndItemId(storageId, itemId) {
        return new Promise((resolve, reject) => {
            if (storageId === '' || itemId === '')
                resolve(null);
            var query = {
                storageId: new ObjectId(storageId),
                itemId: new ObjectId(itemId),
                _deleted: false
            };
            this.getSingleByQueryOrDefault(query)
                .then(inventory => {
                    resolve(inventory);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }


    getByStorageIdAndItemIdOrDefault(storageId, itemId) {
        return new Promise((resolve, reject) => {
            if (storageId === '' || itemId === '')
                resolve(null);
            var query = {
                storageId: new ObjectId(storageId),
                itemId: new ObjectId(itemId),
                _deleted: false
            };
            this.getSingleByQueryOrDefault(query)
                .then(inventory => {
                    resolve(inventory);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByQuery(query) {
        return new Promise((resolve, reject) => {
            this.collection
                .single(query)
                .then(inventory => {
                    resolve(inventory);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getSingleByQueryOrDefault(query) {
        return new Promise((resolve, reject) => {
            this.collection
                .singleOrDefault(query)
                .then(inventory => {
                    resolve(inventory);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    create(inventory) {
        return new Promise((resolve, reject) => {
            this._validate(inventory)
                .then(validInventory => {
                    validInventory._createdDate = new Date();
                    this.collection.insert(validInventory)
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

    update(inventory) {
        return new Promise((resolve, reject) => {
            this._validate(inventory)
                .then(validInventory => {
                    this.collection.update(validInventory)
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

    delete(inventory) {
        return new Promise((resolve, reject) => {
            this._validate(inventory)
                .then(validInventory => {
                    validInventory._deleted = true;
                    this.collection.update(validInventory)
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

    getInventory(storageId, itemId) {
        var query = {
            '$and': [{
                storageId: new ObjectId(storageId)
            }, {
                itemId: new ObjectId(itemId)
            }, {
                _deleted: false
            }]
        };

        return new Promise((resolve, reject) => {
            this.collection
                .singleOrDefault(query)
                .then(inventory => {
                    if (inventory)
                        resolve(inventory);
                    else {
                        var newInventory = new Inventory({
                            storageId: new ObjectId(storageId),
                            itemId: new ObjectId(itemId)
                        });
                        this.create(newInventory)
                            .then(docId => {
                                this.collection
                                    .single({
                                        _id: docId
                                    })
                                    .then(inventory => {
                                        resolve(inventory);
                                    })
                                    .catch(e => {
                                        reject(e);
                                    });
                            })
                            .catch(e => {
                                reject(e);
                            });
                    }
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    out(storageId, refNo, itemId, quantity, remark) {
        var absQuantity = Math.abs(quantity);
        return this.move(storageId, refNo, 'OUT', itemId, absQuantity * -1, remark);
    }

    in(storageId, refNo, itemId, quantity, remark) {
        var absQuantity = Math.abs(quantity);
        return this.move(storageId, refNo, 'IN', itemId, absQuantity, remark);
    }

    move(storageId, refNo, type, itemId, quantity, remark) {
        return new Promise((resolve, reject) => {
            this.getInventory(storageId, itemId)
                .then(inventory => {
                    var originQuantity = inventory.quantity;
                    var movement = new InventoryMovement({
                        inventoryId: inventory._id,
                        data: new Date(),
                        reference: refNo,
                        type: type,
                        storageId: inventory.storageId,
                        itemId: inventory.itemId,
                        before: originQuantity,
                        quantity: quantity,
                        after: originQuantity + quantity,
                        remark: remark
                    });

                    inventory.quantity += quantity;

                    var updateInventory = this.update(inventory);
                    var createMovement = this.inventoryMovementManager.create(movement);

                    Promise.all([createMovement, updateInventory])
                        .then(results => {
                            var movementId = results[0];
                            var inventoryId = results[1];

                            resolve(movementId);
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

    _validate(inventory) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = new Inventory(inventory);
            var getStorage = this.storageManager.getSingleById(inventory.storageId);
            var getItem = this.itemManager.getSingleById(inventory.itemId);

            Promise.all([getStorage, getItem])
                .then(results => {
                    var storage = results[0];
                    var item = results[1];

                    if (!valid.storageId || valid.storageId == '')
                        errors["storageId"] = "storageId is required";
                    if (!storage) {
                        errors["storageId"] = "storageId not found";
                    }
                    else {
                        valid.storageId = storage._id;
                        valid.storage = storage;
                    }
                    if (!valid.itemId || valid.itemId == '')
                        errors["itemId"] = "itemId is required";
                    if (!item) {
                        errors["itemId"] = "itemId not found";
                    }
                    else {
                        valid.itemId = item._id;
                        valid.item = item;
                    }

                    if (valid.quantity == undefined || (valid.quantity && valid.quantity == '')) {
                        errors["quantity"] = "quantity is required";
                    }
                    else if (parseInt(valid.quantity) < 0) {
                        errors["quantity"] = "quantity must be greater than 0";
                    }

                    // 2c. begin: check if data has any error, reject if it has.
                    for (var prop in errors) {
                        var ValidationError = require('../../validation-error');
                        reject(new ValidationError('data does not pass validation', errors));
                    }
                    valid.stamp(this.user.username, 'manager');
                    resolve(valid)
                })
                .catch(e => {
                    reject(e);
                });
        });
    }
};