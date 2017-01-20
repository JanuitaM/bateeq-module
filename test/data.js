var helper = require('./helper');


function getSertStorages(db) {

    var storages = [{
        code: "UT-FNG",
        name: "Finishing[UT]",
        description: "Unit test data: finishing storage."
    }, {
        code: "UT-BJB",
        name: "Pusat - Finished Goods[UT]",
        description: "Unit test data: finished goods storage."
    }, {
        code: "UT-BJR",
        name: "Pusat - Return Finished Goods[UT]",
        description: "Unit test data: returned finished goods storage."
    }, {
        code: "UT-ACC",
        name: "Accessories[UT]",
        description: "Unit test data: accessories storage."
    }, {
        code: "UT-SWG",
        name: "Sewing[UT]",
        description: "Unit test data: sewing storage."
    }, {
        code: "UT-MHD",
        name: "Merchandiser[UT]",
        description: "Unit test data: merhandiser storage."
    }, {
        code: "UT-ST1",
        name: "Store 01[UT]",
        description: "Unit test data: store 01 storage"
    }, {
        code: "UT-ST2",
        name: "Store 02[UT]",
        description: "Unit test data: store 02 storage"
    }];


    var StorageManager = require("../src/managers/master/storage-manager");
    return new Promise((resolve, reject) => {
        var manager = new StorageManager(db, {
            username: "unit-test"
        });
        var promises = [];

        for (var storage of storages) {
            var promise = new Promise((resolve, reject) => {
                var _storage = storage;
                manager.getSingleByQueryOrDefault({
                        code: _storage.code
                    })
                    .then(data => {
                        if (data)
                            resolve(data);
                        else {
                            manager.create(_storage)
                                .then(id => {
                                    manager.getSingleById(id).then(createdData => {
                                        resolve(createdData);
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
            });
            promises.push(promise);
        }

        Promise.all(promises)
            .then(storages => {
                resolve(storages);
            })
            .catch(e => {
                reject(e);
            });
    });
}

function getSertItems(db) {

    var variants = [{
        code: "UT-AV1",
        name: "Silhouette S[UT]",
        description: "Unit test data: article silhoutte [S]",
        uom: "PCS",
        components:[]
        
    }, {
        code: "UT-AV2",
        name: "Dress Tumaruntum S[UT]",
        description: "Unit test data: article dress tumaruntum [S]",
        uom: "PCS",
        components:[]
    }];

    var VariantManager = require("../src/managers/master/item-manager");
    return new Promise((resolve, reject) => {
        var manager = new VariantManager(db, {
            username: "unit-test"
        });
        var promises = [];

        for (var variant of variants) {
            var promise = new Promise((resolve, reject) => {
                var _variant = variant;
                manager.getSingleByQueryOrDefault({
                        code: _variant.code
                    })
                    .then(data => {
                        if (data)
                            resolve(data);
                        else {
                            manager.create(_variant)
                                .then(id => {
                                    manager.getSingleById(id).then(createdData => {
                                        resolve(createdData);
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
            });
            promises.push(promise);
        }

        Promise.all(promises)
            .then(variants => {
                resolve(variants);
            })
            .catch(e => {
                reject(e);
            });
    });
}

function getSertFinishedGoods(db) { 
    var variants = [{
        code: "UT-FG1",
        name: "Silhouette S[UT]",
        description: "Unit test data: article silhoutte [S]",
        uom: "PCS",
        components:[],
        articleId: {},
        article: { 
            realizationOrder: "RO001"
        },
        size: 'S',
        domesticCOGS: 100000,
        domesticWholesale: 100000,
        domesticRetail: 100000,
        domesticSale: 100000, 
        internationalCOGS: 150000,
        internationalWholesale: 150000,
        internationalRetail: 150000,
        internationalSale: 150000 
    }, 
    {
        code: "UT-FG2",
        name: "Silhouette M[UT]",
        description: "Unit test data: article silhoutte [M]",
        uom: "PCS",
        components:[],
        articleId: {},
        article: { 
            realizationOrder: "RO001"
        },
        size: 'M',
        domesticCOGS: 100000,
        domesticWholesale: 100000,
        domesticRetail: 100000,
        domesticSale: 100000, 
        internationalCOGS: 150000,
        internationalWholesale: 150000,
        internationalRetail: 150000,
        internationalSale: 150000 
    }, 
    {
        code: "UT-FG3",
        name: "Dress Tumaruntum S[UT]",
        description: "Unit test data: article dress tumaruntum [S]",
        uom: "PCS",
        components:[],
        articleId: {},
        article: { 
            realizationOrder: "RO002"
        },
        size: 'S',
        domesticCOGS: 100000,
        domesticWholesale: 100000,
        domesticRetail: 100000,
        domesticSale: 100000, 
        internationalCOGS: 150000,
        internationalWholesale: 150000,
        internationalRetail: 150000,
        internationalSale: 150000 
    }];

    var Manager = require("../src/managers/master/finished-goods-manager");
    return new Promise((resolve, reject) => {
        var manager = new Manager(db, {
            username: "unit-test"
        });
        var promises = [];

        for (var variant of variants) {
            var promise = new Promise((resolve, reject) => {
                var _variant = variant;
                manager.getSingleByQueryOrDefault({
                        code: _variant.code
                    })
                    .then(data => {
                        if (data)
                            resolve(data);
                        else {
                            manager.create(_variant)
                                .then(id => {
                                    manager.getSingleById(id).then(createdData => {
                                        resolve(createdData);
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
            });
            promises.push(promise);
        }

        Promise.all(promises)
            .then(variants => {
                resolve(variants);
            })
            .catch(e => {
                reject(e);
            });
    });
}

function getSertModules(db, storages) {

    var modules = [{
        code: "EFR-HP/FNG",
        name: "Module EFR-HP/FNG",
        description: "Unit test data: module EFR-HP/FNG",
        config: {
            source: {
                type: "fixed",
                value: storages["UT-FNG"]._id
            },
            destination: {
                type: "fixed",
                value: storages["UT-FNG"]._id
            }
        }
    }, {
        code: "EFR-KB/EXB",
        name: "Module EFR-KB/EXB",
        description: "Unit test data: module EFR-KB/EXB",
        config: {
            destination: {
                type: "selection",
                value: [storages["UT-ST1"]._id, storages["UT-ST2"]._id]
            }
        }
    }, {
        code: "EFR-KB/FNG",
        name: "Module EFR-KB/FNG",
        description: "Unit test data: module EFR-KB/FNG",
        config: {
            source: {
                type: "fixed",
                value: storages["UT-FNG"]._id
            },
            destination: {
                type: "fixed",
                value: storages["UT-BJB"]._id
            }
        }
    }, {
        code: "EFR-KB/RTD",
        name: "Module EFR-KB/RTD",
        description: "Unit test data: module EFR-KB/RTD",
        config: {
            source: {
                type: "fixed",
                value: storages["UT-FNG"]._id
            },
            destination: {
                type: "fixed",
                value: storages["UT-BJR"]._id
            }
        }
    }, {
        code: "EFR-KB/RTF",
        name: "Module EFR-KB/RTF",
        description: "Unit test data: module EFR-KB/RTF",
        config: {}
    }, {
        code: "EFR-KB/RTP",
        name: "Module EFR-KB/RTP",
        description: "Unit test data: module EFR-KB/RTP",
        config: {
            source: {
              },
            destination: {
                type: "selection",
                value: [storages["UT-BJR"]._id , storages["UT-ST2"]._id, storages["UT-ST1"]._id]
            }
        }
    }, {
        code: "EFR-KB/RTT",
        name: "Module EFR-KB/RTT",
        description: "Unit test data: module EFR-KB/RTT",
        config: {
            source: {
                type: "selection",
                value: [storages["UT-ST1"]._id, storages["UT-ST2"]._id]
            },
            destination: {
                type: "selection",
                value: [storages["UT-ST1"]._id, storages["UT-ST2"]._id]
            }
        }
    }, {
        code: "EFR-TB/ACT",
        name: "Module EFR-TB/ACT",
        description: "Unit test data: module EFR-TB/ACT",
        config: {
            destination: {
                type: "fixed",
                value: storages["UT-ACC"]._id
            }
        }
    }, {
        code: "EFR-TB/BAT",
        name: "Module EFR-TB/BAT",
        description: "Unit test data: module EFR-TB/BAT",
        config: {}
    }, {
        code: "EFR-TB/BBT",
        name: "Module EFR-TB/BBT",
        description: "Unit test data: module EFR-TB/BBT",
        config: {}
    }, {
        code: "EFR-TB/BJB",
        name: "Module EFR-TB/BJB",
        description: "Unit test data: module EFR-TB/BJB",
        config: {}
    }, {
        code: "EFR-TB/BJR",
        name: "Module EFR-TB/BJR",
        description: "Unit test data: module EFR-TB/BJR",
        config: {}
    }, {
        code: "EFR-TB/BRD",
        name: "Module EFR-TB/BRD",
        description: "Unit test data: module EFR-TB/BRD",
        config: {}
    }, {
        code: "EFR-TB/BRT",
        name: "Module EFR-TB/BRT",
        description: "Unit test data: module EFR-TB/BRT",
        config: {}
    }, {
        code: "EFR-TB/SAB",
        name: "Module EFR-TB/SAB",
        description: "Unit test data: module EFR-TB/SAB",
        config: {
            source: {
                type: "selection",
                value: [storages["UT-ACC"]._id, storages["UT-SWG"]._id, storages["UT-MHD"]._id]
            },
            destination: {
                type: "fixed",
                value: storages["UT-FNG"]._id
            }
        }
    }, {
        code: "EFR-PK/PBA",
        name: "Module EFR-PK/PBA",
        description: "Unit test data: module EFR-PK/PBA",
        config: {
            source: {
                type: "selection",
                value: [storages["UT-ACC"]._id,  storages["UT-ST2"]._id]
            },
            destination: {
                type: "selection",
                value: [storages["UT-ST1"]._id, storages["UT-ST2"]._id]
            }
        }
    }, {
        code: "EFR-PK/PBJ",
        name: "Module EFR-PK/PBJ",
        description: "Unit test data: module EFR-PK/PBJ",
        config: {
            source: {
                type: "selection",
                value: [storages["UT-BJB"]._id, storages["UT-ST2"]._id]
            },
            destination: {
                type: "selection",
                value: [storages["UT-ST1"]._id, storages["UT-ST2"]._id]
            }
        }
    }, {
        code: "EFR-PK/PBR",
        name: "Module EFR-PK/PBR",
        description: "Unit test data: module EFR-HP/FNG",
        config: {
            source: {
                type: "selection",
                value: [storages["UT-BJR"]._id, , storages["UT-ST2"]._id]
            },
            destination: {
                type: "selection",
                value: [storages["UT-ST1"]._id, storages["UT-ST2"]._id]
            }
        }
    }, {
        code: "EFR-TB/ALT",
        name: "Module EFR-TB/ALT",
        description: "Unit test data: module EFR-TB/ALT",
        config: {
            source: {
                type: "fixed",
                value: storages["UT-SWG"]._id
            },
            destination: {
                type: "fixed",
                value: storages["UT-FNG"]._id
            }
        }
    }, {
        code: "EFR-KB/ALT",
        name: "Module EFR-KB/ALT",
        description: "Unit test data: module EFR-KB/ALT",
        config: {
            source: {
                type: "fixed",
                value: storages["UT-FNG"]._id
            },
            destination: {
                type: "fixed",
                value: storages["UT-SWG"]._id
            }
        }
    }];

    var ModuleManager = require("../src/managers/master/module-manager");
    return new Promise((resolve, reject) => {
        var manager = new ModuleManager(db, {
            username: "unit-test"
        });
        var promises = [];

        for (var module of modules) {
            var promise = new Promise((resolve, reject) => {
                var _module = module;
                manager.getSingleByQueryOrDefault({
                        code: _module.code
                    })
                    .then(data => {
                        if (data)
                            resolve(data);
                        else {
                            manager.create(_module)
                                .then(id => {
                                    manager.getSingleById(id).then(createdData => {
                                        resolve(createdData);
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
            });
            promises.push(promise);
        }

        Promise.all(promises)
            .then(variants => {
                resolve(variants);
            })
            .catch(e => {
                reject(e);
            });
    });
}

function getSertSuppliers(db) {
 var suppliers = [{
        code: "UT-S01",
        name: "Finishing[UT]",
        description: "Unit test data: supplier 01."
    }];

    var SupplierManager = require("../src/managers/master/supplier-manager");
    return new Promise((resolve, reject) => {
        var manager = new SupplierManager(db, {
            username: "unit-test"
        });
        var promises = [];

        for (var supplier of suppliers) {
            var promise = new Promise((resolve, reject) => {
                var _supplier = supplier;
                manager.getSingleByQueryOrDefault({
                        code: _supplier.code
                    })
                    .then(data => {
                        if (data)
                            resolve(data);
                        else {
                            manager.create(_supplier)
                                .then(id => {
                                    manager.getSingleById(id).then(createdData => {
                                        resolve(createdData);
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
            });
            promises.push(promise);
        }

        Promise.all(promises)
            .then(suppliers => {
                resolve(suppliers);
            })
            .catch(e => {
                reject(e);
            });
    });
}
 
function getSertStores(db, storages) {

    var stores = [{
        code: "ST-FNG",
        name: "Finishing[UT]",
        description: "Unit test data: finishing storage.",
        //storageId: storages["UT-FNG"]._id,
        //storage: storages["UT-FNG"],
        salesCategoryId: {},
        salesCategory: {},
        salesTarget: 5000000,
        address: "Address",
        phone: "123456789",
        salesCapital: "100000000",
        shifts: [{
            shift: 1,
            dateFrom: new Date("2000-01-01T00:00:00"),
            dateTo: new Date("2000-01-01T11:59:59")
        }, {
            shift: 2,
            dateFrom: new Date("2000-01-01T12:00:00"),
            dateTo: new Date("2000-01-01T23:59:59")
        }]
    }, {
        code: "ST-BJB",
        name: "Pusat - Finished Goods[UT]",
        description: "Unit test data: finished goods storage.",
        //storageId: storages["UT-BJB"]._id,
        //storage: storages["UT-BJB"],
        salesCategoryId: {},
        salesCategory: {},
        salesTarget: 5000000,
        address: "Address",
        phone: "123456789",
        salesCapital: "100000000",
        shifts: [{
            shift: 1,
            dateFrom: new Date("2000-01-01T00:00:00"),
            dateTo: new Date("2000-01-01T11:59:59")
        }, {
            shift: 2,
            dateFrom: new Date("2000-01-01T12:00:00"),
            dateTo: new Date("2000-01-01T23:59:59")
        }]
    }, {
        code: "ST-BJR",
        name: "Pusat - Return Finished Goods[UT]",
        description: "Unit test data: returned finished goods storage.",
        //storageId: storages["UT-BJR"]._id,
        //storage: storages["UT-BJR"],
        salesCategoryId: {},
        salesCategory: {},
        salesTarget: 5000000,
        address: "Address",
        phone: "123456789",
        salesCapital: "100000000",
        shifts: [{
            shift: 1,
            dateFrom: new Date("2000-01-01T00:00:00"),
            dateTo: new Date("2000-01-01T11:59:59")
        }, {
            shift: 2,
            dateFrom: new Date("2000-01-01T12:00:00"),
            dateTo: new Date("2000-01-01T23:59:59")
        }]
    }, {
        code: "ST-ACC",
        name: "Accessories[UT]",
        description: "Unit test data: accessories storage.",
        //storageId: storages["UT-ACC"]._id,
        //storage: storages["UT-ACC"],
        salesCategoryId: {},
        salesCategory: {},
        salesTarget: 5000000,
        address: "Address",
        phone: "123456789",
        salesCapital: "100000000",
        shifts: [{
            shift: 1,
            dateFrom: new Date("2000-01-01T00:00:00"),
            dateTo: new Date("2000-01-01T11:59:59")
        }, {
            shift: 2,
            dateFrom: new Date("2000-01-01T12:00:00"),
            dateTo: new Date("2000-01-01T23:59:59")
        }]
    }, {
        code: "ST-SWG",
        name: "Sewing[UT]",
        description: "Unit test data: sewing storage.",
        //storageId: storages["UT-SWG"]._id,
        //storage: storages["UT-SWG"],
        salesCategoryId: {},
        salesCategory: {},
        salesTarget: 5000000,
        address: "Address",
        phone: "123456789",
        salesCapital: "100000000",
        shifts: [{
            shift: 1,
            dateFrom: new Date("2000-01-01T00:00:00"),
            dateTo: new Date("2000-01-01T11:59:59")
        }, {
            shift: 2,
            dateFrom: new Date("2000-01-01T12:00:00"),
            dateTo: new Date("2000-01-01T23:59:59")
        }]
    }, {
        code: "ST-MHD",
        name: "Merchandiser[UT]",
        description: "Unit test data: merhandiser storage.",
        //storageId: storages["UT-MHD"]._id,
        //storage: storages["UT-MHD"],
        salesCategoryId: {},
        salesCategory: {},
        salesTarget: 5000000,
        address: "Address",
        phone: "123456789",
        salesCapital: "100000000",
        shifts: [{
            shift: 1,
            dateFrom: new Date("2000-01-01T00:00:00"),
            dateTo: new Date("2000-01-01T11:59:59")
        }, {
            shift: 2,
            dateFrom: new Date("2000-01-01T12:00:00"),
            dateTo: new Date("2000-01-01T23:59:59")
        }]
    }, {
        code: "ST-ST1",
        name: "Store 01[UT]",
        description: "Unit test data: store 01 storage",
        //storageId: storages["UT-ST1"]._id,
        //storage: storages["UT-ST1"],
        salesCategoryId: {},
        salesCategory: {},
        salesTarget: 5000000,
        address: "Address",
        phone: "123456789",
        salesCapital: "100000000",
        shifts: [{
            shift: 1,
            dateFrom: new Date("2000-01-01T00:00:00"),
            dateTo: new Date("2000-01-01T11:59:59")
        }, {
            shift: 2,
            dateFrom: new Date("2000-01-01T12:00:00"),
            dateTo: new Date("2000-01-01T23:59:59")
        }]
    }, {
        code: "ST-ST2",
        name: "Store 02[UT]",
        description: "Unit test data: store 02 storage",
        //storageId: storages["UT-ST2"]._id,
        //storage: storages["UT-ST2"],
        salesCategoryId: {},
        salesCategory: {},
        salesTarget: 5000000,
        address: "Address",
        phone: "123456789",
        salesCapital: "100000000",
        shifts: [{
            shift: 1,
            dateFrom: new Date("2000-01-01T00:00:00"),
            dateTo: new Date("2000-01-01T11:59:59")
        }, {
            shift: 2,
            dateFrom: new Date("2000-01-01T12:00:00"),
            dateTo: new Date("2000-01-01T23:59:59")
        }]
    }];


    var StoreManager = require("../src/managers/master/store-manager");
    return new Promise((resolve, reject) => {
        var manager = new StoreManager(db, {
            username: "unit-test"
        });
        var promises = [];

        for (var store of stores) {
            var promise = new Promise((resolve, reject) => {
                var _store = store;
                manager.getSingleByQueryOrDefault({
                        code: _store.code
                    })
                    .then(data => {
                        if (data)
                            resolve(data);
                        else {
                            manager.create(_store)
                                .then(id => {
                                    manager.getSingleById(id).then(createdData => {
                                        resolve(createdData);
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
            });
            promises.push(promise);
        }

        Promise.all(promises)
            .then(stores => {
                resolve(stores);
            })
            .catch(e => {
                reject(e);
            });
    });
}

function getSertBanks(db) {

    var banks = [{
        code: "BA-BCA",
        name: "Bank Central Asia",
        description: "Unit test data: BCA bank."
    }, {
        code: "BA-MANDIRI",
        name: "Mandiri",
        description: "Unit test data: Mandiri bank."
    }, {
        code: "BA-BRI",
        name: "Bank Rakyat Indonesia",
        description: "Unit test data: BRI bank."
    }];


    var BankManager = require("../src/managers/master/bank-manager");
    return new Promise((resolve, reject) => {
        var manager = new BankManager(db, {
            username: "unit-test"
        });
        var promises = [];

        for (var bank of banks) {
            var promise = new Promise((resolve, reject) => {
                var _bank = bank;
                manager.getSingleByQueryOrDefault({
                        code: _bank.code
                    })
                    .then(data => {
                        if (data)
                            resolve(data);
                        else {
                            manager.create(_bank)
                                .then(id => {
                                    manager.getSingleById(id).then(createdData => {
                                        resolve(createdData);
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
            });
            promises.push(promise);
        }

        Promise.all(promises)
            .then(banks => {
                resolve(banks);
            })
            .catch(e => {
                reject(e);
            });
    });
}
 
function getSertCardTypes(db) {

    var cardTypes = [{
        code: "CT-CARD",
        name: "CARD",
        description: "Unit test data: CARD card type."
    }, {
        code: "CT-VISA",
        name: "Visa",
        description: "Unit test data: Visa card type."
    }, {
        code: "CT-MASTERCARD",
        name: "Mastercard",
        description: "Unit test data: Mastercard card type."
    }];


    var CardTypeManager = require("../src/managers/master/card-type-manager");
    return new Promise((resolve, reject) => {
        var manager = new CardTypeManager(db, {
            username: "unit-test"
        });
        var promises = [];

        for (var cardType of cardTypes) {
            var promise = new Promise((resolve, reject) => {
                var _cardType = cardType;
                manager.getSingleByQueryOrDefault({
                        code: _cardType.code
                    })
                    .then(data => {
                        if (data)
                            resolve(data);
                        else {
                            manager.create(_cardType)
                                .then(id => {
                                    manager.getSingleById(id).then(createdData => {
                                        resolve(createdData);
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
            });
            promises.push(promise);
        }

        Promise.all(promises)
            .then(cardTypes => {
                resolve(cardTypes);
            })
            .catch(e => {
                reject(e);
            });
    });
}

module.exports = function(db) {
    return new Promise((resolve, reject) => {
        Promise.all([getSertStorages(db), getSertItems(db), getSertFinishedGoods(db), getSertSuppliers(db), getSertBanks(db), getSertCardTypes(db)])
            .then(results => {
                var storages = {};
                var items = {};
                var finishedGoods = {};
                var suppliers = {}; 
                var banks = {};
                var cardTypes = {};

                for (var storage of results[0])
                    storages[storage.code] = storage;

                for (var variant of results[1])
                    items[variant.code] = variant;
                    
                for (var variant of results[2])
                    finishedGoods[variant.code] = variant;
                
                for (var supplier of results[3])
                    suppliers[supplier.code] = supplier; 
                    
                for (var bank of results[4])
                    banks[bank.code] = bank;
                    
                for (var cardType of results[5])
                    cardTypes[cardType.code] = cardType;
                    
                Promise.all([getSertModules(db, storages), getSertStores(db, storages)])
                    .then(results => { 
                        var modules = {};
                        var stores = {};
                        
                        for (var module of results[0])
                            modules[module.code] = module;
                            
                        for (var store of results[1])
                            stores[store.code] = store;

                        resolve({
                            storages: storages,
                            items: items,
                            finishedGoods: finishedGoods,
                            suppliers : suppliers,
                            stores : stores,
                            banks : banks,
                            cardTypes : cardTypes,
                            modules: modules
                        });
                    })
                    .catch(e => {
                        reject(e);
                    }); 

            })
            .catch(e => {
                reject(e);
            });
    });
};

