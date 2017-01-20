var helper = require("../helper");
var should = require("should");
var connect = require("../../src/etl/sqlConnect");
var StoresMigration = require("../../src/etl/stores-migration-etl");
var instanceMigration = null;

before("#00. connect db", function (done) {
    helper.getDb()
        .then((db) => {
            connect.getConnect()
                .then((connect) => {
                    instanceMigration = new StoresMigration(db, {
                        username: "unit-test"
                    });
                    done();
                })
                .catch((e) => {
                    done(e);
                });
        })
});

// it("#01. should error when get empty data ", function (done) {
//     instanceManager.getDataStores({})
//         .then((id) => {
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });

// it("#02. should error when data is not Array", function (done) {
//     instanceManager.getDataStores()
//         .then((data) => {
//             data.should.be.instanceof(Array)
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });

// it("#03. should success when get data ", function (done) {
//     instanceManager.getDataStores()
//         .then(() => {
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });
// it("#05. should success when get data Stores ", function (done) {
//     instanceMigration.getDataStores()
//         .then((data) => {
//             console.log(data);
//             done();
//         })

//         .catch((e) => {
//             done(e);
//         })
// });


// it("#05. should success when migrate all data Stores ", function (done) {
//     instanceMigration.migrateDataStores()
//         .then((result) => {
//             // console.log(data);
//             done();
//         })

//         .catch((e) => {
//             done(e);
//         })
// });

it("#05. should success when migrate all data Stores ", function (done) {
    instanceMigration.migrateDataStores()
        .then((result) => {
            // console.log(data);
            done();
        })

        .catch((e) => {
            done(e);
        })
});


