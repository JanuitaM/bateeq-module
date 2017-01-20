var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.inventory;
var generateCode = require('../../src/utils/code-generator');
var manager;
var testData;

function getData() {
    var source = testData.storages["UT-ACC"];
    var destination = testData.storages["UT-FNG"];
    var variant = testData.items["UT-AV1"];
    var variantComponent = testData.items["UT-AV2"];
    var finishingDoc = {};
    var now = new Date();
    var stamp = now / 1000 | 0;
    var code = stamp.toString(36);

    finishingDoc.code = code;
    finishingDoc.date = now; 
    finishingDoc.sourceId = source._id;
    finishingDoc.source = source;
    finishingDoc.destinationId = destination._id; 
    finishingDoc.destination = destination; 
    finishingDoc.reference = `reference[${code}]`; 
    finishingDoc.remark = `remark for ${code}`; 
    finishingDoc.items = [];
    
    
    now = new Date();
    stamp = now / 1000 | 0;
    var code2 = stamp.toString(36); 
    
    var item = {};
    item.itemId = variant._id;
    item.item = variant;
    item.item.finishings = [];
    //item.item.finishings.push({ quantity: 10, item: { name : code2 } });
    item.item.finishings.push({ itemId: variantComponent._id, quantity: 1000, item: variantComponent });
    finishingDoc.items.push(item);
     
    return finishingDoc;
}

function getDataWithNewComponent() {
    var source = testData.storages["UT-ACC"];
    var destination = testData.storages["UT-FNG"];
    var variant = testData.items["UT-AV1"];
    var variantComponent = testData.items["UT-AV2"];
    var finishingDoc = {};
    var now = new Date();
    var code = generateCode('UnitTest');

    finishingDoc.code = code;
    finishingDoc.date = now; 
    finishingDoc.sourceId = source._id;
    finishingDoc.source = source;
    finishingDoc.destinationId = destination._id; 
    finishingDoc.destination = destination; 
    finishingDoc.reference = `reference[${code}]`; 
    finishingDoc.remark = `remark for ${code}`; 
    finishingDoc.items = [];
    
    
    now = new Date();
    stamp = now / 1000 | 0;
    var code2 = stamp.toString(36); 
    
    var item = {};
    item.itemId = variant._id;
    item.item = variant;
    item.item.finishings = [];
    item.item.finishings.push({ quantity: 1000, item: { name : "New Component" } });
    item.item.finishings.push({ itemId: variantComponent._id, quantity: 1000, item: variantComponent });
    finishingDoc.items.push(item);
     
    return finishingDoc;
}

before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            var data = require("../data");
            data(db)
                .then(result => {
                    var FinishingTerimaKomponenManager = require('../../src/managers/inventory/efr-tb-sab-manager');
                    manager = new FinishingTerimaKomponenManager(db, {
                        username: 'unit-test'
                    });
                    testData = result;
                    done();
                }); 
        })
        .catch(e => {
            done(e);
        })
});

var createdId;
it('#01. should success when create new data', function(done) {
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
 
it('#02. should success when create new data With New Component', function(done) {
    var data = getDataWithNewComponent();
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
it(`#03. should success when get created data with id`, function(done) {
    manager.getSingleByQuery({_id:createdId})
        .then(data => {
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
}); 
 
it('#04. should error with property items minimum one', function(done) {
    manager.create({})
        .then(id => {
            done("Should not be error with property items minimum one");
        })
        .catch(e => {
            try { 
                e.errors.should.have.property('items');
                e.errors.items.should.String();
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});
