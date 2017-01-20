var helper = require('./helper');
var data = require("./data");

var createSpkPba = function () {
    return new Promise((resolve, reject) => {
        newSpkPba()
            .then(spk => {
                helper.getDb()
                    .then(db => {

                        var SPKBarangEmbalaseManager = require('../src/managers/merchandiser/efr-pk-pba-manager');
                        var manager = new SPKBarangEmbalaseManager(db, {
                            username: 'unit-test'
                        });

                        manager.create(spk)
                            .then(id => {
                                manager.getSingleById(id)
                                    .then(createdSpk => {
                                        resolve(createdSpk);
                                    })
                                    .catch(e => {
                                        reject(e);
                                    })
                            })
                            .catch(e => {
                                reject(e);
                            })
                    })
                    .catch(e => {
                        reject(e);
                    });
            })
            .catch(e => {
                reject(e);
            })
    });
}

var newSpkPba = function () {
    return new Promise((resolve, reject) => {
        helper.getDb()
            .then(db => {
                data(db)
                    .then(testData => {
                        var source = testData.storages["UT-ACC"];
                        var destination = testData.storages["UT-ST1"];
                        var variant = testData.variants["UT-AV1"];

                        var SpkDoc = require('bateeq-models').merchandiser.SPK;
                        var SpkItem = require('bateeq-models').merchandiser.SPKItem;
                        var spkDoc = new SpkDoc();
                        var now = new Date();
                        spkDoc.date = now;
                        spkDoc.sourceId = source._id;
                        spkDoc.destinationId = destination._id;

                        spkDoc.reference = `reference[${spkDoc.date}]`;
                        spkDoc.items.push(new SpkItem({ articleVariantId: variant._id, quantity: 1, remark: 'SPK PBA.test' }));

                        resolve(spkDoc);
                    })
                    .catch(e => {
                        reject(e);
                    })
            })
            .catch(e => {
                reject(e);
            })
    });
}


module.exports = {
    newSpkPba: newSpkPba,
    createSpkPba: createSpkPba
};