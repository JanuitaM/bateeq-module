var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.inventory;
var generateCode = require('../../src/utils/code-generator');

var transferInManager;
var altOutManager;
var altInManager;
var bjrInManager;

var testData;

function generateBJR(){
    var source = testData.storages["UT-BJR"];
    var destination = testData.storages["UT-FNG"];
    var variant = testData.items["UT-AV1"];


    var TransferInDoc = require('bateeq-models').inventory.TransferInDoc;
    var TransferInItem = require('bateeq-models').inventory.TransferInItem;
    var transferInDoc = new TransferInDoc();

    var now = new Date();
    var code = generateCode('UnitTest');

    transferInDoc.code = code;
    transferInDoc.date = now;

    transferInDoc.sourceId = source._id;
    transferInDoc.destinationId = destination._id;

    transferInDoc.reference = `reference[${code}]`;

    transferInDoc.remark = `remark for ${code}`;

    transferInDoc.items.push(new TransferInItem({
        itemId: variant._id,
        quantity: 2,
        remark: 'transferInDoc.test'
    }));

    return transferInDoc;
}

function generateALTIn(ref){
    var source = testData.storages["UT-FNG"];
    var destination = testData.storages["UT-SWG"];
    var variant = testData.items["UT-AV1"];


    var TransferOutDoc = require('bateeq-models').inventory.TransferOutDoc;
    var TransferOutItem = require('bateeq-models').inventory.TransferOutItem;
    var transferOutDoc = new TransferOutDoc();

    var now = new Date();
    var stamp = now / 1000 | 0;
    var code = stamp.toString(36);

    transferOutDoc.code = code;
    transferOutDoc.date = now;

    transferOutDoc.sourceId = source._id;
    transferOutDoc.destinationId = destination._id;

    transferOutDoc.reference = ref;

    transferOutDoc.remark = `remark for ${code}`;

    transferOutDoc.items.push(new TransferOutItem({
        itemId: variant._id,
        quantity: 2,
        remark: 'ef-kb-alt-doc.test'
    }));

    return transferOutDoc;
}

function generateALTOut(ref){
    var source = testData.storages["UT-SWG"];
    var destination = testData.storages["UT-FNG"];
    var variant = testData.items["UT-AV1"];


    var TransferInDoc = require('bateeq-models').inventory.TransferInDoc;
    var TransferInItem = require('bateeq-models').inventory.TransferInItem;
    var transferInDoc = new TransferInDoc();

    var now = new Date();
    var stamp = now / 1000 | 0;
    var code = stamp.toString(36);

    transferInDoc.code = code;
    transferInDoc.date = now;

    transferInDoc.sourceId = source._id;
    transferInDoc.destinationId = destination._id;

    transferInDoc.reference = ref;

    transferInDoc.remark = `remark for ${code}`;

    transferInDoc.items.push(new TransferInItem({
        itemId: variant._id,
        quantity: 2,
        remark: 'ef-tb-alt-doc.test'
    }));

    return transferInDoc;
}

before('#00. connect db', function(done) {
    helper.getDb()
        .then(db => {
            var data = require("../data");
            data(db)
                .then(result => {

                    var AlterationOutManager = require('../../src/managers/inventory/efr-kb-alt-manager');
                    altOutManager = new AlterationOutManager(db, {
                        username: 'unit-test'
                    });

                    var ReturTokoManager = require('../../src/managers/inventory/efr-tb-bjr-manager');
                    bjrInManager = new ReturTokoManager(db, {
                        username: 'unit-test'
                    });

                    var AlterationInManager = require('../../src/managers/inventory/efr-tb-alt-manager');
                    altInManager = new AlterationInManager(db, {
                        username: 'unit-test'
                    });
                    
                    testData = result;

                    done();
                });
        })
        .catch(e => {
            done(e);
        });
});


var createdRef;
var dataBJR;
it('#01. should success when create new Retur data', function(done) {
    dataBJR = generateBJR();
    bjrInManager.create(dataBJR)
        .then(id => {
            id.should.be.Object();
            bjrInManager.getSingleById(id)
            .then(bjrDoc => {
                createdRef = bjrDoc.code;
                done();    
            })
            .catch(e =>{
                done();
            })
        })
        .catch(e => {
            done(e);
        })
});

var createdAltRef;
var dataAltOut;
it('#02. should success when create new alteration out data', function(done) {
    dataAltOut = generateALTOut(createdRef);
    altOutManager.create(dataAltOut)
        .then(id => {
            id.should.be.Object();
            altOutManager.getSingleById(id)
            .then(altDoc => {
                createdAltRef = altDoc.code;
                done();    
            })
            .catch(e =>{
                done();
            })
        })
        .catch(e => {
            done(e);
        })
});

var createdId;
it('#03. should success when create new ALteration in data', function(done) {
    var data = generateALTOut(createdAltRef);
    altInManager.create(data)
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
it(`#04. should success when get created data with id`, function(done) {
    altInManager.getSingleById(createdId)
        .then(data => {
            validate.transferOutDoc(data);
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it('#05. should error when create data with invalid reference', function(done) {
    var data = generateALTIn("INVALIDREF");
    altInManager.create(data)
        .then(id => {
            done("Should not create with invalid reference");
        })
        .catch(e => {
            e.errors.should.have.property('reference');
            e.errors.reference.should.String();
            done();
        })
});