var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.inventory;
var generateCode = require('../../src/utils/code-generator');
var manager;
var testData;
var generateCode = require('../../src/utils/code-generator');

function getData() {
    var source = testData.suppliers["UT-S01"];
    var destination = testData.storages["UT-BJB"];
    var variant = testData.items["UT-AV1"];


    var TransferInDoc = require('bateeq-models').inventory.TransferInDoc;
    var TransferInItem = require('bateeq-models').inventory.TransferInItem;
    var transferInDoc = new TransferInDoc();

    var now = new Date();
    var code = generateCode('UnitTest');

    transferInDoc.code = generateCode("transfer-in-doc");;
    transferInDoc.date = now;

    transferInDoc.sourceId = source._id;
    transferInDoc.destinationId = destination._id;

    transferInDoc.reference = `reference[${code}]`;

    transferInDoc.remark = `remark for ${code}`;

    transferInDoc.items.push(new TransferInItem({
        itemId: variant._id,
        quantity: 5,
        remark: 'transferInExtDoc.test'
    }));

    return transferInDoc;
}

before('#00. connect db', function(done) {
    helper.getDb()
        .then(db => {
            var data = require("../data");
            data(db)
                .then(result => {

                    var TransferInDocExtManager = require('../../src/managers/inventory/transfer-in-doc-ext-manager');
                    manager = new TransferInDocExtManager(db, {
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
        });
});

var createdData;
it(`#02. should success when get created data with id`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.transferInDoc(data);
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#03. should success when update created data`, function(done) {

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

it(`#04. should success when get updated data with id`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
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

it(`#05. should success when delete data`, function(done) {
    manager.delete(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#06. should _deleted=true`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
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

it('#07. should error when create new data with same code', function(done) {
    var data = Object.assign({}, createdData);
    delete data._id;
    manager.create(data)
        .then(id => {
            id.should.be.Object();
            createdId = id;
            done("Should not be able to create data with same code");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('code');
                done();
            }
            catch (xe) {
                done(xe);
            };
        })
});

it('#08. should error with property items minimum one', function(done) {
    manager.create({})
        .then(id => {
            done("Should not be error with property items minimum one");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('code');
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

it('#09. should error with property items must be greater one', function(done) {
    manager.create({
            items: [{}, {
                itemId: '578dd8a976d4f1003e0d7a3f'
            }, {
                quantity: 0
            }]
        })
        .then(id => {
            done("Should not be error with property items must be greater one");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('code');
                e.errors.should.have.property('sourceId');
                e.errors.should.have.property('destinationId');
                e.errors.should.have.property('items');
                e.errors.items.should.Array();
                for (var i of e.errors.items) {
                    i.should.have.property('itemId');
                    i.should.have.property('quantity');
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});