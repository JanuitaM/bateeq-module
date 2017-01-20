var should = require('should');
var helper = require('../helper');
var generateCode = require('../../src/utils/code-generator');
var manager;
var testData;
var generateCode = require('../../src/utils/code-generator');

function getData() {
    var store = testData.stores["ST-BJB"];
    var bank = testData.banks["BA-BCA"];                    //BCA, MANDIRI, BRI, dkk
    var cardType = testData.cardTypes["CT-VISA"];           //CARD, MASTERCARD, VISA
    var variant = testData.finishedGoods["UT-FG2"];

    var Sales = require('bateeq-models').sales.Sales;
    var SalesItem = require('bateeq-models').sales.SalesItem;
    var SalesDetail = require('bateeq-models').sales.SalesDetail;
    var sales = new Sales();

    var now = new Date();
    var code = generateCode('UnitTest');

    sales.code = generateCode("sales");;
    sales.date = now;
    sales.discount = 0;
    sales.reference = '';
    sales.remark = '';

    sales.storeId = store._id;
    sales.store = store;

    sales.items.push(new SalesItem({
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
    }));

    var salesTotal = 0;
    for (var i of sales.items) {
        salesTotal += i.total;
    }

    sales.salesDetail = new SalesDetail({
        paymentType: 'Card', //Cash, Card, Partial
        voucherId: {},
        voucher: {},
        bankId: bank._id,
        bank: bank,
        bankCardId: bank._id,
        bankCard: bank,
        cardTypeId: cardType._id,
        cardType: cardType,
        card: 'Credit', //Debit | Credit
        cardNumber: '1000200030004000',
        cardName: 'CardName',
        cashAmount: 0,
        cardAmount: salesTotal
    })
    return sales;
}


function getDataCash() {
    var store = testData.stores["ST-BJB"];
    var bank = testData.banks["BA-BCA"];                    //BCA, MANDIRI, BRI, dkk
    var cardType = testData.cardTypes["CT-VISA"];           //CARD, MASTERCARD, VISA
    var variant = testData.finishedGoods["UT-FG2"];

    var Sales = require('bateeq-models').sales.Sales;
    var SalesItem = require('bateeq-models').sales.SalesItem;
    var SalesDetail = require('bateeq-models').sales.SalesDetail;
    var sales = new Sales();

    var now = new Date();
    var code = generateCode('UnitTest');

    sales.code = generateCode("sales-cash");;
    sales.date = now;
    sales.discount = 0;
    sales.reference = '';
    sales.remark = '';

    sales.storeId = store._id;
    sales.store = store;

    sales.items.push(new SalesItem({
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
    }));

    var salesTotal = 0;
    for (var i of sales.items) {
        salesTotal += i.total;
    }

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
        cashAmount: salesTotal,
        cardAmount: 0
    })
    return sales;
}


function getDataPartial() {
    var store = testData.stores["ST-BJB"];
    var bank = testData.banks["BA-BCA"];                    //BCA, MANDIRI, BRI, dkk
    var cardType = testData.cardTypes["CT-VISA"];           //CARD, MASTERCARD, VISA
    var variant = testData.finishedGoods["UT-FG2"];

    var Sales = require('bateeq-models').sales.Sales;
    var SalesItem = require('bateeq-models').sales.SalesItem;
    var SalesDetail = require('bateeq-models').sales.SalesDetail;
    var sales = new Sales();

    var now = new Date();
    var code = generateCode('UnitTest');

    sales.code = generateCode("sales-partial");;
    sales.date = now;
    sales.discount = 0;
    sales.reference = '';
    sales.remark = '';

    sales.storeId = store._id;
    sales.store = store;

    sales.items.push(new SalesItem({
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
    }));

    var salesTotal = 0;
    for (var i of sales.items) {
        salesTotal += i.total;
    }

    sales.salesDetail = new SalesDetail({
        paymentType: 'Partial', //Cash, Card, Partial
        voucherId: {},
        voucher: {},
        bankId: bank._id,
        bank: bank,
        bankCardId: bank._id,
        bankCard: bank,
        cardTypeId: cardType._id,
        cardType: cardType,
        card: 'Credit', //Debit | Credit
        cardNumber: '1000200030004000',
        cardName: 'CardName',
        cashAmount: 10000,
        cardAmount: salesTotal - 10000
    })
    return sales;
}


before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            var data = require("../data");
            data(db)
                .then(result => {
                    var SalesManager = require('../../src/managers/sales/sales-manager');
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

it(`#02. should success when get created data with id`, function(done) {
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

// it('#09. should success with property discount equal to 100 ', function (done) {
//     var data = getData();
//     data.discount = 100;
//     manager.create(data)
//         .then(id => {

//             done();
//         })
//         .catch(e => {
//             done(ex);
//         })
// });

// it('#09. should success discount equal  0 ', function (done) {
//     var data = getData();
//     data.items[0].price = 0;
//     manager.create(data)
//         .then(id => {
//             id.should.be.Object();
//             done();
//         })
//         .catch(e => {
//             done(e);
//         })
// });


// it('#09. should error discount equal  -5 ', function (done) {
//     var data = getData();
//     data.items[0].price = -5;
//     manager.create(data)
//         .then(id => { 
//             done("discount != -5"); 
//         }).catch(e => {
//             for (var i=0 ; i< e.errors.items.length; i++)
//             e.errors.items[i].should.have.property('price');
//             done();
//         })
// });

it(`#03. should success when update created data`, function(done) {  
    createdData.remark += '[updated]';  
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
            data.remark.should.equal(createdData.remark); 
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
            data._deleted.should.be.Boolean();
            data._deleted.should.equal(true);
            done();
        })
        .catch(e => {
            done(e);
        })
}); 

it('#07. should error with property items, storeId, date ', function(done) { 
    manager.create({ date : '' })
        .then(id => {
            done("Should not be error with property items, storeId, date");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('items');
                e.errors.should.have.property('storeId');
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#08. should error with property discount less than 0 ', function(done) {
    var data = getData();
    data.discount = -1;
    manager.create(data)
        .then(id => {
            done("Should not be error with property discount less than 0");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('discount');
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#09. should error with property discount greater than 100 ', function(done) {
    var data = getData();
    data.discount = 101;
    manager.create(data)
        .then(id => {
            done("Should not be error with property discount greater than 100");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('discount');
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#10. should error with property items ItemId not found ', function(done) {
    var data = getData();
    for(var item of data.items) {
        item.itemId = "000000000000000000000000";
    }

    manager.create(data)
        .then(id => {
            done("Should not be error with property items ItemId not found");
        })
        .catch(e => {
            try {
                for(var item of e.errors.items) {
                    item.should.have.property('itemId');
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#11. should error with property items quantity, discount1, discount2, discountNominal, margin, specialDiscount less or equal than 0 ', function(done) {
    var data = getData();
    for(var item of data.items) {
        item.quantity = 0;
        //item.price = -1;
        item.discount1 = -1;
        item.discount2 = -1;
        item.discountNominal = -1;
        item.margin = -1;
        item.specialDiscount = -1;
    }

    manager.create(data)
        .then(id => {
            done("Should not be error with property items quantity, discount1, discount2, discountNominal, margin, specialDiscount less or equal than 0");
        })
        .catch(e => {
            try {
                for(var item of e.errors.items) {
                    item.should.have.property('quantity');
                    //item.should.have.property('price');
                    item.should.have.property('discount1');
                    item.should.have.property('discount2');
                    item.should.have.property('discountNominal');
                    item.should.have.property('margin');
                    item.should.have.property('specialDiscount');
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#12. should error with property items discount1, discount2, margin, specialDiscount greater than 100 ', function(done) {
    var data = getData();
    for(var item of data.items) {
        item.discount1 = 101;
        item.discount2 = 101;
        item.margin = 101;
        item.specialDiscount = 101;
    }

    manager.create(data)
        .then(id => {
            done("Should not be error with property items discount1, discount2, margin, specialDiscount greater than 100");
        })
        .catch(e => {
            try {
                for(var item of e.errors.items) {
                    item.should.have.property('discount1');
                    item.should.have.property('discount2');
                    item.should.have.property('margin');
                    item.should.have.property('specialDiscount');
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#13. should error with property SalesDetail PaymentType:Cash CashAmount is less than 0 ', function(done) {
    var data = getDataCash();
    data.salesDetail.cashAmount = -1;
    manager.create(data)
        .then(id => {
            done("Should not be error with property SalesDetail PaymentType:Cash CashAmount is less than 0");
        })
        .catch(e => {
            try { 
                e.errors.salesDetail.should.have.property('cashAmount'); 
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#14. should error with property SalesDetail PaymentType:Cash CashAmount is less than GrandTotal ', function(done) {
    var data = getDataCash();
    data.salesDetail.cashAmount = 0;
    manager.create(data)
        .then(id => {
            done("Should not be error with property SalesDetail PaymentType:Cash CashAmount is less than GrandTotal");
        })
        .catch(e => {
            try { 
                e.errors.should.have.property('grandTotal'); 
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#15. should error with property SalesDetail PaymentType:Card BankId, Card, CardNumber is Required ', function(done) {
    var data = getData();
    data.salesDetail.bankId = {};
    data.salesDetail.card = '';
    data.salesDetail.cardNumber = '';
    manager.create(data)
        .then(id => {
            done("Should not be error with property SalesDetail PaymentType:Card BankId, Card, CardNumber is Required");
        })
        .catch(e => {
            try { 
                e.errors.salesDetail.should.have.property('bankId');  
                e.errors.salesDetail.should.have.property('card');  
                e.errors.salesDetail.should.have.property('cardNumber');  
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#16. should error with property SalesDetail PaymentType:Card Card:Credit cardTypeId is Required ', function(done) {
    var data = getData();
    data.salesDetail.cardTypeId = {};
    manager.create(data)
        .then(id => {
            done("Should not be error with property SalesDetail PaymentType:Card Card:Credit cardTypeId is Required");
        })
        .catch(e => {
            try { 
                e.errors.salesDetail.should.have.property('cardTypeId');  
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#17. should error with property SalesDetail PaymentType:Card CardAmount is less than 0 ', function(done) {
    var data = getData();
    data.salesDetail.cardAmount = -1;
    manager.create(data)
        .then(id => {
            done("Should not be error with property SalesDetail PaymentType:Cash CashAmount is less than 0");
        })
        .catch(e => {
            try { 
                e.errors.salesDetail.should.have.property('cardAmount'); 
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#18. should error with property SalesDetail PaymentType:Card CardAmount is less than GrandTotal ', function(done) {
    var data = getData();
    data.salesDetail.cardAmount = 0;
    manager.create(data)
        .then(id => {
            done("Should not be error with property SalesDetail PaymentType:Card CardAmount is less than GrandTotal");
        })
        .catch(e => {
            try { 
                e.errors.should.have.property('grandTotal'); 
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#19. should error with property SalesDetail PaymentType:Partial CashAmount CardAmount is less than 0 ', function(done) {
    var data = getDataPartial();
    data.salesDetail.cashAmount = -1;
    data.salesDetail.cardAmount = -1;
    manager.create(data)
        .then(id => {
            done("Should not be error with property SalesDetail PaymentType:Partial CashAmount CardAmount is less than 0");
        })
        .catch(e => {
            try { 
                e.errors.salesDetail.should.have.property('cashAmount'); 
                e.errors.salesDetail.should.have.property('cardAmount'); 
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#20. should error with property SalesDetail PaymentType:Partial BankId, Card, CardNumber is Required ', function(done) {
    var data = getDataPartial();
    data.salesDetail.bankId = {};
    data.salesDetail.card = '';
    data.salesDetail.cardNumber = '';
    manager.create(data)
        .then(id => {
            done("Should not be error with property SalesDetail PaymentType:Partial BankId, Card, CardNumber is Required");
        })
        .catch(e => {
            try { 
                e.errors.salesDetail.should.have.property('bankId');  
                e.errors.salesDetail.should.have.property('card');  
                e.errors.salesDetail.should.have.property('cardNumber');  
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#21. should error with property SalesDetail PaymentType:Partial Card:Credit cardTypeId is Required ', function(done) {
    var data = getDataPartial();
    data.salesDetail.cardTypeId = {};
    manager.create(data)
        .then(id => {
            done("Should not be error with property SalesDetail PaymentType:Partial Card:Credit cardTypeId is Required");
        })
        .catch(e => {
            try { 
                e.errors.salesDetail.should.have.property('cardTypeId');  
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it('#22. should error with property SalesDetail PaymentType:Partial CashAmount+CardAmount is less than GrandTotal ', function(done) {
    var data = getDataPartial();
    data.salesDetail.cardAmount = 0;
    data.salesDetail.cashAmount = 0;
    manager.create(data)
        .then(id => {
            done("Should not be error with property SalesDetail PaymentType:Partial CashAmount+CardAmount is less than GrandTotal");
        })
        .catch(e => {
            try { 
                e.errors.should.have.property('grandTotal'); 
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});