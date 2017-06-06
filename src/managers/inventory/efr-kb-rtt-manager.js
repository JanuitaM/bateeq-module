'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var generateCode = require('../../utils/code-generator');
var map = BateeqModels.map;
var BaseManager = require('module-toolkit').BaseManager;
var ExpeditionDoc = BateeqModels.inventory.ExpeditionDoc;
var TransferOutDoc = BateeqModels.inventory.TransferOutDoc;
var TransferOutItem = BateeqModels.inventory.TransferOutItem;
var TransferInDoc = BateeqModels.inventory.TransferInDoc;
var TransferInItem = BateeqModels.inventory.TransferInItem;
var SPKDoc = BateeqModels.merchandiser.SPK;
var SPKItem = BateeqModels.merchandiser.SPKItem;


const moduleId = "EFR-KB/RTT";
const modulePackingList = "EFR-KB/PLR";
module.exports = class TokoTransferStokManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.inventory.TransferOutDoc);
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

        var SPKManager = require('../merchandiser/efr-pk-manager');
        this.spkManager = new SPKManager(db, user);

        // var PusatBarangBaruKirimBarangJadiAksesorisManager = require('./efr-kb-exb-manager');
        // this.pusatBarangBaruKirimBarangJadiAksesorisManager = new PusatBarangBaruKirimBarangJadiAksesorisManager(db, user);

    }

    readAll(paging) {
        var _paging = Object.assign({
            page: 1,
            size: 20,
            order: {},
            filter: {},
            select: []
        }, paging);

        var sorting = {
            "date": 1
        };

        return this._createIndexes()
            .then((createIndexResults) => {
                var query = this._getQuery(_paging);
                return this.collection
                    .where(query)
                    .order(sorting)
                    .execute()
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

    create(transferOutDoc) {
        return new Promise((resolve, reject) => {
            this._validate(transferOutDoc)
                .then(validTransferOutDoc => {
                    validTransferOutDoc.code = generateCode(moduleId);
                    this.storageManager.getByCode("GDG.01")
                        .then(storage => {
                            var transferOutDoc1 = {};
                            transferOutDoc1.code = generateCode("EFR-KB/RTT");
                            transferOutDoc1.destination = validTransferOutDoc.destination;
                            transferOutDoc1.destinationId = validTransferOutDoc.destinationId;
                            transferOutDoc1.items = validTransferOutDoc.items;
                            transferOutDoc1.reference = validTransferOutDoc.reference;
                            transferOutDoc1.source = validTransferOutDoc.source;
                            transferOutDoc1.sourceId = validTransferOutDoc.source._id;
                            this.transferOutDocManager.create(transferOutDoc1)
                                .then(id => {
                                    this.getSingleById(id)
                                        .then(rtt => {
                                            var spkDocGdg = {};
                                            var validspkDocGdg;
                                            var packingList1;
                                            spkDocGdg.code = generateCode("EFR-PK/PBJ");
                                            spkDocGdg.source = validTransferOutDoc.source;
                                            spkDocGdg.sourceId = validTransferOutDoc.source._id;
                                            spkDocGdg.destination = storage[0];
                                            spkDocGdg.destinationId = storage[0]._id;
                                            spkDocGdg.items = validTransferOutDoc.items;
                                            spkDocGdg.packingList = generateCode(modulePackingList);
                                            packingList1 = spkDocGdg.packingList;
                                            spkDocGdg.isDraft = false;
                                            spkDocGdg.isReceived = true;
                                            spkDocGdg.reference = rtt.code;
                                            var date = new Date();
                                            var passwordGdg = (generateCode(("0" + date.getDate()).slice(-2))).split('/').join('');
                                            spkDocGdg.password = passwordGdg;
                                            validspkDocGdg = spkDocGdg;
                                            validspkDocGdg._createdDate = date;
                                            validspkDocGdg = new SPKDoc(validspkDocGdg);
                                            validspkDocGdg.stamp(this.user.profile.firstname, 'manager');

                                            var transferinDoc = {};
                                            transferinDoc.code = generateCode("EFR-TB/BRT");
                                            transferinDoc.source = validTransferOutDoc.source;
                                            transferinDoc.sourceId = validTransferOutDoc.source._id;
                                            transferinDoc.destination = storage[0];
                                            transferinDoc.destinationId = storage[0]._id;;
                                            transferinDoc.items = validTransferOutDoc.items;
                                            transferinDoc.reference = packingList1;

                                            var PlSPK;
                                            var spkDoc = {};
                                            var validspkDoc;
                                            spkDoc.code = generateCode("EFR-PK/PBJ");
                                            spkDoc.source = storage[0];
                                            spkDoc.sourceId = storage[0]._id;
                                            spkDoc.destination = validTransferOutDoc.destination;
                                            spkDoc.destinationId = validTransferOutDoc.destination._id;
                                            spkDoc.items = validTransferOutDoc.items;
                                            spkDoc.packingList = generateCode(modulePackingList);
                                            PlSPK = spkDoc.packingList;
                                            spkDoc.isDraft = false;
                                            spkDoc.isReceived = false;
                                            spkDoc.reference = rtt.code;
                                            var password = (generateCode(("0" + date.getDate()).slice(-2))).split('/').join('');
                                            spkDoc.password = password;
                                            validspkDoc = spkDoc;
                                            validspkDoc._createdDate = date;
                                            validspkDoc = new SPKDoc(validspkDoc);
                                            validspkDoc.stamp(this.user.username, 'manager');

                                            var spk2;
                                            var transferStok = [];
                                            transferStok.push(this.SPKDocCollection.insert(validspkDocGdg))
                                            transferStok.push(this.transferInDocManager.create(transferinDoc));
                                            Promise.all(transferStok)
                                                .then(id => {
                                                    this.SPKDocCollection.insert(validspkDoc)
                                                        .then(idSPK2 => {
                                                            this.spkManager.getSingleById(idSPK2)
                                                                .then(spk => {
                                                                    spk2 = {};
                                                                    spk2 = spk;
                                                                    var ekspedisiDoc = {};
                                                                    var eksCode;
                                                                    var validEkspedisiDoc;
                                                                    ekspedisiDoc.code = generateCode("EFR-KB/EXP");
                                                                    eksCode = ekspedisiDoc.code;
                                                                    ekspedisiDoc.expedition = "Dikirim Sendiri";
                                                                    validEkspedisiDoc = ekspedisiDoc;
                                                                    validEkspedisiDoc = new ExpeditionDoc(validEkspedisiDoc);
                                                                    validEkspedisiDoc.weight = 1;
                                                                    validEkspedisiDoc.spkDocuments.push(spk2);
                                                                    validEkspedisiDoc._createdDate = date;
                                                                    validEkspedisiDoc.stamp(this.user.username, 'manager');

                                                                    var transferOutDoc = {};
                                                                    transferOutDoc.code = eksCode;
                                                                    transferOutDoc.destination = validTransferOutDoc.destination;
                                                                    transferOutDoc.destinationId = validTransferOutDoc.destinationId;
                                                                    transferOutDoc.items = validTransferOutDoc.items;
                                                                    transferOutDoc.reference = PlSPK;
                                                                    transferOutDoc.source = storage[0];
                                                                    transferOutDoc.sourceId = storage[0]._id;
                                                                    this.expeditionDocCollection.insert(validEkspedisiDoc)
                                                                        .then(id => {
                                                                            this.transferOutDocManager.create(transferOutDoc)
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

                    // var getDestination = this.storageManager.getSingleByIdOrDefault(valid.destinationId);
                    // var getSource = this.storageManager.getSingleByIdOrDefault(valid.sourceId);

                    var getItem = [];
                    if (valid.items && valid.items.length > 0) {
                        for (var item of valid.items) {
                            getItem.push(this.inventoryManager.getByStorageIdAndItemIdOrDefault(valid.sourceId, item.itemId))
                        }
                    }
                    else {
                        errors["items"] = "items is required";
                    }

                    // Promise.all([getDestination, getSource].concat(getItem))
                    Promise.all([].concat(getItem))
                        .then(results => {
                            var index = 0;
                            var inventoryQuantity = 0;
                            // var destination = results[0];
                            // var source = results[1];

                            // if (!destination) {
                            //     errors["destinationId"] = "destinationId in storage is not found";
                            // } else {
                            //     valid.destinationId = destination._id;
                            //     valid.destination = destination;
                            // }

                            // if (!source) {
                            //     errors["sourceId"] = "sourceId in storage is not found";
                            // }
                            // else {
                            //     valid.sourceId = source._id;
                            //     valid.source = source;
                            // }
                            var items = results.slice(0, results.length);
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
                        });
                })
                .catch(e => {
                    reject(e);
                });
        });
    }
};



