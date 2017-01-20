var helper = require("../helper");
var should = require("should");
var connect = require("../../src/etl/sqlConnect");

var StoragesMigration = require("../../src/etl/storages-migration-etl");

var instanceMigration = null;

before("#00. connect db", function (done) {
    helper.getDb()
        .then((db) => {
            connect.getConnect()
                .then((connect) => {
                    instanceMigration = new StoragesMigration(db, {
                        username: "unit-test"
                    });
                    done();
                })
                .catch((e) => {
                    done(e);
                });
        })
});

// it("#01. should error when get empty data", function (done) {
//     instanceManager.getDataStorages({})
//         .then((id) => {
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });

// it("#02. should error when data is not Array", function (done) {
//     instanceManager.getDataStorages()
//         .then((data) => {
//             data.should.be.instanceof(Array)
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });


// it("#03. should success when get data Storages ", function (done) {
//     instanceManager.getDataStorages()
//         .then(() => {
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });


// var createdData;
// it("#04. should success when create data ", function (done) {
//     instanceManager.getDataStorages()
//         .then((data) => {
//             createdData = data;
//             done();
//         })
//         .catch((e) => {
//             done(e);
//         })
// });

// it("#05. should error when insert Stores data with same Stores data code", function (done) {
//     var newData=createdData;
//     instanceMigration.insertDataStorage(newData)
//     // instanceManager.getDataStorages()
//         .then((code) => {
//             createdData.code = code.code;
//             // return instanceMigration.insertDataStorage()
//             done("unable to insert same Stores data");

//         })
//         .catch((e) => {
//             done(e);
//         })
// });

it("#05. should success when migrate all data Storages ", function (done) {
    instanceMigration.migrateDataStorages()
        .then((result) => {
            // console.log(data);
            done();
        })

        .catch((e) => {
            done(e);
        })
});


