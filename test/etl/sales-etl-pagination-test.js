var helper = require("../helper");
var should = require("should");
var connect = require("../../src/etl/sqlConnect");
var Sales = require("../../src/etl/sales-etl");
// var SalesMigration = require("../../src/etl/sales-migration-etl");
var instanceManager = null;
var instanceMigration = null;

before("#00. connect db", function (done) {
    helper.getDb()
        .then((db) => {
            connect.getConnect()
                .then((connect) => {
                    instanceManager = new Sales(db, {
                        username: "unit-test"
                    });

                    done();
                })
                .catch((e) => {
                    done(e);
                });
        })
});

it("#01. should success insert all data ", function (done) {
    instanceManager.getDataSales("SLO.03","2012-01-01","2017-01-08")
        .then((sales) =>{

                    done();

        })
        .catch((e) => {
            done(e);
        })


});

