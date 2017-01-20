var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.inventory;
var generateCode = require('../../src/utils/code-generator');
var manager;
var manager2;
var manager3;
var manager4;
var testData;

function getData() {
    var source = testData.storages["UT-ACC"];
    var destination = testData.storages["UT-ST2"];
    var variant = testData.items["UT-AV1"];

    var TransferOutDoc = require('bateeq-models').inventory.TransferOutDoc;
    var TransferOutItem = require('bateeq-models').inventory.TransferOutItem;
    var transferOutDoc = new TransferOutDoc();

    var now = new Date();
    var code = generateCode('UnitTest');

    transferOutDoc.code = code;
    transferOutDoc.date = now;

    transferOutDoc.destinationId = destination._id;
    transferOutDoc.sourceId = source._id;

    transferOutDoc.reference = `reference[${code}]`;

    transferOutDoc.remark = `remark for ${code}`;

    transferOutDoc.items.push(new TransferOutItem({ itemId: variant._id, quantity: 1, remark: 'doc efr-kb-rtf' }));

    return transferOutDoc;
}

function getDataKbRtp() {
    var source = testData.storages["UT-ACC"];
    var destination = testData.storages["UT-ST2"];
    var variant = testData.items["UT-AV1"];

    var TransferOutDoc = require('bateeq-models').inventory.TransferOutDoc;
    var TransferOutItem = require('bateeq-models').inventory.TransferOutItem;
    var transferOutDoc = new TransferOutDoc();

    var now = new Date();
    var stamp = now / 1000 | 0;
    var code = stamp.toString(36);

    transferOutDoc.code = code;
    transferOutDoc.date = now;

    transferOutDoc.destinationId = destination._id;
    transferOutDoc.sourceId = source._id;

    transferOutDoc.reference = `reference[${code}]`;

    transferOutDoc.remark = `remark for ${code}`;

    transferOutDoc.items.push(new TransferOutItem({ itemId: variant._id, quantity: 1, remark: 'doc efr-kb-rtp' }));

    return transferOutDoc;
}

function getDataSPK() {
    var source = testData.storages["UT-ACC"];
    var destination = testData.storages["UT-ST2"];
    var variant = testData.items["UT-AV1"];

    var SpkDoc = require('bateeq-models').merchandiser.SPK;
    var SpkItem = require('bateeq-models').merchandiser.SPKItem;
    var spkDoc = new SpkDoc();
    var now = new Date();
    spkDoc.date = now;
    spkDoc.sourceId = source._id;
    spkDoc.destinationId = destination._id;

    spkDoc.isReceived = true;

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
                    var PusatReturTokoKirimBarangReturManager = require('../../src/managers/inventory/efr-kb-rtf-manager');
                    manager = new PusatReturTokoKirimBarangReturManager(db, {
                        username: 'unit-test'
                    });

                    var TokoKirimBarangReturnManager = require('../../src/managers/inventory/efr-kb-rtp-manager');
                    manager2 = new TokoKirimBarangReturnManager(db, {
                        username: 'unit-test'
                    });

                    var SPKBarangEmbalaseManager = require('../../src/managers/merchandiser/efr-pk-pba-manager');
                    manager3 = new SPKBarangEmbalaseManager(db, {
                        username: 'unit-test'
                    });
                    var SPKManager = require('../../src/managers/merchandiser/efr-pk-manager');
                    manager4 = new SPKManager(db, {
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
    manager3.create(dataSPK)
        .then(id => {
            id.should.be.Object();
            manager4.getSingleById(id)
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

var codeKbRtp;
var dataKbRtp;
it('#02. should success when create new KB RTP data', function (done) {
    dataKbRtp = getDataKbRtp();
    dataKbRtp.reference = createdRef;
    manager2.create(dataKbRtp)
        .then(id => {
            id.should.be.Object();
            manager2.getSingleById(id)
                .then(KbRtp => {
                    codeKbRtp = KbRtp.code;
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
it('#03. should success when create new data', function (done) {
    var data = getData();
    data.reference = codeKbRtp;
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
            validate.transferOutDoc(data);
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#05. should success when update created data`, function (done) {

    createdData.remark += '[updated]';

    var TransferOutItem = require('bateeq-models').inventory.TransferOutItem;

    manager.update(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#06. should success when get updated data with id`, function (done) {
    manager.getSingleByQuery({ _id: createdId })
        .then(data => {
            validate.transferOutDoc(data);
            data.remark.should.equal(createdData.remark);
            data.reference.should.equal(createdData.reference);
            data.items.length.should.equal(1);
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#07. should success when delete data`, function (done) {
    manager.delete(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#08. should _deleted=true`, function (done) {
    manager.getSingleByQuery({ _id: createdId })
        .then(data => {
            validate.transferOutDoc(data);
            data._deleted.should.be.Boolean();
            data._deleted.should.equal(true);
            done();
        })
        .catch(e => {
            done(e);
        })
});


it('#09. should error with property items minimum one', function (done) {
    var data = getData();
    data.reference = codeKbRtp;
    data.items = [];
    manager.create(data)
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

it('#10. should error with property items must be greater one', function (done) {
    var data = getData();
    data.reference = codeKbRtp;
    data.items = [{ itemId: '578dd8a976d4f1003e0d7a3f' },
        { quantity: 0 }];
    manager.create(data)
        .then(id => {
            done("Should not be error with property items must be greater one");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('items');
                e.errors.items.should.Array();
                for (var i of e.errors.items) { 
                    i.should.have.property('quantity');
                }
                done();
            } catch (ex) {
                done(ex);
            }
        })
});