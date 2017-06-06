'use strict'

// external deps 
var ObjectId = require("mongodb").ObjectId;
var BaseManager = require('module-toolkit').BaseManager;
var moment = require("moment");

var StoreManager = require('../../src/managers/master/store-manager');

// internal deps 
require('mongodb-toolkit');
const migrationName = "ETL-DimBranch";

module.exports = class DimBranch {
    constructor(db, user, sql) {
        this.db = db;
        this.sql = sql;
        this.StoreManager = new StoreManager(db, user);
        this.migrationLog = db.collection("migration.log");
    }

    run() {
        var startedDate = new Date();
        return new Promise((resolve, reject) => {
            this.lastETLDate().then(lastMigration => {

                this.migrationLog.insert({
                    migration: migrationName,
                    _start: startedDate,
                    _createdDate: startedDate
                })

                this.extract(lastMigration._createdDate)
                    .then((data) => {
                        var exctractDate = new Date();
                        console.log("extract :" + moment(exctractDate).diff(moment(startedDate), "minutes") + " minutes")
                        this.transform(data).then((data) => {
                            var transformDate = new Date();
                            console.log("transform :" + moment(transformDate).diff(moment(exctractDate), "minutes") + " minutes")
                            this.load(data).then((result) => {
                                var finishedDate = new Date();
                                var spentTime = moment(finishedDate).diff(moment(startedDate), "minutes");
                                console.log("load :" + spentTime + " minutes")
                                var updateLog = {
                                    migration: migrationName,
                                    _start: startedDate,
                                    _createdDate: startedDate,
                                    _end: finishedDate,
                                    executionTime: spentTime + " minutes",
                                    status: "success",
                                    summary: {
                                        extract: moment(exctractDate).diff(moment(startedDate), "minutes") + " minutes",
                                        transform: moment(transformDate).diff(moment(exctractDate), "minutes") + " minutes",
                                        load: moment(finishedDate).diff(moment(transformDate), "minutes") + " minutes"
                                    }
                                };
                                this.migrationLog.updateOne({ _createdDate: startedDate }, updateLog);
                                resolve(result);
                            })
                                .catch((err) => {
                                    var finishedDate = new Date();
                                    var spentTime = moment(finishedDate).diff(moment(startedDate), "minutes");
                                    var updateLog = {
                                        migration: migrationName,
                                        _start: startedDate,
                                        _createdDate: startedDate,
                                        _end: finishedDate,
                                        executionTime: spentTime + " minutes",
                                        status: err
                                    };
                                    this.migrationLog.updateOne({ _createdDate: startedDate }, updateLog);
                                    console.log(err);
                                    reject(err);
                                });
                        }).catch((err) => {
                            var finishedDate = new Date();
                            var spentTime = moment(finishedDate).diff(moment(startedDate), "minutes");
                            var updateLog = {
                                migration: migrationName,
                                _start: startedDate,
                                _createdDate: startedDate,
                                _end: finishedDate,
                                executionTime: spentTime + " minutes",
                                status: err
                            };
                            this.migrationLog.updateOne({ _createdDate: startedDate }, updateLog);
                            console.log(err);
                            reject(err);
                        });
                    }).catch((err) => {
                        var finishedDate = new Date();
                        var spentTime = moment(finishedDate).diff(moment(startedDate), "minutes");
                        var updateLog = {
                            migration: migrationName,
                            _start: startedDate,
                            _createdDate: startedDate,
                            _end: finishedDate,
                            executionTime: spentTime + " minutes",
                            status: err
                        };
                        this.migrationLog.updateOne({ _createdDate: startedDate }, updateLog);
                        console.log(err);
                        reject(err);
                    });
            })
        });
    }

    lastETLDate() {
        return new Promise((resolve, reject) => {
            this.migrationLog.find({ "migration": migrationName, status: "success" }).sort({ "_createdDate": -1 }).limit(1).toArray()
                .then((result) => {
                    resolve(result[0] || { _createdDate: new Date("1970-01-01") });
                }).catch((err) => {
                    reject(err);
                })
        })
    }


    extract(date) {
        var timestamp = date || new Date("1970-01-01");
        return this.StoreManager.collection.find({
            _deleted: false,
            _updatedDate: {
                "$gt": timestamp
            }
        }).toArray();
    }

    getDBValidString(str) {
        if (str) {
            if ((typeof str) == "string")
                return str.split("'").join("''")
            else
                return str
        }
        else {
            if ((typeof str) == "number")
                return "0";
            else
                return ""
        }
    }

    transform(data) {
        return new Promise((resolve, reject) => {
            var requiredDocs = [];

            var result = data.map((store) => {
                if (store.openedDate)
                    return {
                        store_code: `'${this.getDBValidString(store.code)}'`,
                        store_name: `'${this.getDBValidString(store.name)}'`,
                        store_city: `'${this.getDBValidString(store.city)}'`,
                        store_open_date: store.openedDate ? `'${moment(store.openedDate).format("L")}'` : null,
                        store_close_date: store.closedDate ? `'${moment(store.closedDate).format("L")}'` : null,
                        store_area: `'${this.getDBValidString(store.storeArea)}'`,
                        store_status: `'${this.getDBValidString(store.status)}'`,
                        store_wide: `'${this.getDBValidString(store.storeWide)}'`,
                        store_offline_online: `'${this.getDBValidString(store['online-offline'])}'`,
                        store_sales_category: `'${this.getDBValidString(store.salesCategory)}'`,
                        store_monthly_total_cost: `'${this.getDBValidString(store.monthlyTotalCost)}'`,
                        store_category: `'${this.getDBValidString(store.storeCategory)}'`,
                        store_montly_omzet_target: `'${this.getDBValidString(store.salesTarget)}'`,
                    }
            });
            resolve(result);
        });
    }


    insertQuery(sql, query) {
        return new Promise((resolve, reject) => {
            sql.query(query, function (err, result) {
                if (err) {
                    resolve({ "status": "error", "error": err });
                } else {
                    resolve({ "status": "success" });
                }
            })
        })
    }

    load(data) {
        return new Promise((resolve, reject) => {
            this.sql.startConnection()
                .then(() => {

                    var transaction = this.sql.transaction();

                    transaction.begin((err) => {

                        var request = this.sql.transactionRequest(transaction);

                        var command = [];

                        var sqlQuery = '';

                        var count = 1;

                        for (var item of data) {
                            if (item) {
                                var queryString = `INSERT INTO [BTQ_DimBranch_Temp] ([store_code],[store_name],[store_city],[store_open_date],[store_close_date],[store_area],[store_status],[store_wide],[store_offline_online],[store_sales_category],[store_monthly_total_cost],[store_category],[store_montly_omzet_target]) values(${item.store_code},${item.store_name},${item.store_city},${item.store_open_date},${item.store_close_date},${item.store_area},${item.store_status},${item.store_wide},${item.store_offline_online},${item.store_sales_category},${item.store_monthly_total_cost},${item.store_category},${item.store_montly_omzet_target})\n`;
                                sqlQuery = sqlQuery.concat(queryString);
                                if (count % 1000 == 0) {
                                    command.push(this.insertQuery(request, sqlQuery));
                                    sqlQuery = "";
                                }
                                console.log(`add data to query  : ${count}`);
                                count++;
                            }
                        }

                        if (sqlQuery != "")
                            command.push(this.insertQuery(request, `${sqlQuery}`));

                        request.multiple = true;

                        // var fs = require("fs");
                        // var path = "C:\\Users\\daniel.nababan.MOONLAY\\Desktop\\sqlQuery.txt";

                        // fs.writeFile(path, sqlQuery, function (error) {
                        //     if (error) {
                        //         console.log("write error:  " + error.message);
                        //     } else {
                        //         console.log("Successful Write to " + path);
                        //     }
                        // });

                        return Promise.all(command)
                            .then((results) => {
                                if (results.find((o) => o.status == "error")) {
                                    transaction.rollback((err) => {
                                        if (err)
                                            reject(err)
                                        else
                                            reject(results);
                                    });
                                } else {
                                    request.execute("BTQ_Upsert_DimBranch").then((execResult) => {
                                        transaction.commit((err) => {
                                            if (err)
                                                reject(err);
                                            else
                                                resolve(results);
                                        });
                                    }).catch((error) => {
                                        transaction.rollback((err) => {
                                            if (err)
                                                reject(err)
                                            else
                                                reject(error);
                                        });
                                    })
                                }
                            })
                            .catch((error) => {
                                transaction.rollback((err) => {
                                    console.log("rollback");
                                    if (err)
                                        reject(err)
                                    else
                                        reject(error);
                                });
                            });
                    });
                })
                .catch((err) => {
                    reject(err);
                })
        });
    }
}
