'use strict'
var DLModels = require('bateeq-models');
var map = DLModels.map;
var fs = require("fs");
var BaseManager = require('module-toolkit').BaseManager;
var MongoClient = require('mongodb').MongoClient,
    test = require('assert');
var StoreManager = require('../../src/managers/master/store-manager');
var StoragesManager = require('../../src/managers/master/storage-manager');

module.exports = class StorageDataEtl extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.storeManager = new StoreManager(db, user);
        this.storageManager = new StoragesManager(db, user);

        this.collection = this.storeManager.collection;
        this.collectionStorages = this.storageManager.collection;
        this.collectionLog = this.db.collection("migration.log");
    }

    getDataStorages() {

        return new Promise((resolve, reject) => {

            this.collection.find({}).toArray(function (err, storagesMongo) {

                resolve(storagesMongo)

            });
        });
    }


    getStoreMongo(stores) {

        return new Promise((resolve, reject) => {

            this.collectionStorages.find({}).toArray(function (err, storagesMongo) {

                resolve(storagesMongo)

            });
        });
    }

    migrateDataStorages() {
        return new Promise((resolve, reject) => {
            var _start = new Date().getTime();
            var date = new Date();

            this.collectionLog.insert({ "migration": "sql to storages ", "_createdDate": date, "_start": date });


            var storagesNew = this.getDataStorages();
            var storagesMongo = this.getStoreMongo();

            Promise.all([storagesNew, storagesMongo]).then(result => {

                var tasks = [];
                for (var item of result[0]) {

                    var isfound = false;
                    for (var item2 of result[1]) {

                        if (item.code == item2.code) {
                            //update;
                            isfound = true;

                            var update =
                                {
                                    "_id": item.storage._id,
                                    "_stamp": item.storage._stamp,
                                    "_type": "storage",
                                    "_version": "1.0.0",
                                    "_active": item._active,
                                    "_deleted": false,
                                    "_createdBy": "router",
                                    "_createdDate": item.storage._createdDate,
                                    "_createAgent": "manager",
                                    "_updatedBy": "router",
                                    "_updatedDate": new Date(),
                                    "_updateAgent": "manager",
                                    "code": item.storage.code,
                                    "name": item.storage.name,
                                    "description": "",
                                    "address": item.address,
                                    "phone": item.phone,
                                }

                            tasks.push(this.collectionStorages.update(update, { ordered: false }));

                            break;
                        }

                    }

                    if (!isfound) {

                        var insert =
                            {
                                "_id": item.storage._id,
                                "_stamp": item.storage._stamp,
                                "_type": "storage",
                                "_version": "1.0.0",
                                "_active": item._active,
                                "_deleted": false,
                                "_createdBy": "router",
                                "_createdDate": item.storage._createdDate,
                                "_createAgent": "manager",
                                "_updatedBy": "router",
                                "_updatedDate": item.storage._updatedDate,
                                "_updateAgent": "manager",
                                "code": item.storage.code,
                                "name": item.storage.name,
                                "description": "",
                                "address": item.address,
                                "phone": item.phone,
                            }

                        tasks.push(this.collectionStorages.insert(insert, { ordered: false }));
                    }

                }

                Promise.all(tasks)
                    .then((result) => {
                        var end = new Date();
                        var _end = new Date().getTime();
                        var time = _end - _start;
                        var log = {
                            "migration": "sql to storages ",
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