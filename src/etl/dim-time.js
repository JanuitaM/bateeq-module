'use strict'

// external deps 
var ObjectId = require("mongodb").ObjectId;
var BaseManager = require('module-toolkit').BaseManager;
var moment = require("moment");

// internal deps 
require('mongodb-toolkit');
const migrationName = "ETL-DimTime";

module.exports = class DimTime {
    constructor(db, user, sql) {
        this.db = db;
        this.sql = sql;
        this.migrationLog = db.collection("migration.log");
    }

    run() {
        var startedDate = new Date();
        return new Promise((resolve, reject) => {
                this.migrationLog.insert({
                    migration: migrationName,
                    _start: startedDate,
                    _createdDate: startedDate
                })

                this.load().then((result) => {
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
                            load: moment(finishedDate).diff(moment(startedDate), "minutes") + " minutes"
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
            })
    }

    load() {
        return new Promise((resolve, reject) => {
            this.sql.startConnection()
                .then(() => {

                    var transaction = this.sql.transaction();

                    transaction.begin((err) => {

                        var request = this.sql.transactionRequest(transaction);

                        request.execute("BTQ_INSERT_DIMTIME").then((execResult) => {
                            transaction.commit((err) => {
                                if (err)
                                    reject(err);
                                else
                                    resolve(true);
                            });
                        }).catch((error) => {
                            transaction.rollback((err) => {
                                if (err)
                                    reject(err)
                                else
                                    reject(error);
                            });
                        });

                    });
                });
        })
    }
}
