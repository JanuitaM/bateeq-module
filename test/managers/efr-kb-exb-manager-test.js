var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.inventory;
var generateCode = require('../../src/utils/code-generator');
var manager;
var testData;

function getData() {
    return new Promise((resolve, reject) => {
        var spkHelper = require('../spk-helper');
        spkHelper.createSpkPba()
            .then(data => {
                var source = testData.storages["UT-FNG"];
                var destination = testData.storages["UT-ST1"];
                var variant = testData.items["UT-AV1"];
                var spk = data;

                var expeditionDoc = {};
                var now = new Date();
                var code = generateCode('UnitTest');

                for (var item of spk.items) {
                    item.quantitySend = item.quantity;
                }

                expeditionDoc.code = code;
                expeditionDoc.date = now;
                expeditionDoc.expedition = "expedition";
                expeditionDoc.weight = "1";
                expeditionDoc.sourceId = source._id;
                expeditionDoc.destinationId = destination._id;
                expeditionDoc.reference = `reference[${code}]`;
                expeditionDoc.spkDocuments = [{ spkDocumentId: spk._id, spkDocument: spk }];

                resolve(expeditionDoc);
            })
            .catch(e => {
                reject(e);
            })
    });
}

before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            var data = require("../data");
            data(db)
                .then(result => {
                    var PusatBarangBaruKirimBarangJadiAksesorisManager = require('../../src/managers/inventory/efr-kb-exb-manager');
                    manager = new PusatBarangBaruKirimBarangJadiAksesorisManager(db, {
                        username: 'unit-test'
                    });
                    testData = result;

                    done();
                })
                .catch(e => {
                    done(e);
                });
        })
        .catch(e => {
            done(e);
        })
});

var createdId;
it('#01. should success when create new data', function (done) {
    getData()
        .then(data => {
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


it('#03. should error with property SPKDocuments minimum one', function (done) {
    manager.create({})
        .then(id => {
            done("Should not be error with property SPKDocuments minimum one");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('destinationId');
                e.errors.should.have.property('expedition');
                e.errors.should.have.property('weight');
                e.errors.should.have.property('spkDocuments');
                e.errors.spkDocuments.should.String();
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#04. should error with property Quantity Send not same with Quantity', function (done) {
    manager.create({ createdData })
        .then(id => {
            done("Should not be error with property Quantity Send not same with Quantity");
        })
        .catch(e => {
            try {
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});