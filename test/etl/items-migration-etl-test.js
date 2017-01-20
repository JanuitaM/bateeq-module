var helper = require("../helper");
var should = require("should");
var connect = require("../../src/etl/sqlConnect");

var ItemMigration = require("../../src/etl/items-migration-etl");

var instanceMigration=null;

before("#00. connect db", function (done) {
    helper.getDb()
        .then((db) => {
            connect.getConnect()
                .then((connect) => {
                    instanceMigration = new ItemMigration(db, {
                        username: "unit-test"
                    });
                    done();
                })
                .catch((e) => {
                    done(e);
                });
        })
});

// it("#01. should error when get empty data Item", function (done) {
//     instanceManager.getDataItems({})
//         .then((id) => {
//             done();
//         })
//         .catch((e) => { 
//             done(e);
//         })
// });

// it("#02. should error when data Items is not Array", function (done) {
//     instanceManager.getDataItems()
//         .then((data) => {
//             data.should.be.instanceof(Array)
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });


// it("#03. should success when get data Items ", function (done) {
//     instanceManager.getDataItems()
//         .then(() => {
//             // console.log(data);
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });


// var createdData;
// it("#04. should success when create data items ", function (done) {
//     instanceManager.getDataItems()
//         .then((data) => {
//             createdData = data;
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });


it("#05. should success when migrate all data Storages ", function (done) {
    instanceMigration.migrateDataItems()
        .then((result) => {
            // console.log(result);
            done();
        })

        .catch((e) => {
            done(e);
        })
});


