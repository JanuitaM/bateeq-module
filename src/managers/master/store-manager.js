'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var StorageManager = require('../master/storage-manager');
var BateeqModels = require('bateeq-models');
var Store = BateeqModels.master.Store;
var Storage = BateeqModels.master.Storage;
var map = BateeqModels.map;
//var generateCode = require('../../utils/code-generator');

module.exports = class StoreManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.master.Store);
        this.storageManager = new StorageManager(db, user);
    }

    _createIndexes() {
        var dateIndex = {
            name: `ix_${map.master.Store}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        };

        var codeIndex = {
            name: `ix_${map.master.Store}_code`,
            key: {
                code: 1
            },
            unique: true
        };

        return this.collection.createIndexes([dateIndex, codeIndex]);
    }

    _getQuery(paging) {
        var basicFilter = {
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
            var filterName = {
                'name': {
                    '$regex': regex
                }
            };

            keywordFilter = {
                '$or': [filterCode, filterName]
            };
        }
        query = { '$and': [basicFilter, paging.filter, keywordFilter] };
        return query;
    }

    _validate(store) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = store;
            // 1. begin: Declare promises.
            var getStore = this.collection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                    code: valid.code
                }]
            });

            var getStorage = !ObjectId.isValid(valid.storageId) ? Promise.resolve(null) : this.storageManager.getSingleById(valid.storageId);
            // 1. end: Declare promises.

            // 2. begin: Validation.
            Promise.all([getStore, getStorage])
                .then(results => {
                    var _store = results[0];
                    var _storage = results[1];

                    // if (!_storage)
                    //     errors["storageId"] = "storage is invalid";

                    if (!valid.code || valid.code == '')
                        errors["code"] = "code is required";
                    else if (_store) {
                        errors["code"] = "code already exists";
                    }

                    if (!valid.name || valid.name == '')
                        errors["name"] = "name is required";

                    if (!valid.address || valid.address == '')
                        errors["address"] = "address is required";

                    if (!valid.phone || valid.phone == '')
                        errors["phone"] = "phone is required";

                    if (!valid.salesCapital)
                        errors["salesCapital"] = "Sales Capital is required";
                    else if (valid.salesCapital <= 0)
                        errors["salesCapital"] = "Sales Capital must be greater than 0";

                    // 2c. begin: check if data has any error, reject if it has.
                    for (var prop in errors) {
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    if (_storage) {
                        valid.storageId = _storage._id;
                        valid.storage = _storage;
                    }

                    valid = new Store(valid);
                    valid.stamp(this.user.username, 'manager');
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    create(data) {
        var _storeId, _storageId;
        return new Promise((resolve, reject) => {
            super.create(data)
                .then(id => {
                    _storeId = id;
                    this.getSingleById(id)
                        .then(store => {
                            var storage = new Storage();
                            storage.code = store.code;
                            storage.name = store.name;
                            storage.description = `storage for store ${store.code}`;
                            storage.address = store.address;
                            storage.phone = store.phone;

                            this.storageManager.create(storage)
                                .then(storageId => {
                                    _storageId = storageId;
                                    this.storageManager.getSingleById(storageId)
                                        .then(storage => {
                                            store.storageId = storageId;
                                            store.storage = storage;
                                            this.update(store)
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
                })
                .catch(e => {
                    var p = [];
                    if (_storeId)
                        p.push(this._delete(_storeId));
                    if (_storageId)
                        p.push(this.storageManager._delete(_storageId));

                    Promise.all(p)
                        .then(results => {
                            reject(e);
                        })
                        .catch(e => {
                            reject(e);
                        });
                });
        });
    }
};
