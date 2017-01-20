'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;

var SPKDoc = BateeqModels.merchandiser.SPK;
var SPKItem = BateeqModels.merchandiser.SPKItem;

var moduleId = "EFR-PK/PBA";

module.exports = class SPKBarangManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.SPKDocCollection = this.db.use(map.merchandiser.SPKDoc);
        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var ItemManager = require('../master/item-manager');
        this.itemManager = new ItemManager(db, user);

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
                var filterPackingList = {
                    'packingList': {
                        '$regex': regex
                    }
                };
                var $or = {
                    '$or': [filterCode, filterPackingList]
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

    readReceived(paging) {
        var _paging = Object.assign({
            page: 1,
            size: 20,
            order: '_id',
            asc: true
        }, paging);

        return new Promise((resolve, reject) => {
            var filter = {
                _deleted: false,
                isReceived: true
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
                var filterPackingList = {
                    'packingList': {
                        '$regex': regex
                    }
                };
                var $or = {
                    '$or': [filterCode, filterPackingList]
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

    readNotReceived(paging) {
        var _paging = Object.assign({
            page: 1,
            size: 20,
            order: '_id',
            asc: true
        }, paging);

        return new Promise((resolve, reject) => {
            var filter = {
                _deleted: false,
                isReceived: false,
                expeditionDocumentId: {}
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
                var filterPackingList = {
                    'packingList': {
                        '$regex': regex
                    }
                };
                var $or = {
                    '$or': [filterCode, filterPackingList]
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

    getByReference(ref) {
        return new Promise((resolve, reject) => {
            var query = {
                packingList: ref,
                _deleted: false
            };
            this.SPKDocCollection.singleOrDefault(query)
                .then(SPKDoc => {
                    resolve(SPKDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getByPL(packingList) {
        return new Promise((resolve, reject) => {
            var query = {
                packingList: packingList,
                _deleted: false
            };
            this.SPKDocCollection.singleOrDefault(query)
                .then(SPKDoc => {
                    resolve(SPKDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getByPackingList(ref) {
        return new Promise((resolve, reject) => {
            var query = {
                packingList: ref,
                _deleted: false,
                isReceived: true
            };
            this.SPKDocCollection.singleOrDefault(query)
                .then(SPKDoc => {
                    resolve(SPKDoc);
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
            resolve(spkDoc);
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



    updateReceivedByRef(ref) {
        return new Promise((resolve, reject) => {
            this.getByReference(ref)
                .then(spkDoc => {
                    spkDoc.isReceived = true;
                    this.SPKDocCollection.update(spkDoc).then(id => {
                        resolve(id);
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

    delete(spkDoc) {
        return new Promise((resolve, reject) => {
            resolve(spkDoc);
        });
    }

    _validate(spkDoc) {
        return new Promise((resolve, reject) => {
            resolve(spkDoc);
        });
    }

};