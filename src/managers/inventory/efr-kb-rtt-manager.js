'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var generateCode = require('../../utils/code-generator');
var map = BateeqModels.map;
var ExpeditionDoc = BateeqModels.inventory.ExpeditionDoc;
var TransferOutDoc = BateeqModels.inventory.TransferOutDoc;
var TransferOutItem = BateeqModels.inventory.TransferOutItem;
var TransferInDoc = BateeqModels.inventory.TransferInDoc;
var TransferInItem = BateeqModels.inventory.TransferInItem;
var SPKDoc = BateeqModels.merchandiser.SPK;
var SPKItem = BateeqModels.merchandiser.SPKItem;


const moduleId = "EFR-KB/RTT";
const modulePackingList = "EFR-KB/PBR";
module.exports = class TokoTransferStokManager {
    constructor(db, user) {
        this.db = db;
        this.user = user;
        this.transferOutDocCollection = this.db.use(map.inventory.TransferOutDoc);
        this.expeditionDocCollection = this.db.use(map.inventory.ExpeditionDoc);
        this.SPKDocCollection = this.db.use(map.merchandiser.SPKDoc);

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

        var TransferInDocManager = require('./transfer-in-doc-manager');
        this.transferInDocManager = new TransferInDocManager(db, user);


        // var PusatReturTokoTerimaBarangReturManager = require('./efr-tb-brt-manager');
        // this.pusatReturTokoTerimaBarangReturManager = new PusatReturTokoTerimaBarangReturManager(db, user);

        // var SPKBarangJadiReturManager = require('../merchandiser/efr-pk-pbr-manager');
        // this.spkBarangJadiReturManager = new SPKBarangJadiReturManager(db, user);

        // var PusatBarangBaruKirimBarangJadiAksesorisManager = require('./efr-kb-exb-manager');
        // this.pusatBarangBaruKirimBarangJadiAksesorisManager = new PusatBarangBaruKirimBarangJadiAksesorisManager(db, user);

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
                    // this.storageManager.getByCode("PST-3")
                    this.storageManager.getByCode(validTransferOutDoc.destination.code)
                        .then(storage => {
                            var transferinDoc = {};
                            transferinDoc.code = generateCode("EFR-TB/BRT");
                            transferinDoc.source = validTransferOutDoc.source;
                            transferinDoc.sourceId = validTransferOutDoc.sourceId;
                            transferinDoc.destination = storage;
                            transferinDoc.destinationId = storage._id;
                            transferinDoc.items = validTransferOutDoc.items;
                            transferinDoc.reference = validTransferOutDoc.code;

                            var spkDoc = {};
                            var validspkDoc;
                            spkDoc.code = generateCode("EFR-PK/PBR");
                            spkDoc.source = storage;
                            spkDoc.sourceId = storage._id;
                            spkDoc.destination = validTransferOutDoc.destination;
                            spkDoc.destinationId = validTransferOutDoc.destinationId;
                            spkDoc.items = validTransferOutDoc.items;
                            spkDoc.packingList = generateCode(modulePackingList);
                            spkDoc.isDraft = false;
                            spkDoc.isReceived = false;
                            spkDoc.reference = validTransferOutDoc.code;
                            var date = new Date();
                            var password = (generateCode(("0" + date.getDate()).slice(-2))).split('/').join('');
                            spkDoc.password = password;
                            validspkDoc = spkDoc;
                            validspkDoc = new SPKDoc(validspkDoc);
                            validspkDoc.stamp(this.user.username, 'manager');

                            var ekspedisiDoc = {};
                            var validEkspedisiDoc;
                            ekspedisiDoc.code = generateCode("EFR-KB/EXB");
                            ekspedisiDoc.expedition = "Dikirim Sendiri"; 
                            validEkspedisiDoc = ekspedisiDoc;
                            validEkspedisiDoc = new ExpeditionDoc(validEkspedisiDoc); 
                            validEkspedisiDoc.weight = 0; 
                            // ekspedisiDoc.transferOutDocuments.destination = validTransferOutDoc.destination;
                            // ekspedisiDoc.transferOutDocuments.destinationId = validTransferOutDoc.destinationId; 
                            validEkspedisiDoc.stamp(this.user.username, 'manager');


                            var transferOutDoc = {};
                            transferOutDoc.code = generateCode("EFR-KB/EXB");
                            transferOutDoc.destination = validTransferOutDoc.destination;
                            transferOutDoc.destinationId = validTransferOutDoc.destinationId;
                            transferOutDoc.items = validTransferOutDoc.items;
                            transferOutDoc.reference = generateCode(modulePackingList);
                            transferOutDoc.source = storage;
                            transferOutDoc.sourceId = storage._id;

                            this.transferOutDocManager.create(validTransferOutDoc)
                                .then(id => {
                                    this.transferInDocManager.create(transferinDoc);
                                    this.SPKDocCollection.insert(validspkDoc);
                                    this.expeditionDocCollection.insert(validEkspedisiDoc);
                                    this.transferOutDocManager.create(transferOutDoc);
                                    resolve(id);
                                })
                                .catch(e => {
                                    reject(e);
                                })
                        })
                        .catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    reject(e);
                })
        })

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

                    var getDestination = this.storageManager.getSingleByIdOrDefault(valid.destinationId);
                    var getSource = this.storageManager.getSingleByIdOrDefault(valid.sourceId);

                    var getItem = [];
                    if (valid.items && valid.items.length > 0) {
                        for (var item of valid.items) {
                            getItem.push(this.inventoryManager.getByStorageIdAndItemIdOrDefault(valid.sourceId, item.itemId))
                        }
                    }
                    else {
                        errors["items"] = "items is required";
                    }

                    Promise.all([getDestination, getSource].concat(getItem))
                        .then(results => {
                            var itemErrors = [];
                            var itemError = {};

                            var destination = results[0];
                            var source = results[1];

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
                            var inventoryItems = results.slice(2, results.length);
                            if (inventoryItems[0] != null) {
                                for (var inventoryItem of inventoryItems) {
                                    var index = inventoryItems.indexOf(inventoryItem);
                                    var item = valid.items[index];
                                    if (inventoryItems[index] == null) {
                                        var inventoryQuantity = 0;
                                    } else {
                                        item.itemId = inventoryItem.itemId;
                                        item.item = inventoryItem.item;
                                        var inventoryQuantity = inventoryItems[index].quantity;
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
                                var ValidationError = require('../../validation-error');
                                reject(new ValidationError('data does not pass validation', errors));
                            }
                            resolve(valid);
                        }).catch(e => {
                            reject(e);
                        });
                })
                .catch(e => {
                    reject(e);
                });
        });
    }
};



