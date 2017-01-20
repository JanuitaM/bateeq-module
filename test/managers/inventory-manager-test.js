var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.inventory;
var manager;
var testData;


var storageId;
var itemId;

before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            var data = require("../data");
            data(db)
                .then(result => {
                    var InventoryManager = require('../../src/managers/inventory/inventory-manager');
                    manager = new InventoryManager(db, {
                        username: 'unit-test'
                    });
                    testData = result;
                    storageId = testData.storages["UT-FNG"]._id.toString();
                    itemId = testData.items["UT-AV1"]._id.toString(); 
                    done();
                });
        })
        .catch(e => {
            done(e);
        })
});



var createdInId;
it('#01. should success when move-in new data', function (done) { 
    manager.in(storageId, 'unit-test', itemId, 10, 'remark-unit-test')
        .then(id => {
            id.should.be.Object();
            createdInId = id;
            done();
        })
        .catch(e => {
            done(e);
        })
});

var createdOutId;
it('#02. should success when move-out new data', function (done) {

    manager.out(storageId, 'unit-test', itemId, 10, 'remark-unit-test')
        .then(id => {
            id.should.be.Object();
            createdOutId = id;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it('#03. should success when read by storageId', function (done) {
    manager.readByStorageId(storageId)
        .then(inventories => {
            inventories.should.not.equal(null);
            inventories.data.should.instanceof(Array);

            done();
        })
        .catch(e => {
            done(e);
        })
});

it('#04. should success when read by storageId and itemId', function (done) {
    manager.getByStorageIdAndItemId(storageId, itemId)
        .then(inventory => {
            validate.inventory(inventory)
            done();
        })
        .catch(e => {
            done(e);
        })
});