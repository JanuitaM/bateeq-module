'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var BateeqModels = require('bateeq-models');
var Sales = BateeqModels.sales.Sales;
var TransferOutDoc = BateeqModels.inventory.TransferOutDoc;
var TransferInDoc = BateeqModels.inventory.TransferInDoc;
var map = BateeqModels.map;
var generateCode = require('../../utils/code-generator');

module.exports = class SalesManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.sales.SalesDoc);

        var ItemManager = require('../master/finished-goods-manager');
        this.itemManager = new ItemManager(db, user);

        var StoreManager = require('../master/store-manager');
        this.storeManager = new StoreManager(db, user);

        var BankManager = require('../master/bank-manager');
        this.bankManager = new BankManager(db, user);

        var CardTypeManager = require('../master/card-type-manager');
        this.cardTypeManager = new CardTypeManager(db, user);

        var TransferOutDocManager = require('../inventory/transfer-out-doc-manager');
        this.transferOutDocManager = new TransferOutDocManager(db, user);

        var TransferInDocManager = require('../inventory/transfer-in-doc-manager');
        this.transferInDocManager = new TransferInDocManager(db, user);

        var InventoryManager = require('../inventory/inventory-manager');
        this.inventoryManager = new InventoryManager(db, user);

        var PromoManager = require('./promo-manager');
        this.promoManager = new PromoManager(db, user);
    }

    readAll(paging) {
        var _paging = Object.assign({
            page: 1,
            size: 20,
            order: {},
            filter: {},
            select: []
        }, paging);
        // var start = process.hrtime();

        return this._createIndexes()
            .then((createIndexResults) => {
                var query = this._getQuery(_paging);
                return this.collection
                    .where(query)
                    .orderBy(_paging.order, _paging.asc)
                    .execute();
            });
    }


    _createIndexes() {
        var dateIndex = {
            name: `ix_${map.sales.SalesDoc}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        }

        var codeIndex = {
            name: `ix_${map.sales.SalesDoc}_code`,
            key: {
                code: 1
            },
            unique: true
        }

        return this.collection.createIndexes([dateIndex, codeIndex]);
    }

    _getQuery(paging) {
        var deleted = {
            _deleted: false
        };

        var query = paging.filter ? {
            '$and': [paging.filter, deleted]
        } : deleted;

        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");
            var filterCode = {
                'code': {
                    '$regex': regex
                }
            };
            var $or = {
                '$or': [filterCode]
            };

            query['$and'].push($or);
        }
        return query;
    }

    create(sales) {
        return new Promise((resolve, reject) => {
            sales.code = generateCode("sales");
            this._validate(sales)
                .then(validSales => {
                    var createData = [];

                    var funcOut = (sales, manager) => {
                        return () => {
                            var isAnyTransferOut = false;
                            var validTransferOutDoc = {};
                            validTransferOutDoc.code = sales.code;
                            validTransferOutDoc.reference = sales.code;
                            validTransferOutDoc.sourceId = sales.store.storageId;
                            validTransferOutDoc.destinationId = sales.store.storageId;
                            validTransferOutDoc.items = [];
                            for (var item of sales.items) {
                                if (!item.isReturn) {
                                    var newitem = {};
                                    newitem.itemId = item.itemId;
                                    newitem.quantity = item.quantity;
                                    validTransferOutDoc.items.push(newitem);
                                    isAnyTransferOut = true;
                                }
                            }
                            validTransferOutDoc = new TransferOutDoc(validTransferOutDoc);
                            if (isAnyTransferOut)
                                return manager.create(validTransferOutDoc)
                            else
                                return Promise.resolve(null)
                        }
                    };
                    createData.push(funcOut(validSales, this.transferOutDocManager));

                    var funcIn = (sales, manager) => {
                        return () => {
                            var isAnyTransferIn = false;
                            var validTransferInDoc = {};
                            validTransferInDoc.code = sales.code;
                            validTransferInDoc.reference = sales.code;
                            validTransferInDoc.sourceId = sales.store.storageId;
                            validTransferInDoc.destinationId = sales.store.storageId;
                            validTransferInDoc.items = [];
                            for (var item of sales.items) {
                                if (item.isReturn) {
                                    var newitem = {};
                                    newitem.itemId = item.itemId;
                                    newitem.quantity = item.quantity;
                                    validTransferInDoc.items.push(newitem);
                                    isAnyTransferIn = true;
                                }
                            }
                            validTransferInDoc = new TransferInDoc(validTransferInDoc);
                            if (isAnyTransferIn)
                                return manager.create(validTransferInDoc);
                            else
                                return Promise.resolve(null);
                        }
                    };
                    createData.push(funcIn(validSales, this.transferInDocManager));

                    var funcSales = (sales, manager) => {
                        return () => {
                            sales._createdDate = new Date();
                            return manager.insert(sales);
                        }
                    };
                    createData.push(funcSales(validSales, this.collection));

                    require('js-toolkit').Promise.ext;
                    //Promise.all(createData)
                    Promise.chain(createData)
                        .then(results => {
                            resolve(results[2]);
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

    _void(salesDoc) {
        return new Promise((resolve, reject) => {
            this.collection.singleOrDefault({ _id: new ObjectId(salesDoc.sales._id), _deleted: false })
                .then(result => {
                    // update sales
                    result.isVoid = true;
                    var valid = new Sales(result);
                    valid.stamp(this.user.username, 'manager');
                    this.collection.update(valid)
                        .then(id => {
                            // add transfer in
                            var createData = [];
                            var validTransferInDoc = {};
                            validTransferInDoc.code = generateCode("voidsales");
                            validTransferInDoc.reference = valid.code;
                            validTransferInDoc.sourceId = valid.store.storageId;
                            validTransferInDoc.destinationId = valid.store.storageId;
                            validTransferInDoc.items = [];
                            for (var item of valid.items) {
                                var newitem = {};
                                newitem.itemId = item.itemId;
                                newitem.quantity = item.quantity;
                                validTransferInDoc.items.push(newitem);
                            }
                            validTransferInDoc = new TransferInDoc(validTransferInDoc);
                            createData.push(this.transferInDocManager.create(validTransferInDoc));

                            //update void salesReturn if isReturn = true
                            if (valid.isReturn) {
                                var SalesReturnManager = require('./sales-return-manager');
                                var salesReturnManager = new SalesReturnManager(this.db, this.user);
                                createData.push(salesReturnManager._void(valid));
                            }

                            Promise.all(createData)
                                .then(results => {
                                    resolve(id);
                                })
                                .catch(e => {
                                    reject(e);
                                })
                        })
                        .catch(e => {
                            reject(e);
                        });
                });
        })
    }

    _validate(sales) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = new Sales(sales);

            var salesDetailError = {};
            if (!valid.code || valid.code == '')
                errors["code"] = "code is required";
            if (!sales.storeId || sales.storeId == '')
                errors["storeId"] = "storeId is required";
            if (!sales.salesDetail) {
                errors["salesDetail"] = "salesDetail is required";
                sales.salesDetail = {};
            }
            valid.date = new Date(valid.date);
            if (Object.prototype.toString.call(valid.date) === "[object Date]") {
                if (isNaN(valid.date.getTime())) {
                    errors["date"] = "date is not valid";
                }
            }
            else {
                errors["date"] = "date is not valid";
            }

            for (var prop in salesDetailError) {
                errors["salesDetail"] = salesDetailError;
                break;
            }

            //Get sales data
            var getSales = this.collection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                    code: valid.code
                }]
            });
            var getStore;
            var getBank;
            var getBankCard;
            var getCardType;
            var getVoucher = Promise.resolve(null);
            var getItems = [];
            var getPromos = [];

            if (sales.storeId && ObjectId.isValid(sales.storeId)) {
                getStore = this.storeManager.getSingleByIdOrDefault(sales.storeId);
            }
            else {
                getStore = Promise.resolve(null);
                sales.storeId = {};
            }

            if (sales.salesDetail.bankId && ObjectId.isValid(sales.salesDetail.bankId)) {
                getBank = this.bankManager.getSingleByIdOrDefault(sales.salesDetail.bankId);
            }
            else {
                getBank = Promise.resolve(null);
                sales.salesDetail.bankId = {};
            }

            if (sales.salesDetail.bankCardId && ObjectId.isValid(sales.salesDetail.bankCardId)) {
                getBankCard = this.bankManager.getSingleByIdOrDefault(sales.salesDetail.bankCardId);
            }
            else {
                getBankCard = Promise.resolve(null);
                sales.salesDetail.bankCardId = {};
            }

            if (sales.salesDetail.cardTypeId && ObjectId.isValid(sales.salesDetail.cardTypeId)) {
                getCardType = this.cardTypeManager.getSingleByIdOrDefault(sales.salesDetail.cardTypeId);
            }
            else {
                getCardType = Promise.resolve(null);
                sales.salesDetail.cardTypeId = {};
            }

            if (valid.items && valid.items.length > 0) {
                for (var item of valid.items) {
                    if (item.itemId && ObjectId.isValid(item.itemId)) {
                        getItems.push(this.itemManager.getSingleByIdOrDefault(item.itemId));
                    }
                    else {
                        getItems.push(Promise.resolve(null));
                        item.itemId = {};
                    }

                    if (item.promoId && ObjectId.isValid(item.promoId)) {
                        getPromos.push(this.promoManager.getSingleByIdOrDefault(item.promoId));
                    }
                    else {
                        getPromos.push(Promise.resolve(null));
                        item.promoId = {};
                    }
                }
            }
            else {
                errors["items"] = "items is required";
            }

            var countGetItems = getItems.length;
            var countGetPromos = getPromos.length;
            Promise.all([getSales, getStore, getBank, getBankCard, getCardType, getVoucher].concat(getItems).concat(getPromos))
                .then(results => {
                    var _sales = results[0];
                    var _store = results[1];
                    var _bank = results[2];
                    var _bankCard = results[3];
                    var _cardType = results[4];
                    var _voucherType = results[5];
                    var _items = results.slice(6, results.length - countGetPromos)
                    var _promos = results.slice(results.length - countGetPromos, results.length)

                    if (_sales) {
                        errors["code"] = "code already exists";
                    }

                    if (!_store) {
                        errors["storeId"] = "storeId not found";
                    }
                    else {
                        valid.storeId = _store._id;
                        valid.store = _store;

                        var today = new Date();
                        valid.shift = 0;
                        if (_store.shifts) {
                            for (var shift of _store.shifts) {
                                
                                var dateFrom = new Date(this.getUTCStringDate(today) + "T" + this.getUTCStringTime(new Date(shift.dateFrom)));
                                var dateTo = new Date(this.getUTCStringDate(today) + "T" + this.getUTCStringTime(new Date(shift.dateTo)));
                                
                                if (dateFrom > dateTo) {
                                    dateFrom.setDate(dateFrom.getDate() - 1);
                                }
                                if (dateFrom < today && today < dateTo) {
                                    valid.shift = parseInt(shift.shift);
                                    break;
                                }
                            }
                        }

                        if (valid.shift == 0) {
                            errors["shift"] = "invalid shift";
                        }

                    }

                    if (valid.discount == undefined || (valid.discount && valid.discount == '')) {
                        errors["discount"] = "discount is required";
                        valid.discount = 0;
                    }
                    else if (parseInt(valid.discount) < 0 || parseInt(valid.discount) > 100) {
                        errors["discount"] = "discount must be greater than 0 or less than 100";
                    }
                    else
                        valid.discount = parseInt(valid.discount);

                    valid.totalProduct = 0;
                    valid.subTotal = 0;
                    valid.grandTotal = 0;
                    var subTotalReturn = 0;
                    if (_items.length > 0) {
                        var itemErrors = [];
                        for (var _item of _items) {
                            var index = _items.indexOf(_item);
                            var item = valid.items[index];
                            var itemError = {};

                            if (!item.itemId || !ObjectId.isValid(item.itemId)) {
                                itemError["itemId"] = "itemId is required";
                            }
                            else {
                                // for (var i = valid.items.indexOf(item) + 1; i < valid.items.length; i++) {
                                //     var otherItem = valid.items[i];
                                //     if (item.itemId == otherItem.itemId) {
                                //         itemError["itemId"] = "itemId already exists on another detail";
                                //     }
                                // }
                            }

                            if (!_item) {
                                itemError["itemId"] = "itemId not found";
                            }
                            else {
                                item.itemId = _item._id;
                                item.item = _item;
                                if (_item.size)
                                    if (_item.size.name)
                                        item.size = _item.size.name;
                                //item.price = parseInt(_item.domesticSale);
                            }

                            if (!item.promoId || !ObjectId.isValid(item.promoId)) { }
                            else {
                                var _promo = _promos[index];
                                if (!_promo) {
                                    itemError["promoId"] = "promoId not found";
                                }
                                else {
                                    item.promoId = _promo._id;
                                    item.promo = _promo;

                                    if (_promo.reward.type == "discount-product") {
                                        // for(var reward of _promo.reward.rewards) {
                                        //     if(reward.unit == "percentage") {
                                        //         item.discount1 = reward.discount1;
                                        //         item.discount2 = reward.discount2;
                                        //     }
                                        //     else if(reward.unit == "nominal") {
                                        //         item.discountNominal = reward.nominal;
                                        //     }
                                        // }
                                    }
                                    if (_promo.reward.type == "special-price") {
                                        // //cek quantity
                                        // var quantityPaket = 0;
                                        // for(var item2 of valid.items) {
                                        //     if(item.promoId.toString() == item2.promoId.toString() && !item2.isReturn) {
                                        //         quantityPaket = parseInt(quantityPaket) + parseInt(item2.quantity)
                                        //     }
                                        // }

                                        // //change price
                                        // for(var item2 of valid.items) {
                                        //     if(item.promoId == item2.promoId && !item2.isReturn) {
                                        //         for(var reward of _promo.reward.rewards) {
                                        //             if(parseInt(quantityPaket) == 1)
                                        //                 item2.price = parseInt(reward.quantity1);
                                        //             else if(parseInt(quantityPaket) == 2)
                                        //                 item2.price = parseInt(reward.quantity2);
                                        //             else if(parseInt(quantityPaket) == 3)
                                        //                 item2.price = parseInt(reward.quantity3);
                                        //             else if(parseInt(quantityPaket) == 4)
                                        //                 item2.price = parseInt(reward.quantity4);
                                        //             else if(parseInt(quantityPaket) >= 5)
                                        //                 item2.price = parseInt(reward.quantity5);
                                        //         }  
                                        //     }
                                        // } 
                                    }
                                }
                            }

                            if (item.quantity == undefined || (item.quantity && item.quantity == '')) {
                                itemError["quantity"] = "quantity is required";
                                item.quantity = 0;
                            }
                            else if (parseInt(item.quantity) <= 0) {
                                itemError["quantity"] = "quantity must be greater than 0";
                            }
                            else
                                item.quantity = parseInt(item.quantity);

                            if (item.price == undefined || (item.price && item.price == '')) {
                                itemError["price"] = "price is required";
                                item.price = 0;
                            }
                            else if (parseInt(item.price) < 0) {
                                itemError["price"] = "price must be greater than 0";
                            }
                            else
                                item.price = parseInt(item.price);

                            if (item.discount1 == undefined || (item.discount1 && item.discount1 == '')) {
                                itemError["discount1"] = "discount1 is required";
                                item.discount1 = 0;
                            }
                            else if (parseInt(item.discount1) < 0 || parseInt(item.discount1) > 100) {
                                itemError["discount1"] = "discount1 must be greater than 0 or less than 100";
                            }
                            else
                                item.discount1 = parseInt(item.discount1);

                            if (item.discount2 == undefined || (item.discount2 && item.discount2 == '')) {
                                itemError["discount2"] = "discount2 is required";
                                item.discount2 = 0;
                            }
                            else if (parseInt(item.discount2) < 0 || parseInt(item.discount2) > 100) {
                                itemError["discount2"] = "discount2 must be greater than 0 or less than 100";
                            }
                            else
                                item.discount2 = parseInt(item.discount2);

                            if (item.discountNominal == undefined || (item.discountNominal && item.discountNominal == '')) {
                                itemError["discountNominal"] = "discountNominal is required";
                                item.discountNominal = 0;
                            }
                            else if (parseInt(item.discountNominal) < 0) {
                                itemError["discountNominal"] = "discountNominal must be greater than 0";
                            }
                            else
                                item.discountNominal = parseInt(item.discountNominal);

                            if (item.margin == undefined || (item.margin && item.margin == '')) {
                                itemError["margin"] = "margin is required";
                                item.margin = 0;
                            }
                            else if (parseInt(item.margin) < 0 || parseInt(item.margin) > 100) {
                                itemError["margin"] = "margin must be greater than 0 or less than 100";
                            }
                            else
                                item.margin = parseInt(item.margin);

                            if (item.specialDiscount == undefined || (item.specialDiscount && item.specialDiscount == '')) {
                                itemError["specialDiscount"] = "specialDiscount is required";
                                item.margin = 0;
                            }
                            else if (parseInt(item.specialDiscount) < 0 || parseInt(item.specialDiscount) > 100) {
                                itemError["specialDiscount"] = "specialDiscount must be greater than 0 or less than 100";
                            }
                            else
                                item.specialDiscount = parseInt(item.specialDiscount);

                            item.total = 0;
                            if (parseInt(item.quantity) > 0) {
                                //Price
                                item.total = parseInt(item.quantity) * parseInt(item.price);
                                //Diskon
                                item.total = (item.total * (1 - (parseInt(item.discount1) / 100)) * (1 - (parseInt(item.discount2) / 100))) - parseInt(item.discountNominal);
                                //Spesial Diskon 
                                item.total = item.total * (1 - (parseInt(item.specialDiscount) / 100))
                                //Margin
                                item.total = item.total * (1 - (parseInt(item.margin) / 100))
                            }
                            if (!item.isReturn) {
                                valid.subTotal = parseInt(valid.subTotal) + parseInt(item.total);
                                valid.totalProduct = parseInt(valid.totalProduct) + parseInt(item.quantity);
                            }
                            else {
                                subTotalReturn = subTotalReturn + parseInt(item.total);
                            }
                            itemErrors.push(itemError);
                        }
                        var totalDiscount = parseInt(valid.subTotal) * parseInt(valid.discount) / 100;
                        valid.grandTotal = parseInt(valid.subTotal) - parseInt(totalDiscount) - subTotalReturn;
                        if (valid.grandTotal < 0)
                            valid.grandTotal = 0;
                        for (var itemError of itemErrors) {
                            for (var prop in itemError) {
                                errors.items = itemErrors;
                                break;
                            }
                            if (errors.items)
                                break;
                        }
                    }

                    if (parseInt(valid.grandTotal) > 0) {
                        if (!valid.salesDetail.paymentType || valid.salesDetail.paymentType == '') {
                            salesDetailError["paymentType"] = "Tipe Pembayaran harus diisi";
                        }
                        else if (valid.salesDetail.paymentType.toLowerCase() != "card" && valid.salesDetail.paymentType.toLowerCase() != "cash" && valid.salesDetail.paymentType.toLowerCase() != "partial") {
                            salesDetailError["paymentType"] = "Tipe Pembayaran tidak ditemukan";
                        }
                        else {
                            if (valid.salesDetail.paymentType.toLowerCase() == "card" || valid.salesDetail.paymentType.toLowerCase() == "partial") {
                                if (!sales.salesDetail.bankId || sales.salesDetail.bankId == '')
                                    salesDetailError["bankId"] = "Bank (EDC) harus diisi";
                                if (!_bank) {
                                    salesDetailError["bankId"] = "Bank (EDC) tidak ditemukan";
                                }
                                else {
                                    valid.salesDetail.bankId = _bank._id;
                                    valid.salesDetail.bank = _bank;
                                }

                                if (!sales.salesDetail.bankCardId || sales.salesDetail.bankCardId == '')
                                    salesDetailError["bankCardId"] = "Bank (KARTU) harus diisi";
                                if (!_bankCard) {
                                    salesDetailError["bankCardId"] = "Bank (KARTU) tidak ditemukan";
                                }
                                else {
                                    valid.salesDetail.bankCardId = _bankCard._id;
                                    valid.salesDetail.bankCard = _bankCard;
                                }

                                if (!valid.salesDetail.card || valid.salesDetail.card == '')
                                    salesDetailError["card"] = "Kartu harus diisi";
                                else {
                                    if (valid.salesDetail.card.toLowerCase() != 'debit' && valid.salesDetail.card.toLowerCase() != 'credit')
                                        salesDetailError["card"] = "Kartu harus debit/kredit";
                                    else {
                                        if (valid.salesDetail.card.toLowerCase() != 'debit') {
                                            if (!sales.salesDetail.cardTypeId || sales.salesDetail.cardTypeId == '')
                                                salesDetailError["cardTypeId"] = "Tipe Kartu harus diisi";
                                            if (!_cardType) {
                                                salesDetailError["cardTypeId"] = "Tipe Kartu tidak ditemukan";
                                            }
                                            else {
                                                valid.salesDetail.cardTypeId = _cardType._id;
                                                valid.salesDetail.cardType = _cardType;
                                            }
                                        }
                                    }
                                }

                                if (!valid.salesDetail.cardNumber || valid.salesDetail.cardNumber == '')
                                    salesDetailError["cardNumber"] = "Nomor Kartu harus diisi";

                                // if (!valid.salesDetail.cardName || valid.salesDetail.cardName == '')
                                //     salesDetailError["cardName"] = "cardName is required"; 

                                if (valid.salesDetail.cardAmount == undefined || (valid.salesDetail.cardAmount && valid.salesDetail.cardAmount == '')) {
                                    salesDetailError["cardAmount"] = "Card Amount harus diisi";
                                    valid.salesDetail.cardAmount = 0;
                                }
                                else if (parseInt(valid.salesDetail.cardAmount) <= 0) {
                                    salesDetailError["cardAmount"] = "Card Amount harus lebih besar dari 0";
                                }
                                else
                                    valid.salesDetail.cardAmount = parseInt(valid.salesDetail.cardAmount);
                            }

                            if (valid.salesDetail.paymentType.toLowerCase() == "cash" || valid.salesDetail.paymentType.toLowerCase() == "partial") {
                                if (valid.salesDetail.cashAmount == undefined || (valid.salesDetail.cashAmount && valid.salesDetail.cashAmount == '')) {
                                    salesDetailError["cashAmount"] = "Cash Amount harus diisi";
                                    valid.salesDetail.cashAmount = 0;
                                }
                                else if (parseInt(valid.salesDetail.cashAmount) < 0) {
                                    salesDetailError["cashAmount"] = "Cash Amount harus lebih besar dari 0";
                                }
                                else
                                    valid.salesDetail.cashAmount = parseInt(valid.salesDetail.cashAmount);
                            }

                            if (valid.salesDetail.paymentType.toLowerCase() == "partial") {
                                if (valid.salesDetail.cashAmount == undefined || (valid.salesDetail.cashAmount && valid.salesDetail.cashAmount == '')) {
                                    salesDetailError["cashAmount"] = "Cash Amount harus diisi";
                                    valid.salesDetail.cashAmount = 0;
                                }
                                else if (parseInt(valid.salesDetail.cashAmount) <= 0) {
                                    salesDetailError["cashAmount"] = "Cash Amount harus lebih besar dari 0";
                                }
                                else
                                    valid.salesDetail.cashAmount = parseInt(valid.salesDetail.cashAmount);
                            }

                            if (valid.salesDetail.voucher) {
                                var voucherError = {};
                                if (valid.salesDetail.voucher.value == undefined || (valid.salesDetail.voucher.value && valid.salesDetail.voucher.value == '')) {
                                    valid.salesDetail.voucher.value = 0;
                                }
                                // if (parseInt(valid.salesDetail.voucher.value) > parseInt(valid.grandTotal)) {
                                //     voucherError["value"] = "voucher must be less than grandTotal";
                                // }
                                else
                                    valid.salesDetail.voucher.value = parseInt(valid.salesDetail.voucher.value);

                                for (var prop in voucherError) {
                                    salesDetailError["voucher"] = voucherError;
                                    break;
                                }
                            }

                            var totalPayment = 0;
                            if (valid.salesDetail.paymentType.toLowerCase() == "partial")
                                totalPayment = parseInt(valid.salesDetail.cashAmount) + parseInt(valid.salesDetail.cardAmount) + parseInt(valid.salesDetail.voucher.value);

                            if (valid.salesDetail.paymentType.toLowerCase() == "card")
                                totalPayment = parseInt(valid.salesDetail.cardAmount) + parseInt(valid.salesDetail.voucher.value);

                            if (valid.salesDetail.paymentType.toLowerCase() == "cash")
                                totalPayment = parseInt(valid.salesDetail.cashAmount) + parseInt(valid.salesDetail.voucher.value);

                            if (parseInt(totalPayment) < parseInt(valid.grandTotal))
                                errors["grandTotal"] = "grandTotal is bigger than payment";
                        }
                    }

                    for (var prop in salesDetailError) {
                        errors["salesDetail"] = salesDetailError;
                        break;
                    }

                    for (var prop in errors) {
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    // valid = new Sales(valid);
                    // valid.stamp(this.user.username, 'manager');
                    // resolve(valid);

                    var getStocks = [];
                    for (var _item of _items) {
                        getStocks.push(this.inventoryManager.getByStorageIdAndItemIdOrDefault(_store.storageId, _item._id));
                    }
                    Promise.all(getStocks)
                        .then(resultStocks => {
                            var itemErrors = [];
                            for (var stock of resultStocks) {
                                var index = resultStocks.indexOf(stock);
                                var item = valid.items[index];
                                var itemError = {};
                                if (stock) {
                                    if (!item.isReturn && item.quantity > stock.quantity) {
                                        itemError["quantity"] = "Stok Tidak Tersedia";
                                    }
                                }
                                else {
                                    itemError["quantity"] = "Stok Tidak Tersedia";
                                }
                                itemErrors.push(itemError);
                            }
                            for (var itemError of itemErrors) {
                                for (var prop in itemError) {
                                    errors.items = itemErrors;
                                    break;
                                }
                                if (errors.items)
                                    break;
                            }
                            for (var prop in errors) {
                                var ValidationError = require('module-toolkit').ValidationError;
                                reject(new ValidationError('data does not pass validation', errors));
                            }

                            valid = new Sales(valid);
                            valid.stamp(this.user.username, 'manager');
                            resolve(valid);
                        })
                        .catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    for (var prop in errors) {
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }
                    reject(e);
                })
        });
    }

    getStringDate(date) {
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //January is 0! 
        var yyyy = date.getFullYear();
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        date = yyyy + '-' + mm + '-' + dd;
        return date;
    }

    getUTCStringDate(date) {
        var dd = date.getUTCDate();
        var mm = date.getUTCMonth() + 1; //January is 0! 
        var yyyy = date.getUTCFullYear();
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        date = yyyy + '-' + mm + '-' + dd;
        return date;
    }

    getUTCStringTime(date) {
        var hh = date.getUTCHours();
        var mm = date.getUTCMinutes();
        var ss = date.getUTCSeconds();
        if (hh < 10) {
            hh = '0' + hh
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        if (ss < 10) {
            ss = '0' + ss
        }
        date = hh + ':' + mm + ':' + ss;
        return date;
    }

};