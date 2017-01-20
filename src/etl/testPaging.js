'use strict'
var DLModels = require('bateeq-models');
var map = DLModels.map;
var ObjectId = require('mongodb').ObjectId;
var sqlConnect = require('./sqlConnect');
var BaseManager = require('module-toolkit').BaseManager;
var MongoClient = require('mongodb').MongoClient,
    test = require('assert');

var StoreManager = require('../../src/managers/master/store-manager');



module.exports = class StoreDataEtl extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.storeManager = new StoreManager(db, user);

        this.collection = this.storeManager.collection;
        // this.adas=1;
    }


    getDataStores() {
        return new Promise((resolve, reject) => {
            sqlConnect.getConnect()
                .then((connect) => {
                    var self = this;
                    var query = "select count(Kd_Cbg) as MaxLength from Branch";
                    var request = connect;
                    request.query(query, function (err, BranchLength) {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        else {
                            var DataRows = 25;
                            // var numberOfPage = [];
                            var numberOfPage = Math.ceil(BranchLength[0].MaxLength / DataRows);

                            var process = [];
                            for (var i = 1; i <= numberOfPage; i++) {
                                process.push(self.migrateDataStores(request, i, DataRows))
                            }

                            Promise.all(process).then(results => {
                                var stores = [];
                                for (var result of results) {
                                    stores.push(result);
                                }
                                resolve(stores);
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
            this.collection.find({ "code": code }).toArray(function (err, store) {
                resolve(store);
            });

        });
    }

    migrateDataStores(request, pageNumber, DataRows) {
        var self = this;
        return new Promise(function (resolve, reject) {

            // for (var i = 1; i <= pageNumber; i++) {
            //     this.getDataStores(request, i, DataRows);

            // }

            var query = "exec Pagination_Branch_test " + pageNumber + "," + DataRows + " ";

            request.query(query, function (err, stores) {

                var tasks = [];

                for (var store of stores) {
                    tasks.push(self.insert(store));
                }

                Promise.all(tasks)
                    .then((task) => {
                        console.log(task);
                        resolve(task);
                    }).catch(error => {
                        reject(error);
                    });
            });
        });
    }

    insert(store) {
        return new Promise((resolve, reject) => {


            var shift = [];

            shift = [
                {
                    "shift": 1,
                    "dateFrom": new Date("2000-01-01T00:00:00.000Z"),
                    "dateTo": new Date("2000-01-01T11:59:59.000Z"),
                },
                {
                    "shift": 2,
                    "dateFrom": new Date("2000-01-01T12:00:00.000Z"),
                    "dateTo": new Date("2000-01-01T23:59:59.000Z"),
                }
            ];

            var _id = new ObjectId();
            var _idStorage = new ObjectId();
            var _stamp = new ObjectId();
            var _stampStorage = new ObjectId();

            var openedDate = "";
            if (store.tanggal_buka == null) {
                openedDate = "";
            } else {
                openedDate = store.tanggal_buka;
            };

            var closedDate = "";
            if (store.tanggal_tutup == null) {
                closedDate = "";

            } else {
                closedDate = store.tanggal_tutup;
            };

            var status = "";

            var _active = false;
            if (!store.status) {
                status = "";
                _active = false;
            } else if (store.status.trim() == "CLOSE") {
                status = store.status;
                _active = false;
            } else {
                status = store.status;
                _active = true;
            };

            this.getDataMongo(store.Kd_Cbg).then((results) => {
                if (results && results.length > 0) {
                    var result = results[0];
                    var update =
                        {
                            "_id": result._id,
                            "_stamp": result._stamp,
                            "_type": "store",
                            "_version": "1.0.0",
                            "_active": _active,
                            "_deleted": false,
                            "_createdBy": "router",
                            "_createdDate": result._createdDate,
                            "_createAgent": "manager",
                            "_updatedBy": "router",
                            "_updatedDate": new Date(),
                            "_updateAgent": "manager",
                            "code": result.code,
                            "name": store.Nm_Cbg,
                            "description": "",
                            "salesTarget": store.target_omset_bulan,
                            "storageId": result.storageId,
                            "storage": {
                                "_id": result.storage._id,
                                "_stamp": result.storage._stamp,
                                "_type": "storage",
                                "_version": "1.0.0",
                                "_active": _active,
                                "_deleted": false,
                                "_createdBy": "router",
                                "_createdDate": result.storage._createdDate,
                                "_createAgent": "manager",
                                "_updatedBy": "router",
                                "_updatedDate": new Date(),
                                "_updateAgent": "manager",
                                "code": store.Kd_Cbg,
                                "name": store.Nm_Cbg,
                                "description": "",
                                "address": [(store.Alm_Cbg || '').trim().toString(), (store.Kota_Cbg || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                                "phone": [(store.Kontak || '').trim().toString(), (store.Telp || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                            },

                            "salesCategoryId": {},
                            "salesCategory": store.jenis_penjualan,
                            "shift": shift,
                            "city": store.Kota_Cbg,
                            "pic": store.Kontak,
                            "fax": store.FAX,
                            "openedDate": openedDate,
                            "closedDate": closedDate,
                            "storeArea": store.keterangan,
                            "storeWide": store.luas_toko,
                            "online-offline": store.online_offline,
                            "storeCategory": store.jenis_toko,
                            "monthlyTotalCost": store.total_cost_bulanan,
                            "status": status,
                            "address": [(store.Alm_Cbg || '').trim().toString(), (store.Kota_Cbg || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                            "phone": [(store.Kontak || '').trim().toString(), (store.Telp || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                            "salesCapital": 0
                        }
                    if (update.phone == '') {
                        update.phone = "-";
                    }
                    this.collection.update(update, { ordered: false })
                    .then((result) => {
                        resolve(result);
                    })
                    //update
                } else {
                    //insert
                    var StoreMap =
                        {
                            "_id": _id,
                            "_stamp": _stamp,
                            "_type": "store",
                            "_version": "1.0.0",
                            "_active": _active,
                            "_deleted": false,
                            "_createdBy": "router",
                            "_createdDate": new Date(),
                            "_createAgent": "manager",
                            "_updatedBy": "router",
                            "_updatedDate": new Date(),
                            "_updateAgent": "manager",
                            "code": store.Kd_Cbg,
                            "name": store.Nm_Cbg,
                            "description": "",
                            "salesTarget": store.target_omset_bulan,
                            "storageId": _idStorage,
                            "storage": {
                                "_id": _idStorage,
                                "_stamp": _stampStorage,
                                "_type": "storage",
                                "_version": "1.0.0",
                                "_active": _active,
                                "_deleted": false,
                                "_createdBy": "router",
                                "_createdDate": new Date(),
                                "_createAgent": "manager",
                                "_updatedBy": "router",
                                "_updatedDate": new Date(),
                                "_updateAgent": "manager",
                                "code": store.Kd_Cbg,
                                "name": store.Nm_Cbg,
                                "description": "",
                                "address": [(store.Alm_Cbg || '').trim().toString(), (store.Kota_Cbg || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                                "phone": [(store.Kontak || '').trim().toString(), (store.Telp || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                            },

                            "salesCategoryId": {},
                            "salesCategory": store.jenis_penjualan,
                            "shift": shift,
                            "city": store.Kota_Cbg,
                            "pic": store.Kontak,
                            "fax": store.FAX,
                            "openedDate": openedDate,
                            "closedDate": closedDate,
                            "storeArea": store.keterangan,
                            "storeWide": store.luas_toko,
                            "online-offline": store.online_offline,
                            "storeCategory": store.jenis_toko,
                            "monthlyTotalCost": store.total_cost_bulanan,
                            "status": status,
                            "address": [(store.Alm_Cbg || '').trim().toString(), (store.Kota_Cbg || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                            "phone": [(store.Kontak || '').trim().toString(), (store.Telp || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                            "salesCapital": 0
                        }
                    if (StoreMap.phone == '') {
                        StoreMap.phone = "-";
                    }
                    this.collection.insert(StoreMap, { ordered: false }).then((result) => {
                        resolve(result);
                    });
                }
            })
        })
    }
}