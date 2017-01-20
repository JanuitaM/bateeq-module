var helper = require('./helper');
var data = require("./data");
var generateCode = require('../src/utils/code-generator');

var createSales = function () {
    return new Promise((resolve, reject) => {
        newSales()
            .then(sales => {
                helper.getDb()
                    .then(db => { 
                        var SalesManager = require('../src/managers/sales/sales-manager');
                        var manager = new SalesManager(db, {
                            username: 'unit-test'
                        }); 
                        manager.create(sales)
                            .then(id => {
                                manager.getSingleById(id)
                                    .then(createdSales => {
                                        resolve(createdSales);
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

var newSales = function () {
    return new Promise((resolve, reject) => {
        helper.getDb()
            .then(db => {
                data(db)
                    .then(testData => {
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

                        sales.code = code;
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
                        for(var i of sales.items) {
                            salesTotal += i.total;
                        }

                        sales.salesDetail = new SalesDetail({
                            paymentType : 'Card', //Cash, Card, Partial
                            voucherId : {},
                            voucher : {},
                            bankId : bank._id,
                            bank : bank,
                            bankCardId : bank._id,
                            bankCard : bank,
                            cardTypeId : cardType._id,
                            cardType : cardType,                
                            card : 'Credit', //Debit | Credit
                            cardNumber : '1000200030004000',
                            cardName : 'CardName',
                            cashAmount : 0,
                            cardAmount : salesTotal
                        })
                        resolve(sales);
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
    newSales: newSales,
    createSales: createSales
};