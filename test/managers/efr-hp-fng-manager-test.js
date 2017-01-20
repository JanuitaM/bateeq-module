var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.inventory;
var generateCode = require('../../src/utils/code-generator');
var manager;
var testData;

function getData() {
    var source = testData.storages["UT-FNG"];
    var destination = testData.storages["UT-FNG"];
    var variant = testData.items["UT-AV1"];
    var variantComponent = testData.items["UT-AV2"];

    var finishingDoc = {};
    var now = new Date();
    var code = generateCode('UnitTest');

    finishingDoc.code = code;
    finishingDoc.date = now;
    finishingDoc.sourceId = source._id;
    finishingDoc.destinationId = destination._id;
    finishingDoc.reference = `reference[${code}]`;
    finishingDoc.remark = `remark for ${code}`;
    finishingDoc.items = [];

    var item = {};
    item.quantity = 1;
    item.itemId = variant._id;
    item.item = variant;
    item.item.finishings = [];
    item.item.finishings.push({ itemId: variantComponent._id, quantity: 1, item: variantComponent });
    finishingDoc.items.push(item);

    return finishingDoc;
}

before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            var data = require("../data");
            data(db)
                .then(result => {
                    var FinishedGoodsManager = require('../../src/managers/inventory/efr-hp-fng-manager');
                    manager = new FinishedGoodsManager(db, {
                        username: 'unit-test'
                    });
                    testData = result;
                    done();
                })
                .catch(e => {
                    done(e);
                })
        })
        .catch(e => {
            done(e);
        })
});

var createdId;
it('#01. should success when create new data', function (done) {
    var data = getData();
    manager.create(data)
        .then(id => {
            id.should.be.Object();
            createdId = id;
            done();
        })
        .catch(e => {
            done(e);
        })
});

var createdData;
it(`#02. should success when get created data with id`, function (done) {
    manager.getSingleByQuery({ _id: createdId })
        .then(data => {
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it('#03. should error with property items minimum one', function(done) {
    manager.create({})
        .then(id => {
            done("Should not be error with property items minimum one");
        })
        .catch(e => {
            try { 
                e.errors.should.have.property('sourceId');
                e.errors.should.have.property('destinationId'); 
                e.errors.should.have.property('items');
                e.errors.items.should.String();
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});