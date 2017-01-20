var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.inventory;
var generateCode = require('../../src/utils/code-generator');
var manager;
var manager2;
var manager3;
var testData;

function getDataHp() {
    var source = testData.storages["UT-FNG"];
    var destination = testData.storages["UT-FNG"];
    var variant = testData.items["UT-AV1"];
    var variantComponent = testData.items["UT-AV2"];

    var now = new Date();
    var finishingDoc = {};
    var code = generateCode('UnitTest');

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

function getDataKbFng() {
    var source = testData.storages["UT-FNG"];
    var destination = testData.storages["UT-BJB"];
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
    transferOutDoc.reference = `reference for ${code}`;
    transferOutDoc.remark = `remark for ${code}`;
    transferOutDoc.items.push(new TransferOutItem({ itemId: variant._id, quantity: 1, remark: 'transferOutDoc.test' }));

    return transferOutDoc;

}

function getData() {
    var source = testData.storages["UT-FNG"];
    var destination = testData.storages["UT-BJB"];
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

    transferInDoc.reference = `reference[${code}]`;

    transferInDoc.remark = `remark for ${code}`;

    transferInDoc.items.push(new TransferInItem({ itemId: variant._id, quantity: 10, remark: 'transferInDoc.test' }));

    return transferInDoc;
}

before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            var data = require("../data");
            data(db)
                .then(result => {
                    var PusatBarangBaruTerimaBarangBaruManager = require('../../src/managers/inventory/efr-tb-bjb-manager');
                    manager = new PusatBarangBaruTerimaBarangBaruManager(db, {
                        username: 'unit-test'
                    });
                    var FinishingKirimBarangBaruManager = require('../../src/managers/inventory/efr-kb-fng-manager');
                    manager2 = new FinishingKirimBarangBaruManager(db, {
                        username: 'unit-test'
                    });
                    var FinishedGoodsManager = require('../../src/managers/inventory/efr-hp-fng-manager');
                    manager3 = new FinishedGoodsManager(db, {
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

var dataHpId;
it('#01. should success when create new data hasil produksi', function (done) {
    var data = getDataHp();
    manager3.create(data)
        .then(id => {
            id.should.be.Object();
            dataHpId = id;
            done();
        })
        .catch(e => {
            done(e);
        })
});

var dataHp;
it('#02. should success when get data by id hasil produksi', function (done) {
    manager3.getSingleByQuery({ _id: dataHpId })
        .then(data => {
            dataHp = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

var dataKbFngId;
it('#03. should success when create new data', function (done) {
    var data;
    manager3.getByCodeOrDefault(dataHp.code)
        .then(HpDataByCode => {
            data = getData();
            data.reference = HpDataByCode.code;
            data.items = HpDataByCode.transferInDocument.items;
            manager2.create(data)
                .then(id => {
                    id.should.be.Object();
                    dataKbFngId = id;
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

var dataKbFng;
it('#04. should success when get data by id kb fng', function (done) {
    manager2.getSingleByQuery({ _id: dataKbFngId })
        .then(data => {
            dataKbFng = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

var createdId;
it('#05. should success when create new data', function (done) {
    var data;
    manager2.getByCodeOrDefault(dataKbFng.code)
        .then(KbFngData => {
            data = getData();
            data.reference = KbFngData.code;
            data.items = KbFngData.items;
            manager.create(data)
                .then(id => {
                    id.should.be.Object();
                    createdId = id;
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

var createdData;
it(`#06. should success when get created data with id`, function (done) {
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

it(`#07. should success when update created data`, function (done) {

    createdData.reference += '[updated]';
    createdData.remark += '[updated]';

    var TransferInItem = require('bateeq-models').inventory.TransferInItem;

    manager.update(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#08. should success when get updated data with id`, function (done) {
    manager.getSingleByQuery({ _id: createdId })
        .then(data => {
            validate.transferInDoc(data);
            data.remark.should.equal(createdData.remark);
            data.reference.should.equal(createdData.reference);
            data.items.length.should.equal(1);
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#09. should success when delete data`, function (done) {
    manager.delete(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#10. should _deleted=true`, function (done) {
    manager.getSingleByQuery({ _id: createdId })
        .then(data => {
            validate.transferInDoc(data);
            data._deleted.should.be.Boolean();
            data._deleted.should.equal(true);
            done();
        })
        .catch(e => {
            done(e);
        })
});

it('#11. should error with property items minimum one', function (done) {
    manager.create({})
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

it('#12. should error with property items must be greater one', function (done) {
    manager.create({
        items: [
            { itemId: '578dd8a976d4f1003e0d7a3f' },
            { quantity: 0 }]
    })
        .then(id => {
            done("Should not be error with property items must be greater one");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('items');
                e.errors.items.should.Array();
                for (var i of e.errors.items) {
                    i.should.have.property('itemId');
                    i.should.have.property('quantity');
                }
                done();
            } catch (ex) {
                done(ex);
            }
        })
});