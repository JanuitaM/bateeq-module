var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.inventory;
var generateCode = require('../../src/utils/code-generator');
var manager;
var manager2;
var manager3;
var testData;

function getData(refNo) {

    var source = testData.storages["UT-ACC"];
    var destination = testData.storages["UT-ST1"];
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

    transferInDoc.reference = refNo;

    transferInDoc.remark = `remark for ${code}`;

    transferInDoc.items.push(new TransferInItem({ itemId: variant._id, quantity: 1, remark: 'transferInDoc.test' }));

    return transferInDoc;
}

function getDataSPK() {
    var source = testData.storages["UT-ACC"];
    var destination = testData.storages["UT-ST1"];
    var variant = testData.items["UT-AV1"];

    var SpkDoc = require('bateeq-models').merchandiser.SPK;
    var SpkItem = require('bateeq-models').merchandiser.SPKItem;
    var spkDoc = new SpkDoc();
    var now = new Date();
    spkDoc.date = now;
    spkDoc.sourceId = source._id;
    spkDoc.destinationId = destination._id;

    spkDoc.isReceived = false;

    spkDoc.reference = `reference[${spkDoc.date}]`;

    spkDoc.items.push(new SpkItem({ itemId: variant._id, quantity: 1, remark: 'SPK PBA.test' }));
    return spkDoc;
}

before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            var data = require("../data");
            data(db)
                .then(result => {
                    var TokoTerimaAksesorisManager = require('../../src/managers/inventory/efr-tb-bat-manager');
                    manager = new TokoTerimaAksesorisManager(db, {
                        username: 'unit-test'
                    });

                    var SPKBarangEmbalaseManager = require('../../src/managers/merchandiser/efr-pk-pba-manager');
                    manager2 = new SPKBarangEmbalaseManager(db, {
                        username: 'unit-test'
                    });

                    var SPKManager = require('../../src/managers/merchandiser/efr-pk-manager');
                    manager3 = new SPKManager(db, {
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


var createdRef;
var dataSPK;
it('#01. should success when create new SPK data', function (done) {
    dataSPK = getDataSPK();
    manager2.create(dataSPK)
        .then(id => {
            id.should.be.Object();
            manager3.getSingleById(id)
                .then(spkDoc => {
                    createdRef = spkDoc.packingList;
                    dataSPK.password = spkDoc.password;
                    done();
                })
                .catch(e => {
                    done();
                })
        })
        .catch(e => {
            done(e);
        })
});

var createdId;
it('#02. should error when create new data with invalid password', function (done) {
    var data = getData(createdRef);
    data.password = "12345678";
    manager.create(data)
        .then(id => {
            done("should error if insert invalid password");
        })
        .catch(e => {
            e.errors.should.have.property('password');
            e.errors.password.should.String();
            done();
        })
});

it('#03. should success when create new data', function (done) {
    var data = getData(createdRef);
    data.password = dataSPK.password;
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
it(`#04. should success when get created data with id`, function (done) {
    manager.getSingleByQuery({ _id: createdId })
        .then(data => {
            validate.transferInDoc(data);
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#05. should error when update created data`, function (done) {
    createdData.remark += '[updated]';
    createdData.password = dataSPK.password;
    var TransferInItem = require('bateeq-models').inventory.TransferInItem;
    manager.update(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done("should not update transfer in, spk must be already received");
        })
        .catch(e => {
            e.errors.should.have.property('isReceived');
            e.errors.isReceived.should.String();
            done();
        });
});

it(`#06. should success when get updated data with id`, function (done) {
    manager.getSingleByQuery({ _id: createdId })
        .then(data => {
            validate.transferInDoc(data);
            done();
        })
        .catch(e => {
            e.errors.should.have.property('reference');
            e.errors.reference.should.String();
            done(e);
        })
});

it(`#07. should unable to delete data`, function (done) {
    manager.delete(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done("should not delete transfer in, spk must be already received");
        })
        .catch(e => {
            e.errors.should.have.property('isReceived');
            e.errors.isReceived.should.String();
            done();
        });
});

it(`#08. should _deleted=false`, function (done) {
    manager.getSingleByQuery({ _id: createdId })
        .then(data => {
            validate.transferInDoc(data);
            data._deleted.should.be.Boolean();
            data._deleted.should.equal(true);
            done("should not delete transfer in, spk must be already received");
        })
        .catch(e => {
            done();
        })
});

it('#09. should error with property items minimum one', function (done) {
    createdData.items = [];
    manager.create(createdData)
        .then(id => {
            done("Should not be error with property items minimum one");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('items');
                e.errors.items.should.String();
                done();
            } catch (ex) {
                done(ex);
            }
        })
});

it('#10. should error with reference is exist and quantity items is 0', function (done) {
    createdData.items = [{ itemId: "578855c4964302281454fa51", quantity: 0, remark: 'transferInDoc.test' }];
    manager.create(createdData)
        .then(id => {
            done("should error with reference is exist and quantity items is 0");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('items');
                e.errors.should.have.property('isReceived'); 
                done();
            } catch (ex) {
                done(ex);
            }
        })
});