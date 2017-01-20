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
        this.collectionLog = this.db.collection("migration.log");
    }

    getDataStores() {
        return new Promise(function (resolve, reject) {
            sqlConnect.getConnect()
                .then((connect) => {
                    var request = connect;
                    request.query("select * from Branch", function (err, stores) {
                        resolve(stores);
                    });
                });
        });
    }


    getStoreMongo(stores) {

        return new Promise((resolve, reject) => {

            this.collection.find({}).toArray(function (err, storeMongo) {

                resolve(storeMongo)

            });
        });
    }

    migrateDataStores() {
        return new Promise((resolve, reject) => {
            var _start = new Date().getTime();
            var date = new Date();

            this.collectionLog.insert({ "migration": "sql to items.temp ", "_createdDate": date, "_start": date });

            var storesSQL = this.getDataStores();
            var storesMongo = this.getStoreMongo();

            Promise.all([storesSQL, storesMongo]).then(result => {
                var shift = [];

                shift = [
                    {
                        "shift": 1,
                        "dateFrom": new Date("2000-01-01T20:00:00.000Z"),
                        "dateTo": new Date("2000-01-01T08:59:59.000Z"),
                    },
                    {
                        "shift": 2,
                        "dateFrom": new Date("2000-01-01T09:00:00.000Z"),
                        "dateTo": new Date("2000-01-01T19:59:59.000Z"),
                    }
                ];


                var tasks = [];
                for (var item of result[0]) {
                    var _id = new ObjectId();
                    var _idStorage = new ObjectId();
                    var _stamp = new ObjectId();
                    var _stampStorage = new ObjectId();

                    var openedDate = "";
                    if (item.tanggal_buka == null) {
                        openedDate = "";
                    } else {
                        openedDate = item.tanggal_buka;
                    };

                    var closedDate = "";
                    if (item.tanggal_tutup == null) {
                        closedDate = "";

                    } else {
                        closedDate = item.tanggal_tutup;
                    };

                    var status = "";
                    var _active = false;
                    if (!item.status) {
                        status = "";
                        _active = false;
                    } else if (item.status.trim() == "CLOSE") {
                        status = item.status;
                        _active = false;
                    } else {
                        status = item.status;
                        _active = true;
                    };

                    var isfound = false;
                    for (var item2 of result[1]) {

                        if (item.Kd_Cbg == item2.code) {
                            //update;
                            isfound = true;

                            var update =
                                {
                                    "_id": item2._id,
                                    "_stamp": item2._stamp,
                                    "_type": "store",
                                    "_version": "1.0.0",
                                    "_active": _active,
                                    "_deleted": false,
                                    "_createdBy": "router",
                                    "_createdDate": item2._createdDate,
                                    "_createAgent": "manager",
                                    "_updatedBy": "router",
                                    "_updatedDate": new Date(),
                                    "_updateAgent": "manager",
                                    "code": item.Kd_Cbg,
                                    "name": item.Nm_Cbg.trim(),
                                    "description": "",
                                    "salesTarget": item.target_omset_bulan,
                                    "storageId": item2.storage._id,
                                    "storage": {
                                        "_id": item2.storage._id,
                                        "_stamp": item2.storage._stamp,
                                        "_type": "storage",
                                        "_version": "1.0.0",
                                        "_active": _active,
                                        "_deleted": false,
                                        "_createdBy": "router",
                                        "_createdDate": item2.storage._createdDate,
                                        "_createAgent": "manager",
                                        "_updatedBy": "router",
                                        "_updatedDate": new Date(),
                                        "_updateAgent": "manager",
                                        "code": item.Kd_Cbg,
                                        "name": item.Nm_Cbg.trim(),
                                        "description": "",
                                        "address": [(item.Alm_Cbg || '').trim().toString(), (item.Kota_Cbg || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                                        "phone": [(item.Kontak || '').trim().toString(), (item.Telp || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                                    },

                                    "salesCategoryId": {},
                                    "salesCategory": item.jenis_penjualan,
                                    "shifts": item2.shifts,
                                    // "shifts": shift,
                                    "city": item.Kota_Cbg.trim(),
                                    "pic": item.Kontak,
                                    "fax": item.FAX,
                                    "openedDate": openedDate,
                                    "closedDate": closedDate,
                                    "storeArea": item.keterangan,
                                    "storeWide": item.luas_toko,
                                    "online-offline": item.online_offline,
                                    "storeCategory": item.jenis_toko,
                                    "monthlyTotalCost": item.total_cost_bulanan,
                                    "status": status,
                                    "address": [(item.Alm_Cbg || '').trim().toString(), (item.Kota_Cbg || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                                    "phone": [(item.Kontak || '').trim().toString(), (item.Telp || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                                    // "salesCapital": 0
                                }
                            if (update.phone == '') {
                                update.phone = "-";
                            }
                            tasks.push(this.collection.update(update, { ordered: false }));

                            break;
                        }

                    }

                    if (!isfound) {

                        var insert =
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
                                "code": item.Kd_Cbg,
                                "name": item.Nm_Cbg.trim(),
                                "description": "",
                                "salesTarget": item.target_omset_bulan,
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
                                    "code": item.Kd_Cbg,
                                    "name": item.Nm_Cbg.trim(),
                                    "description": "",
                                    "address": [(item.Alm_Cbg || '').trim().toString(), (item.Kota_Cbg || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                                    "phone": [(item.Kontak || '').trim().toString(), (item.Telp || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                                },

                                "salesCategoryId": {},
                                "salesCategory": item.jenis_penjualan,
                                "shifts": shift,
                                "city": item.Kota_Cbg.trim(),
                                "pic": item.Kontak,
                                "fax": item.FAX,
                                "openedDate": openedDate,
                                "closedDate": closedDate,
                                "storeArea": item.keterangan,
                                "storeWide": item.luas_toko,
                                "online-offline": item.online_offline,
                                "storeCategory": item.jenis_toko,
                                "monthlyTotalCost": item.total_cost_bulanan,
                                "status": status,
                                "address": [(item.Alm_Cbg || '').trim().toString(), (item.Kota_Cbg || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                                "phone": [(item.Kontak || '').trim().toString(), (item.Telp || '').trim().toString()].filter(r => r && r.toString().trim().length > 0).join(" - "),
                                "salesCapital": 0,
                            }
                        // insertArr.push(insert)
                        if (insert.phone == '') {
                            insert.phone = "-";
                        }
                        tasks.push(this.collection.insert(insert, { ordered: false }));
                    }

                }

                // return (tasks);
                Promise.all(tasks)
                    .then((result) => {
                        var end = new Date();
                        var _end = new Date().getTime();
                        var time = _end - _start;
                        var log = {
                            "migration": "sql to stores.temp ",
                            "_createdDate": date,
                            "_start": date,
                            "_end": end,
                            "Execution time": time + ' ms',
                        };
                        this.collectionLog.updateOne({ "_start": date }, log);
                        resolve(result);
                    })
                    .catch((e) => {
                        reject(e);
                    })
            });
        });
    }
}