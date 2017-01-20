'use strict'
var DLModels = require('bateeq-models');
var map = DLModels.map;
var ObjectId = require('mongodb').ObjectId;
var sqlConnect = require('./sqlConnect');
var BaseManager = require('module-toolkit').BaseManager;
var MongoClient = require('mongodb').MongoClient,
    test = require('assert');

var ItemManager = require('../../src/managers/master/item-manager');


module.exports = class ItemDataEtl extends BaseManager {
    constructor(db, user) {
        super(db, user);

        this.ItemManager = new ItemManager(db, user);

        this.collection = this.ItemManager.collection;
        this.collectionLog = this.db.collection("migration.log");
        // this.adas=1;
    }

    getNewDataItem() {
        return new Promise(function (resolve, reject) {
            sqlConnect.getConnect()
                .then((connect) => {
                    var request = connect;
                    request.query("select * Barcode,Nm_Product,Size,Harga,Harga1,ro from Produk", function (err, Produk) {
                        resolve(Produk);
                    });
                });
        });
    }

    getDataItem() {
        return new Promise((resolve, reject) => {
            this.collection.find({}).toArray(function (err, items) {
                resolve(items);
            });
        });
    }


    migrateOneByOne(item) {
        return new Promise((resolve, reject) => {
            var task = [];

            this.collection.singleOrDefault({ code: item.Barcode })
                .then(itemResult => {
                    var InsertorUpdate;
                    var _idItems = new ObjectId();
                    var _stampItems = new ObjectId();

                    var ro = "";
                    if ((!item.ro) || (item.ro.trim() == "-")) {
                        ro = "";
                    } else {
                        ro = item.ro.trim();
                    };

                    var newDataItem = {
                        "_id": _idItems,
                        "_stamp": _stampItems,
                        "_type": "finished-goods",
                        "_version": "1.0.0",
                        "_active": true,
                        "_deleted": false,
                        "_createdBy": "router",
                        "_createdDate": new Date(),
                        "_createAgent": "manager",
                        "_updatedBy": "router",
                        "_updatedDate": new Date(),
                        "_updateAgent": "manager",
                        "code": item.Barcode,
                        "name": item.Nm_Product.trim(),
                        "description": "",
                        "uom": "PCS",
                        "components": [],
                        "tags": "",
                        "articleId": {},
                        "article": {
                            "realizationOrder": ro
                        },
                        "size": item.Size,
                        "domesticCOGS": item.Harga,
                        "domesticWholesale": 0,
                        "domesticRetail": 0,
                        "domesticSale": item.Harga1,
                        "internationalCOGS": 0,
                        "internationalWholesale": 0,
                        "internationalRetail": 0,
                        "internationalSale": 0,
                        "notMongo": true
                    }

                    if (itemResult) {
                        newDataItem._id = itemResult._id;
                        newDataItem._stamp = itemResult._stamp;
                        newDataItem._createdDate = itemResult._createdDate;
                        InsertorUpdate = this.ItemManager.update(newDataItem);
                    }
                    else {
                        InsertorUpdate = this.ItemManager.create(newDataItem);
                    }
                    InsertorUpdate
                        .then(itemResult => {
                            resolve(itemResult);
                        })
                        .catch((e) => {
                            resolve(e);
                        });
                })
                .catch((e) => {
                    resolve(e);
                });
        });
    }

    migrateDataItems() {
        return new Promise((resolve, reject) => {
            var _start = new Date().getTime();
            var date = new Date();

            this.collectionLog.insert({ "migration": "sql to items ", "_createdDate": date, "_start": date });
            var newItem = this.getNewDataItem();

            // var dataItem = this.getDataItem();

            Promise.all([newItem])
                .then(result => {
                    var tasks = [];

                    var sqlResult = result[0];
                    // var itemMongoResult = result[1];

                    for (var item of sqlResult) {
                        tasks.push(this.migrateOneByOne(item));
                    }
                    Promise.all(tasks)
                        .then((resultCRUD) => {
                            var end = new Date();
                            var _end = new Date().getTime();
                            var time = _end - _start;
                            var log = {
                                "migration": "sql to items ",
                                "_createdDate": date,
                                "_start": date,
                                "_end": end,
                                "Execution time": time + ' ms',
                            };
                            this.collectionLog.updateOne({ "_start": date }, log);
                            resolve(resultCRUD);
                        })
                        .catch((e) => {
                            reject(e);
                        });

                    // for (var item of sqlResult) {
                    //     var _idItems = new ObjectId();
                    //     var _stampItems = new ObjectId();

                    //     var ro = "";
                    //     if ((!item.ro) || (item.ro.trim() == "-")) {
                    //         ro = "";
                    //     } else {
                    //         ro = item.ro;
                    //     };

                    //     var newDataItem = {
                    //         "_id": _idItems,
                    //         "_stamp": _stampItems,
                    //         "_type": "finished-goods",
                    //         "_version": "1.0.0",
                    //         "_active": true,
                    //         "_deleted": false,
                    //         "_createdBy": "router",
                    //         "_createdDate": new Date(),
                    //         "_createAgent": "manager",
                    //         "_updatedBy": "router",
                    //         "_updatedDate": new Date(),
                    //         "_updateAgent": "manager",
                    //         "code": item.Barcode,
                    //         "name": item.Nm_Product,
                    //         "description": "",
                    //         "uom": "PCS",
                    //         "components": [],
                    //         "tags": "",
                    //         "articleId": {},
                    //         "article": {
                    //             "realizationOrder": ro
                    //         },
                    //         "size": item.Size,
                    //         "domesticCOGS": item.Harga,
                    //         "domesticWholesale": 0,
                    //         "domesticRetail": 0,
                    //         "domesticSale": item.Harga1,
                    //         "internationalCOGS": 0,
                    //         "internationalWholesale": 0,
                    //         "internationalRetail": 0,
                    //         "internationalSale": 0,
                    //         "notMongo": true
                    //     }

                    //     var isfound = false;
                    //     for (var item2 of itemMongoResult) {
                    //         if (item.Barcode == item2.code) {
                    //             isfound = true;
                    //             if (!item2.notMongo) {
                    //                 //update;
                    //                 newDataItem._id = item2._id;
                    //                 newDataItem._stamp = item2._stamp;
                    //                 newDataItem._createdDate = item2._createdDate;
                    //                 tasks.push(this.ItemManager.update(newDataItem));
                    //                 break;
                    //             }
                    //         }
                    //     }
                    //     if (!isfound) {
                    //         tasks.push(this.ItemManager.create(newDataItem));
                    //         itemMongoResult.push(newDataItem);
                    //     }
                    // }

                    // Promise.all(tasks)
                    //     .then((resultCRUD) => {
                    //         resolve(resultCRUD);
                    //     })
                    //     .catch((e) => {
                    //         reject(e);
                    //     });
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }
}