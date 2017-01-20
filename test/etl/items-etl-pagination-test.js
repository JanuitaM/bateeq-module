var helper = require("../helper");
var should = require("should");
var connect = require("../../src/etl/sqlConnect");
// var ItemsMigration = require("../../src/etl/sp-items-etl");
var ItemsMigration = require("../../src/etl/items-etl");
var instanceMigration = null;

before("#00. connect db", function (done) {
    helper.getDb()
        .then((db) => {
            connect.getConnect()
                .then((connect) => {
                    instanceMigration = new ItemsMigration(db, {
                        username: "unit-test"
                    });
                    done();
                })
                .catch((e) => {
                    done(e);
                });
        })
});

it("#01. should success when migrate all data items ", function (done) {
    instanceMigration.getDataItems()
        .then((result) => {
            // console.log(result);
            done();
        })

        .catch((e) => {
            done(e);
        })
});


