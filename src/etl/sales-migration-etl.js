'use strict'
var DLModels = require('bateeq-models');
var map = DLModels.map;
var ObjectId = require('mongodb').ObjectId;
var sqlConnect = require('./sqlConnect');
var BaseManager = require('module-toolkit').BaseManager;
var MongoClient = require('mongodb').MongoClient,
    test = require('assert');
var ItemManager = require('../../src/managers/master/item-manager');
var BankManager = require('../../src/managers/master/bank-manager');
var CardTypeManager = require('../../src/managers/master/card-type-manager');
var StoreManager = require('../../src/managers/master/store-manager');
var SalesManager = require('../../src/managers/sales/sales-manager');


// var request=sqlConnect.getConnect();

module.exports = class SalesDataEtl extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.ItemManager = new ItemManager(db, user);
        this.BankManager = new BankManager(db, user);
        this.CardTypeManager = new CardTypeManager(db, user);
        this.StoreManager = new StoreManager(db, user);
        this.SalesManager = new SalesManager(db, user);

        this.collectionItem = this.ItemManager.collection;
        this.collectionBank = this.BankManager.collection;
        this.collectionStore = this.StoreManager.collection;
        this.collectionCardType = this.CardTypeManager.collection;
        this.collectionSalesManager = this.SalesManager.collection;

    }

    migrate() {
        return new Promise((resolve, reject) => {
            sqlConnect.getConnect()
                .then((request) => {
                    var self = this;
                    // var query= "select * from (select ROW_NUMBER() OVER(ORDER BY branch, nomor) AS number,branch,nomor,tanggal,shift,pos,kartu,no_krt,payment,userin,sum(qty)as totalProduct, max(TOTAL) as subTotal,max(TOTAL) as grandTotal,0 as discount,'' as reference , max(voucher) as voucher, max(cash) as cash, max(debit) as debit,max(credit) as credit from penjualan group by branch,nomor,tanggal,shift,pos,kartu,no_krt,payment,userin)a where nomor ='201501.00083' and branch ='SLO.02' and shift ='2' and tanggal ='2015-01-30 00:00:00.000' and POS ='POS01'";


                    var query = "select * from (select ROW_NUMBER() OVER(ORDER BY branch, nomor) AS number,branch,nomor,tanggal,shift,pos,kartu,no_krt,payment,userin,tglin,sum(qty)as totalProduct, max(TOTAL) as subTotal,max(TOTAL) as grandTotal,0 as discount,'' as reference , max(voucher) as voucher, max(cash) as cash, max(debit) as debit,max(credit) as credit from penjualan group by branch,nomor,tanggal,shift,pos,kartu,no_krt,payment,userin,tglin)a WHERE branch= '201402.00028'";

                    // var query = "select * from (select ROW_NUMBER() OVER(ORDER BY branch, nomor) AS number,branch,nomor,tanggal,shift,pos,kartu,no_krt,payment,userin,tglin,sum(qty)as totalProduct, max(TOTAL) as subTotal,max(TOTAL) as grandTotal,0 as discount,'' as reference , max(voucher) as voucher, max(cash) as cash, max(debit) as debit,max(credit) as credit from penjualan group by branch,nomor,tanggal,shift,pos,kartu,no_krt,payment,userin,tglin)a WHERE branch= 'SLO.02'";
                    request.query(query, function (err, salesResult) {
                        // var a = [];
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        else {
                            self.migrateDataStores(request, salesResult)
                                .then(sales => {
                                    resolve(sales);


                                })
                                .catch(err => {
                                    console.log(err);
                                });
                        }

                        //    
                        // resolve(self.collectionSalesManager.insertMany(a, { ordered: false }))
                        //  resolve(a);

                    })
                });

        });
    }

    // getNewDataSales(request) {
    //     return new Promise(function (resolve, reject) {
    //         var query = "select top 10 * from (select ROW_NUMBER() OVER(ORDER BY branch, nomor) AS number,branch,nomor,tanggal,shift,pos,kartu,no_krt,payment,userin,tglin,sum(qty)as totalProduct, max(TOTAL) as subTotal,max(TOTAL) as grandTotal,0 as discount,'' as reference , max(voucher) as voucher, max(cash) as cash, max(debit) as debit,max(credit) as credit from penjualan group by branch,nomor,tanggal,shift,pos,kartu,no_krt,payment,userin,tglin)a WHERE branch= 'SLO.02'";
    //         request.query(query, function (err, sales) {
    //             if (err)
    //                 reject(err);
    //             else
    //                 resolve(sales);
    //         });
    //     });
    // }

    // getDataSales() {

    //     return new Promise((resolve, reject) => {

    //         this.collectionSalesManager.find({}).toArray(function (err, sales) {

    //             resolve(sales)
    //         });
    //     });
    // }

    getStore(branch) {
        return new Promise((resolve, reject) => {

            this.collectionStore.find({ "code": branch }).toArray(function (err, store) {
                resolve(store[0]);
            });

        });
    }

    getBanks(kartu) {
        return new Promise((resolve, reject) => {
            this.collectionBank.find({ "code": "BA-" + kartu }).toArray(function (err, Banks) {
                resolve(Banks[0]);
            });

        });
    }

    getCards(CardType) {
        return new Promise((resolve, reject) => {

            this.collectionCardType.find({ "name": CardType }).toArray(function (err, card) {

                resolve(card[0]);
            });

        });
    }

    migrateDataStores(request, salesData) {
        return new Promise((resolve, reject) => {
            var getStores = [];
            var getBanks = [];
            var getBankCards = [];
            var getItems = [];
            var getCards = [];
            var paymentType;

            for (var i = 0; i < salesData.length; i++) {
                var sales = salesData[i];

                // paymentType = "cash";

                // if ((sales.payment.trim() == "DEBIT CARD") || (sales.payment.trim() == "CREDIT CARD")) {
                //     paymentType = "card";
                // }
                // else if ((sales.payment.trim() == "PARTIAL DEBIT CARD") || (sales.payment.trim() == "PARTIAL CREDIT CARD")) {
                //     paymentType = "partial";
                // } else {
                //     paymentType = "cash";
                // };

                // var cardTemp = "";

                // if ((sales.payment.trim() == "DEBIT CARD") || (sales.payment.trim() == "PARTIAL DEBIT CARD")) {
                //     cardTemp = "debit";
                // } else if ((sales.payment.trim() == "CREDIT CARD") || (sales.payment.trim() == "PARTIAL CREDIT CARD")) {
                //     cardTemp = "credit";
                // } else {
                //     cardTemp = "";
                // };

                var CardType = "";
                if ((sales.no_krt[0] == 5) && ((sales.no_krt[1] == 1) || (sales.no_krt[1] == 2) || (sales.no_krt[1] == 3) || (sales.no_krt[1] == 4) || (sales.no_krt[1] == 5))) {

                    CardType = "Mastercard";
                } else if ((sales.no_krt[0] == 2) && ((sales.no_krt[1] == 2) || (sales.no_krt[1] == 3) || (sales.no_krt[1] == 4) || (sales.no_krt[1] == 5) || (sales.no_krt[1] == 6) || (sales.no_krt[1] == 7))) {
                    CardType = "Mastercard";

                } else if (sales.no_krt[0] == 4) {
                    CardType = "Visa";

                } else {
                    CardType = "";
                };

                var BankName = "-"
                if ((sales.kartu.trim() == "") && (sales.payment.toLowerCase() != "cash")) {
                    BankName = "-";
                    // getBankCardId.push(this.getBanks("-"));
                } else {
                    BankName = sales.kartu.trim();
                }

                getStores.push(this.getStore(sales.branch));
                getBanks.push(this.getBanks(BankName));
                getItems.push(this.getItems(request, sales.branch, sales.nomor));
                getCards.push(this.getCards(CardType));


                getBankCards.push(this.getBanks("-"));

            }

            var countStore = getStores.length;
            var countBank = getBanks.length;
            var countItem = getItems.length;
            var countCard = getCards.length;
            var countBankCards = getBankCards.length;

            Promise.all(getStores.concat(getBanks).concat(getItems).concat(getCards).concat(getBankCards))
                .then(results => {
                    var _stores = results.splice(0, countStore);
                    var _banks = results.splice(0, countBank);
                    var _items = results.splice(0, countItem);
                    var _cards = results.splice(0, countCard);
                    var _bankCards = results.splice(0, countBankCards)


                    var salesDatas = [];
                    var tasks = [];
                    for (var i = 0; i < salesData.length; i++) {
                        var sales = salesData[i];
                        var _store = _stores[i];
                        var _bank = _banks[i];
                        var _item = _items[i];
                        var _card = _cards[i];
                        var _bankCard = _bankCards[i];
                        // var promise4 = getcards(db, CardType);

                        var paymentType = "Cash";

                        if ((sales.payment.trim() == "DEBIT CARD") || (sales.payment.trim() == "CREDIT CARD")) {
                            paymentType = "Card";
                        }
                        else if ((sales.payment.trim() == "PARTIAL DEBIT CARD") || (sales.payment.trim() == "PARTIAL CREDIT CARD")) {
                            paymentType = "Partial";
                        } else {
                            paymentType = "Cash";
                        };

                        var cardTemp = "";

                        if ((sales.payment.trim() == "DEBIT CARD") || (sales.payment.trim() == "PARTIAL DEBIT CARD")) {
                            cardTemp = "Debit";
                        } else if ((sales.payment.trim() == "CREDIT CARD") || (sales.payment.trim() == "PARTIAL CREDIT CARD")) {
                            cardTemp = "Credit";
                        } else {
                            cardTemp = "";
                        };
                        var _id = new ObjectId();
                        var _idStorage = new ObjectId();
                        var _stamp = new ObjectId();
                        var _stampStorage = new ObjectId();

                        var salesDataNew = {
                            "_id": _id,
                            "_stamp": _stamp,
                            "_type": "sales-doc",
                            "_version": "1.0.0",
                            "_active": true,
                            "_deleted": false,
                            "_createdBy": sales.userin,
                            "_createdDate": sales.tglin,
                            "_createAgent": "manager",
                            "_updatedBy": "router",
                            "_updatedDate": new Date(),
                            "_updateAgent": "manager",
                            "code": sales.nomor,
                            // "date": s[i].tanggal,
                            "date": sales.tanggal,
                            "totalProduct": sales.totalProduct,
                            "subTotal": sales.subTotal,
                            "discount": sales.discount,
                            "grandTotal": parseInt(sales.grandTotal),
                            "reference": sales.reference,
                            // "shift": s[i].shift,
                            "shift": parseInt(sales.shift),
                            "pos": sales.pos,
                            "storeId": _store._id,
                            "store": _store,
                            "items": _item,

                            "salesDetail":
                            {
                                "_stamp": new ObjectId(),
                                "_type": "sales-type",
                                "_version": "1.0.0",
                                "_active": true,
                                "deleted": false,
                                "_createdBy": "router",
                                "_createdDate": new Date(),
                                "_createAgent": "manager",
                                "_updatedBy": "router",
                                "_updatedDate": new Date(),
                                "_updateAgent": "manager",
                                "paymentType": paymentType, //object card berdasarkan penjualan.kartu
                                "voucherId": {},
                                "voucher": {
                                    "value": parseInt(sales.voucher),
                                },
                                "bankId": (paymentType == "Cash") ? {} : ((_bank) ? _bank._id : {}), //query penjualan.kartu
                                "bank": (paymentType == "Cash") ? {} : ((_bank) ? _bank : {}),
                                "cardTypeId": (cardTemp == "Debit") ? {} : ((_card) ? _card._id : {}),
                                "cardType": (cardTemp == "Debit") ? {} : ((_card) ? _card : {}),

                                //         "cardTypeId": (_card) ? _card._id : {},
                                // "cardType": (_card) ? _card : {},

                                "bankCardId": (paymentType == "Cash") ? {} : ((_bankCard) ? _bankCard._id : {}),
                                "bankCard": (paymentType == "Cash") ? {} : ((_bankCard) ? _bankCard : {}),
                                "card": cardTemp,
                                "cardNumber": sales.no_krt,
                                "cardName": "",
                                "cashAmount": parseInt(sales.cash),
                                "cardAmount": parseInt(sales.debit) + parseInt(sales.credit),

                            },

                            "remark": "",
                            "isReturn": false,
                            "isVoid": false,
                        }

                        // if (paymentType != "cash") {
                        //     salesDataNew.bankId = _bank ? _bank._id : "";
                        //     salesDataNew.bankCardId = _bankCard ? _bank._id : "";
                        // }


                        salesDatas.push(salesDataNew);
                    }

                    var getMongos = [];
                    for (var salesLoop of salesDatas) {
                        getMongos.push(this.collectionSalesManager.singleOrDefault({ code: salesLoop.code }));
                    }

                    Promise.all(getMongos)
                        .then((allSalesMongos) => {
                            for (var salesLoop of salesDatas) {
                                var index = salesDatas.indexOf(salesLoop);
                                var mongoData = allSalesMongos[index];
                                if (mongoData) {
                                    //    "_stamp": _stamp,
                                    salesLoop._id = mongoData._id;
                                    salesLoop._stamp = mongoData._stamp;
                                    tasks.push(this.collectionSalesManager.update(salesLoop, { ordered: false }))
                                    // tasks.push(this.SalesManager.update(salesLoop));
                                }
                                else {
                                    //insert
                                    tasks.push(this.collectionSalesManager.insert(salesLoop, { ordered: false }))
                                    // tasks.push(this.SalesManager.create(salesLoop));
                                }
                            }
                            Promise.all(tasks)
                                .then((task) => {
                                    resolve(tasks);
                                }).catch(error => {
                                    reject(error);
                                });
                            // resolve(null);
                        })
                        .catch(error => {
                            reject(error);
                        });

                });

        });
    }

    getItems(request, branch, nomor) {
        var self = this;
        return new Promise((resolve, reject) => {
            // var request = connect;

            var queryfilter = 'select * from penjualan where nomor= \'' + nomor + '\' and branch= \'' + branch + '\'';
            request.query(queryfilter, function (err, sales) {
                if (err)
                    reject(err);
                else {
                    var barcodes = [];
                    for (var i = 0; i < sales.length; i++) {
                        barcodes.push(sales[i].barcode);
                    }

                    self.getItemsMongo(barcodes)
                        .then(listItem => {
                            var itemDetails = [];
                            for (var i = 0; i < sales.length; i++) {
                                for (var j = 0; j < listItem.length; j++) {
                                    if (sales[i].barcode == listItem[j].code) {
                                        var itemDetail = {
                                            "_stamp": listItem[j]._stamp,
                                            "_type": "sales-item",
                                            "_version": "1.0.0",
                                            "_active": true,
                                            "_deleted": false,
                                            "_createdBy": "router",
                                            "_createdDate": new Date(),
                                            "_createAgent": "manager",
                                            "_updatedBy": "router",
                                            "_updateAgent": "manager",
                                            "itemId": listItem[j]._id,
                                            "item": listItem[j],
                                            "promoId": "",
                                            "promo": {},
                                            "size": "",
                                            "quantity": sales[i].qty,
                                            "price": sales[i].harga,
                                            "discount1": sales[i].disc,
                                            "discount2": sales[i].disc1,
                                            "discountNominal": 0,
                                            "margin": 0,
                                            "specialDiscount": 0,
                                            "total": sales[i].subtotal,
                                            "isReturn": false,
                                            "returnItems": [],
                                        };
                                        // itemDetail.item = listItem[j];
                                        // itemDetail.quantity = queryfilter[i].qty;
                                        itemDetails.push(itemDetail);
                                        break;
                                    }
                                }
                            }

                            resolve(itemDetails);


                        }).catch(error => {
                            reject(error);
                        });

                    // self.getItemsMongo(barcodes).then(lstBarcode => {
                    //     resolve(lstBarcode);
                    // }).catch(error => {
                    //     reject(error);
                    // });

                    // resolve(sales);
                }
            });
        })
    };

    // createItem(queryfilter) {
    //     var self = this;
    //     return new Promise((resolve, reject) => {
    //         var promise1 = self.getItemsMongo(queryfilter.barcode);
    //         Promise.all([promise1]).then(result => {
    //             var item = result[0];
    //             resolve(item);
    //         });

    //     });
    // };



    getItemsMongo(barcodes) {
        return new Promise((resolve, reject) => {
            // var collection = db.collection('items');
            this.collectionItem.find({ "code": { "$in": barcodes } }).toArray(function (err, items) {
                if (err)
                    reject(err);
                else
                    resolve(items);
            });

        });
    }

}
