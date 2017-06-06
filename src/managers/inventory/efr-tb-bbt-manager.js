'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;
var generateCode = require('../../utils/code-generator');

var TransferInDoc = BateeqModels.inventory.TransferInDoc;
var TransferInItem = BateeqModels.inventory.TransferInItem;

const moduleId = "EFR-TB/BBT";

module.exports = class TokoTerimaBarangBaruManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.inventory.TransferInDoc);
        this.spkDocCollection = this.db.use(map.merchandiser.SPKDoc);

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

        var SPKManager = require('../merchandiser/efr-pk-manager');
        this.spkManager = new SPKManager(db, user);
    }

    readPendingSPK(paging) {
        var _paging = Object.assign({
            page: 1,
            size: 20,
            order: '_id',
            asc: true
        }, paging);

        return new Promise((resolve, reject) => {
            var deleted = {
                _deleted: false
            }, keywordFilter = {};

            var regex = new RegExp("EFR\-PK/\PBJ|EFR\-PK/\PBR", "i");
            var filterCode = {
                'code': {
                    '$regex': regex
                },
                // 'expeditionDocumentId': { "$ne": {} }
            };
            var destination;
            if (Object.getOwnPropertyNames(paging.filter).length != 0) {
                destination =
                    {
                        "destination.code":
                        {
                            $in: paging.filter
                        }
                    }
            }

            var isReceived = {
                isReceived: false
            };

            if (paging.keyword) {
                var regex = new RegExp(paging.keyword, "i");

                var filterPackingList = {
                    'packingList': {
                        '$regex': regex
                    }
                };
                keywordFilter = {
                    '$or': [filterPackingList]
                };
            }

            var query = {
                $and: [
                    deleted,
                    filterCode,
                    isReceived,
                    destination,
                    keywordFilter
                ]
            }

            this.spkDocCollection
                .where(query)
                .page(_paging.page, _paging.size)
                .orderBy(_paging.order, _paging.asc)
                .execute()
                .then(spkDocs => {
                    resolve(spkDocs);
                })
                .catch(e => {
                    reject(e);
                });
        });
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
    getById(id) {
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

    getByIdOrDefault(id) {
        return new Promise((resolve, reject) => {
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleOrDefaultByQuery(query)
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
            this.collection
                .single(query)
                .then(transferInDoc => {
                    resolve(transferInDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getSingleOrDefaultByQuery(query) {
        return new Promise((resolve, reject) => {
            this.collection
                .singleOrDefault(query)
                .then(transferInDoc => {
                    resolve(transferInDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getPendingSPKById(id) {
        return new Promise((resolve, reject) => {
            var query = {
                _id: new ObjectId(id),
                _deleted: false,
                isReceived: false
            };
            this.spkDocCollection.singleOrDefault(query)
                .then(SPKDoc => {
                    SPKDoc.password = '';
                    SPKDoc._id = undefined;
                    resolve(SPKDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    create(transferInDoc) {
        return new Promise((resolve, reject) => {
            this._validate(transferInDoc)
                .then(validTransferInDoc => {
                    validTransferInDoc.code = generateCode(moduleId);

                    //kaga transfer in yang qty 0
                    var length = validTransferInDoc.items.length;
                    for (var i = 0; i < length;) {
                        var item = validTransferInDoc.items[i];
                        if (item.quantity == 0) {
                            validTransferInDoc.items.splice(i, 1);
                        }
                        else {
                            i++
                        }
                        length = validTransferInDoc.items.length;
                    }

                    this.transferInDocManager.create(validTransferInDoc)
                        .then(id => {
                            var reference = transferInDoc.reference;
                            this.spkManager.updateReceivedByRef(reference)
                                .then(result => {
                                    resolve(id);
                                }).catch(e => {
                                    reject(e);
                                });
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

    update(transferInDoc) {
        return new Promise((resolve, reject) => {
            this._validate(transferInDoc)
                .then(validTransferInDoc => {
                    this.transferInDocManager.update(validTransferInDoc)
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

    delete(transferInDoc) {
        return new Promise((resolve, reject) => {
            this._validate(transferInDoc)
                .then(validTransferInDoc => {
                    validTransferInDoc._deleted = true;
                    this.transferInDocManager.update(validTransferInDoc)
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

    _validate(transferInDoc) {
        var errors = {};
        return new Promise((resolve, reject) => {
            this.spkManager.getByReference(transferInDoc.reference).
                then(spkDoc => {
                    if (spkDoc) {
                        if (transferInDoc.password != spkDoc.password) {
                            errors["password"] = "invalid password";
                        }
                        if (transferInDoc.reference == "") {
                            errors["reference"] = "reference is required";
                        }
                        if (transferInDoc.items.length <= 0) {
                            errors["items"] = "no item(s) to transfer in";
                        }
                        if (spkDoc.sourceId.toString() != transferInDoc.sourceId.toString()) {
                            errors["sourceId"] = "invalid sourceId";
                        }
                        if (spkDoc.destinationId.toString() != transferInDoc.destinationId.toString()) {
                            errors["destinationId"] = "invalid destinationId";
                        }
                        if (spkDoc.isReceived) {
                            errors["isReceived"] = "this reference already received";
                        }
                        var index = 0;
                        var itemErrors = [];
                        for (var item of transferInDoc.items) {
                            var itemError = {};
                            if (item.quantity < 0)
                                itemError["quantity"] = "items should not less than 0 quantity";
                            else
                                if (item.quantity != spkDoc.items[index].quantity)
                                    if (item.remark == "")
                                        itemError["remark"] = "Masukkan no referensi berita acara";
                            index++;
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
                            var ValidationError = require('module-toolkit').ValidationError;
                            reject(new ValidationError('data does not pass validation', errors));
                        }
                    }
                    else {
                        errors["reference"] = "reference not found";
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }
                    resolve(transferInDoc);
                })
                .catch(e => {
                    reject(e);
                })
        });
    }
};