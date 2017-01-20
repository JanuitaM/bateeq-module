var helper = require("../helper");
var should = require("should");
var connect = require("../../src/etl/sqlConnect");
var Sales = require("../../src/etl/sales-migration-etl");
var SalesMigration = require("../../src/etl/sales-migration-etl");
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
    instanceManager.migrate()
        .then((sales) =>{
            // instanceManager.getStores(sales)
            //     .then((store) => {
                    // console.log(sales);
                    done();
            //     })
            //     .catch((e) => {
            //         done(e);
            //     })
        })
        .catch((e) => {
            done(e);
        })


});

// it("#02. should error when data is not Array", function (done) {
//     instanceManager.getDataSales()
//         .then((data) => {
//             data.should.be.instanceof(Array)
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });

// it("#03. should success when get data ", function (done) {
//     instanceManager.getDataSales()
//         .then(() => {
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });

// var createdData;
// it("#04. should success when create data ", function (done) {
//     instanceManager.getDataSales()
//         .then((data) => {
//             createdData = data;
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });