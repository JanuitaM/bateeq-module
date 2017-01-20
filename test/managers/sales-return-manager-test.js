var should = require('should');
var helper = require('../helper');
var generateCode = require('../../src/utils/code-generator');
var manager;
var testData;
var generateCode = require('../../src/utils/code-generator');

function getData() {
    return new Promise((resolve, reject) => {
        var salesHelper = require('../sales-helper');
        salesHelper.createSales()
            .then(salesData => {
                var store = testData.stores["ST-BJB"];
                var bank = testData.banks["BA-BCA"];                    //BCA, MANDIRI, BRI, dkk
                var cardType = testData.cardTypes["CT-VISA"];           //CARD, MASTERCARD, VISA
                var variant = testData.finishedGoods["UT-FG1"];

                var Sales = require('bateeq-models').sales.Sales;
                var SalesItem = require('bateeq-models').sales.SalesItem;
                var SalesDetail = require('bateeq-models').sales.SalesDetail;
                var sales = new Sales();

                var now = new Date();
                var code = generateCode('UnitTest');

                sales.code = generateCode("sales-return");;
                sales.date = now;
                sales.discount = 0;
                sales.reference = salesData._id;
                sales.remark = '';

                sales.storeId = store._id;
                sales.store = store;

                saleRetur1 = new SalesItem({
                    itemId: variant._id,
                    item: variant,
                    promoId: '',
                    promo: {},
                    quantity: 1,
                    price: 100000,
                    discount1: 0,
                    discount2: 0,
                    margin: 0,
                    specialDiscount: 0,
                    total: 100000
                })

                sales.items.push(new SalesItem({
                    itemId: salesData.items[0].itemId,
                    item: salesData.items[0].item,
                    promoId: salesData.items[0].promoId,
                    promo: salesData.items[0].promo,
                    quantity: 1,
                    price: salesData.items[0].price,
                    discount1: salesData.items[0].discount1,
                    discount2: salesData.items[0].discount2,
                    margin: salesData.items[0].margin,
                    specialDiscount: salesData.items[0].specialDiscount,
                    total: 100000,
                    returnItems: [saleRetur1]
                }));

                sales.salesDetail = new SalesDetail({
                    paymentType: 'Cash', //Cash, Card, Partial
                    voucherId: {},
                    voucher: {},
                    bankId: {},
                    bank: {},
                    bankCardId: {},
                    bankCard: {},
                    cardTypeId: {},
                    cardType: {},
                    card: '', //Debit | Credit
                    cardNumber: '',
                    cardName: '',
                    cashAmount: 1000000000,
                    cardAmount: 0
                })
                resolve(sales);
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
                    var SalesManager = require('../../src/managers/sales/sales-return-manager');
                    manager = new SalesManager(db, {
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
var createdData;
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
                });
        })
        .catch(e => {
            done(e);
        })
});

it(`#02. should success when get created data with id`, function (done) {
    manager.getSingleByQuery({
        _id: createdId
    })
        .then(data => {
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
}); 