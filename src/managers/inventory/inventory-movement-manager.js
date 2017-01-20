'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;

var InventoryMovement = BateeqModels.inventory.InventoryMovement;


module.exports = class InventoryMovementManager {
    constructor(db, user) {
        this.db = db;
        this.user = user;
        this.inventoryMovementCollection = this.db.use(map.inventory.InventoryMovement);

        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var ItemManager = require('../master/item-manager');
        this.itemManager = new ItemManager(db, user);
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
                var $or = {
                    '$or': [filterItemName, filterStorageName]
                };

                query['$and'].push($or);
            }


            this.inventoryMovementCollection
                .where(query)
                .page(_paging.page, _paging.size)
                .orderBy(_paging.order, _paging.asc)
                .execute()
                .then(inventoryMovements => {
                    resolve(inventoryMovements);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    readByStorageIdAndItemId(storageId, itemId, paging) {
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
            var storage = {
                storageId: new ObjectId(storageId)
            };
            var item = {
                itemId: new ObjectId(itemId)
            };
            var query = {
                '$and': [deleted, storage, item]
            };

            if (_paging.keyword) {
                var regex = new RegExp(_paging.keyword, "i");
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
                var $or = {
                    '$or': [filterItemName, filterStorageName]
                };

                query['$and'].push($or);
            }


            this.inventoryMovementCollection
                .where(query)
                .page(_paging.page, _paging.size)
                .orderBy(_paging.order, _paging.asc)
                .execute()
                .then(inventoryMovements => {
                    resolve(inventoryMovements);
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
                .then(inventoryMovement => {
                    resolve(inventoryMovement);
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
                .then(inventoryMovement => {
                    resolve(inventoryMovement);
                })
                .catch(e => {
                    reject(e);
                });
        });
    } 
    
    getByStorageIdAndItemIdAndId(storageId, itemId, id) {
        return new Promise((resolve, reject) => {
            if (id === ''|| storageId ==='' || itemId ==='')
                resolve(null);
            var query = {
                _id: new ObjectId(id),
                storageId: new ObjectId(storageId),
                itemId: new ObjectId(itemId),
                _deleted: false
            };
            this.getSingleByQuery(query)
                .then(inventoryMovement => {
                    resolve(inventoryMovement);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }
    
    getByStorageIdAndItemIdAndIdOrDefault(storageId, itemId, id) {
        return new Promise((resolve, reject) => {
            if (id === ''|| storageId ==='' || itemId ==='')
                resolve(null);
            var query = {
                _id: new ObjectId(id),
                storageId: new ObjectId(storageId),
                itemId: new ObjectId(itemId),
                _deleted: false
            };
            this.getSingleByQueryOrDefault(query)
                .then(inventoryMovement => {
                    resolve(inventoryMovement);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }
    
    getSingleByQuery(query) {
        return new Promise((resolve, reject) => {
            this.inventoryMovementCollection
                .single(query)
                .then(inventoryMovement => {
                    resolve(inventoryMovement);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }
    
    getSingleByQueryOrDefault(query) {
        return new Promise((resolve, reject) => {
            this.inventoryMovementCollection
                .singleOrDefault(query)
                .then(inventoryMovement => {
                    resolve(inventoryMovement);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    create(inventoryMovement) {
        return new Promise((resolve, reject) => {
            this._validate(inventoryMovement)
                .then(validInventoryMovement => {
                    validInventoryMovement._createdDate = new Date();
                    this.inventoryMovementCollection.insert(validInventoryMovement)
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

    update(inventoryMovement) {
        return new Promise((resolve, reject) => {
            this._validate(inventoryMovement)
                .then(validInventoryMovement => {
                    this.inventoryMovementCollection.update(validInventoryMovement)
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

    delete(inventoryMovement) {
        return new Promise((resolve, reject) => {
            this._validate(inventoryMovement)
                .then(validInventoryMovement => {
                    validInventoryMovement._deleted = true;
                    this.inventoryMovementCollection.update(validInventoryMovement)
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
    
    _validate(inventoryMovement) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = inventoryMovement;
            var getStorage = this.storageManager.getSingleById(inventoryMovement.storageId);
            var getItem = this.itemManager.getSingleById(inventoryMovement.itemId);
 
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
                     
                    if (!valid.type || valid.type == '')
                        errors["type"] = "type is required";  
                        
                    if (valid.date == undefined || (valid.date && valid.date == '')) {
                        errors["date"] = "date is required";
                    }  
                        
                    if (valid.quantity == undefined || (valid.quantity && valid.quantity == '')) {
                        errors["quantity"] = "quantity is required";
                    }
                    // else if (parseInt(valid.quantity) <= 0) {
                    //     errors["quantity"] = "quantity must be greater than 0";
                    // }
                    
                    if (valid.before == undefined || (valid.before && valid.before == '')) {
                        errors["before"] = "before is required";
                    }
                    else if (parseInt(valid.before) < 0) {
                        errors["before"] = "before must be greater than 0";
                    }
                    
                    if (valid.after == undefined || (valid.after && valid.after == '')) {
                        errors["after"] = "after is required";
                    }
                    else if (parseInt(valid.after) < 0) {
                        errors["after"] = "after must be greater than 0";
                    }
                    
                     // 2c. begin: check if data has any error, reject if it has.
                    for (var prop in errors) {
                        var ValidationError = require('module-toolkit').ValidationError;
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