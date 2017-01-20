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


    getDataItems() {
        return new Promise((resolve, reject) => {
            sqlConnect.getConnect()
                .then((connect) => {
                    var self = this;
                    var query = "select count(Barcode) as MaxLength from Produk";
                    var request = connect;
                    request.query(query, function (err, ProdukLength) {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        else {
                            var _start = new Date().getTime();
                            var date = new Date();

                            self.collectionLog.insert({ "migration": "sql to items ", "_createdDate": date, "_start": date });

                            var MaxLength = ProdukLength[0].MaxLength;
                            // var testPage=100;
                            var DataRows = 10;

                            var numberOfPage = Math.ceil(MaxLength / DataRows);

                            var process = [];
                            for (var i = 1; i <= 1; i++) {
                                process.push(self.migrateDataItems(request, i, DataRows))
                            }

                            Promise.all(process).then(results => {
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
                                self.collectionLog.updateOne({ "_start": date }, log);
                                resolve(results);

                            }).catch(error => {
                                reject(error);
                            });
                        }
                    });
                });
        });
    }

    // getDataStores(request, pageNumber) {
    //     return new Promise(function (resolve, reject) {
    //         var query = "exec Pagination_Branch_test " + pageNumber + "," + DataRows + " ";
    //         request.query(query, function (err, store) {
    //             resolve(store);
    //         })
    //     })
    // }

    getDataMongo(code) {
        return new Promise((resolve, reject) => {
            this.collection.find({ "code": code }).toArray(function (err, item) {
                resolve(item);
            });

        });
    }

    migrateDataItems(request, pageNumber, DataRows) {
        var self = this;
        return new Promise(function (resolve, reject) {

            var query = "exec pagination_item_test " + pageNumber + "," + DataRows + " ";

            request.query(query, function (err, items) {
                var tasks = [];

                for (var item of items) {
                    tasks.push(self.insert(item));
                }

                Promise.all(tasks)
                    .then((task) => {
                        // console.log(task);
                        resolve(task);
                    }).catch(error => {
                        reject(error);
                    });
            });
        });
    }

    insert(item) {
        return new Promise((resolve, reject) => {

            var _idItems = new ObjectId();
            var _stampItems = new ObjectId();

            var ro = "";
            if ((!item.ro) || (item.ro.trim() == "-")) {
                ro = "";
            } else {
                ro = item.ro.trim();
            };

            this.getDataMongo(item.Barcode).then((results) => {
                if (results && results.length > 0) {
                    var result = results[0];
                    var update =
                        {
                            "_id": result._id,
                            "_stamp": result._stamp,
                            "_type": "finished-goods",
                            "_version": "1.0.0",
                            "_active": true,
                            "_deleted": false,
                            "_createdBy": "router",
                            "_createdDate": result._createdDate,
                            "_createAgent": "manager",
                            "_updatedBy": "router",
                            "_updatedDate": new Date(),
                            "_updateAgent": "manager",
                            "code": result.code,
                            "name": item.Nm_Product.trim(),
                            "description": "",
                            "uom": "PCS",
                            "components": [],
                            "tags": "",
                            "articleId": {},
                            "article": {
                                "realizationOrder": ro
                            },
                            "size": item.Size.trim(),
                            "domesticCOGS": item.Harga,
                            "domesticWholesale": 0,
                            "domesticRetail": 0,
                            "domesticSale": item.Harga1,
                            "internationalCOGS": 0,
                            "internationalWholesale": 0,
                            "internationalRetail": 0,
                            "internationalSale": 0,

                        }
                    this.collection.update(update, { ordered: false })
                        .then((result) => {
                            resolve(result);
                        })

                } else {
                    var ItemMap =
                        {
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
                            "size": item.Size.trim(),
                            "domesticCOGS": item.Harga,
                            "domesticWholesale": 0,
                            "domesticRetail": 0,
                            "domesticSale": item.Harga1,
                            "internationalCOGS": 0,
                            "internationalWholesale": 0,
                            "internationalRetail": 0,
                            "internationalSale": 0,

                        }

                    this.collection.insert(ItemMap, { ordered: false }).then((result) => {
                        resolve(result);
                    });
                }
            })
        })
    }
}