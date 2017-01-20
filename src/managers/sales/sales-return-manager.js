'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var BateeqModels = require('bateeq-models');
var Sales = BateeqModels.sales.Sales;
var SalesItem = BateeqModels.sales.SalesItem;
var SalesReturn = BateeqModels.sales.SalesReturn;
var SalesReturnItem = BateeqModels.sales.SalesReturnItem;
var TransferOutDoc = BateeqModels.inventory.TransferOutDoc;
var TransferInDoc = BateeqModels.inventory.TransferInDoc;
var map = BateeqModels.map;
var generateCode = require('../../utils/code-generator');

module.exports = class SalesReturnManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.sales.SalesReturnDoc);

        var SalesManager = require('./sales-manager');
        this.salesManager = new SalesManager(db, user);

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
            name: `ix_${map.sales.SalesReturnDoc}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        }

        var codeIndex = {
            name: `ix_${map.sales.SalesReturnDoc}_code`,
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

    create(salesVM) {
        return new Promise((resolve, reject) => {
            salesVM.code = generateCode("salesreturn");
            this._validate(salesVM)
                .then(validSalesVM => {
                    //membuat model sales
                    var validSales = new Sales(validSalesVM);
                    validSales.isReturn = true;
                    var newItems = [];
                    for (var item of validSales.items) {
                        item.isReturn = true;
                        for (var newItem of item.returnItems) {
                            var newSalesItem = new SalesItem(newItem);
                            newSalesItem.isReturn = false;
                            newSalesItem.returnItems = [];
                            newItems.push(newSalesItem);
                        }
                    }
                    for (var item of newItems) {
                        validSales.items.push(item);
                    }

                    this.salesManager.create(validSales)
                        .then(result => {
                            var getSales = [];
                            getSales.push(this.salesManager.getSingleByIdOrDefault(validSalesVM.reference));
                            getSales.push(this.salesManager.getSingleByIdOrDefault(result));

                            Promise.all(getSales)
                                .then(results => {
                                    var _sales = results[0];
                                    var _salesReturn = results[1];
                                    var salesReturn = new SalesReturn();
                                    salesReturn.code = _salesReturn.code;
                                    salesReturn.date = _salesReturn.date;
                                    salesReturn.salesDocId = _sales._id;
                                    salesReturn.salesDoc = _sales;
                                    salesReturn.salesDocReturnId = _salesReturn._id;
                                    salesReturn.salesDocReturn = _salesReturn;
                                    salesReturn.storeId = _salesReturn.storeId;
                                    salesReturn.store = _salesReturn.store;
                                    salesReturn.returnItems = [];
                                    for (var _salesReturnItem of _salesReturn.items) {
                                        if (_salesReturnItem.isReturn) {
                                            var salesReturnItem = new SalesReturnItem();
                                            salesReturnItem.itemId = _salesReturnItem.itemId;
                                            salesReturnItem.item = _salesReturnItem.item;
                                            salesReturnItem.quantity = _salesReturnItem.quantity;
                                            salesReturn.returnItems.push(salesReturnItem);
                                        }
                                    }
                                    salesReturn.stamp(this.user.username, 'manager');
                                    salesReturn._createdDate = new Date();
                                    this.collection.insert(salesReturn)
                                        .then(result => {
                                            resolve(result);
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
                        })
                })
                .catch(e => {
                    reject(e);
                })
        });
    }

    _void(salesDoc) {
        return new Promise((resolve, reject) => {
            this.collection.singleOrDefault({ "salesDocReturn._id": new ObjectId(salesDoc._id), _deleted: false, isVoid: false })
                .then(result => {
                    // update sales
                    result.isVoid = true;
                    var valid = new SalesReturn(result);
                    valid.stamp(this.user.username, 'manager');
                    this.collection.update(valid)
                        .then(id => {
                            resolve(id);
                        })
                        .catch(e => {
                            reject(e);
                        });
                });
        })
    }

    _validate(salesVM) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = new Sales(salesVM);

            if (!valid.code || valid.code == '')
                errors["code"] = "code is required";
            if (!salesVM.storeId || salesVM.storeId == '')
                errors["storeId"] = "storeId is required";
            valid.date = new Date(valid.date);
            if (Object.prototype.toString.call(valid.date) === "[object Date]") {
                if (isNaN(valid.date.getTime())) {
                    errors["date"] = "date is not valid";
                }
            }
            else {
                errors["date"] = "date is not valid";
            }

            //Get sales data
            var getReturnSales = this.collection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                    code: valid.code
                }]
            });
            var getSales;
            var getStore;
            var getBank = Promise.resolve(null);
            var getCardType = Promise.resolve(null);
            var getVoucher = Promise.resolve(null);
            var getItems = [];
            var getPromos = [];
            var getReturnItems = [];
            var getReturnItemPromos = [];

            if (salesVM.reference && ObjectId.isValid(salesVM.reference)) {
                getSales = this.salesManager.getSingleByIdOrDefault(salesVM.reference);
            }
            else
                getSales = Promise.resolve(null);

            if (salesVM.storeId && ObjectId.isValid(salesVM.storeId)) {
                getStore = this.storeManager.getSingleByIdOrDefault(salesVM.storeId);
            }
            else
                getStore = Promise.resolve(null);

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

                    if (item.returnItems && item.returnItems.length > 0) {
                        for (var returnItem of item.returnItems) {
                            if (returnItem.itemId && ObjectId.isValid(returnItem.itemId)) {
                                getReturnItems.push(this.itemManager.getSingleByIdOrDefault(returnItem.itemId));
                            }
                            else {
                                getReturnItems.push(Promise.resolve(null));
                                returnItem.itemId = {};
                            }

                            if (returnItem.promoId && ObjectId.isValid(returnItem.promoId)) {
                                getReturnItemPromos.push(this.promoManager.getSingleByIdOrDefault(returnItem.promoId));
                            }
                            else {
                                getReturnItemPromos.push(Promise.resolve(null));
                                returnItem.promoId = {};
                            }
                        }
                    }
                }
            }
            else {
                errors["items"] = "items is required";
            }

            var countGetItems = getItems.length;
            var countGetPromos = getPromos.length;
            Promise.all([getReturnSales, getSales, getStore, getBank, getCardType, getVoucher].concat(getItems).concat(getPromos))
                .then(results => {
                    var _returnSales = results[0];
                    var _sales = results[1];
                    var _store = results[2];
                    var _bank = results[3];
                    var _cardType = results[4];
                    var _voucherType = results[5];
                    var _items = results.slice(6, results.length - countGetPromos)
                    var _promos = results.slice(results.length - countGetPromos, results.length)


                    var countGetReturnItems = getReturnItems.length;
                    var countGetReturnItemPromos = getReturnItemPromos.length;

                    Promise.all(getReturnItems.concat(getReturnItemPromos))
                        .then(returnItemResults => {
                            var _returnItems = returnItemResults.slice(0, returnItemResults.length - countGetReturnItemPromos)
                            var _returnItemPromos = returnItemResults.slice(returnItemResults.length - countGetReturnItemPromos, returnItemResults.length)

                            if (_returnSales) {
                                errors["code"] = "code already exists";
                            }

                            if (!_sales) {
                                errors["reference"] = "salesId not found";
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


                            valid.totalProduct = 0;
                            valid.subTotal = 0;
                            valid.grandTotal = 0;
                            if (_items.length > 0) {
                                var itemErrors = [];

                                var _returnItemIndex = 0;
                                for (var item of valid.items) {
                                    var index = valid.items.indexOf(item);
                                    var _item = _items[index];
                                    var itemError = {};

                                    if (!item.itemId || !ObjectId.isValid(item.itemId)) {
                                        itemError["itemId"] = "itemId is required";
                                    }
                                    else {
                                        for (var i = valid.items.indexOf(item) + 1; i < valid.items.length; i++) {
                                            var otherItem = valid.items[i];
                                            if (item.itemId == otherItem.itemId) {
                                                itemError["itemId"] = "itemId already exists on another detail";
                                            }
                                        }
                                        if (_sales) {
                                            var isAnyInSales = false;
                                            for (var salesItem of _sales.items) {
                                                if (salesItem.itemId.toString() == item.itemId.toString()) {
                                                    isAnyInSales = true;
                                                    break;
                                                }
                                            }
                                            if (!isAnyInSales)
                                                itemError["itemId"] = "itemId not exists in sales";
                                        }
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
                                        }
                                    }

                                    if (item.quantity == undefined || (item.quantity && item.quantity == '')) {
                                        itemError["quantity"] = "quantity is required";
                                        item.quantity = 0;
                                    }
                                    else if (parseInt(item.quantity) <= 0) {
                                        itemError["quantity"] = "quantity must be greater than 0";
                                    }
                                    else {
                                        if (_sales) {
                                            for (var salesItem of _sales.items) {
                                                if (!salesItem.isReturn && salesItem.itemId.toString() == item.itemId.toString()) {
                                                    if (parseInt(item.quantity) > parseInt(salesItem.quantity)) {
                                                        itemError["quantity"] = "quantity must not be greater than " + salesItem.quantity;
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                        item.quantity = parseInt(item.quantity);
                                    }

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

                                    if (item.returnItems && item.returnItems.length > 0) {
                                        var returnItemErrors = [];
                                        for (var returnItem of item.returnItems) {
                                            var _returnItem = _returnItems[_returnItemIndex];
                                            var returnItemError = {};

                                            if (!returnItem.itemId || !ObjectId.isValid(returnItem.itemId)) {
                                                returnItemError["itemId"] = "itemId is required";
                                            }
                                            else {
                                                for (var i = item.returnItems.indexOf(returnItem) + 1; i < item.returnItems.length; i++) {
                                                    var otherReturnItem = item.returnItems[i];
                                                    if (returnItem.itemId == otherReturnItem.itemId) {
                                                        returnItemError["itemId"] = "itemId already exists on another detail";
                                                    }
                                                }
                                            }

                                            if (!_returnItem) {
                                                returnItemError["itemId"] = "itemId not found";
                                            }
                                            else {
                                                returnItem.itemId = _returnItem._id;
                                                returnItem.item = _returnItem;
                                                if (_returnItem.size)
                                                    if (_returnItem.size.name)
                                                        returnItem.size = _returnItem.size.name;
                                                //returnItem.price = parseInt(_returnItem.domesticSale);
                                            }

                                            if (!returnItem.promoId || !ObjectId.isValid(returnItem.promoId)) { }
                                            else {
                                                var _returnItemPromo = _returnItemPromos[_returnItemIndex];
                                                if (!_returnItemPromo) {
                                                    returnItemError["promoId"] = "promoId not found";
                                                }
                                                else {
                                                    returnItem.promoId = _returnItemPromo._id;
                                                    returnItem.promo = _returnItemPromo;
                                                }
                                            }
                                            if (!item.promoId || !ObjectId.isValid(item.promoId)) { }
                                            else {
                                                var _promo = _promos[index];
                                                if (!_promo) {
                                                    //itemError["promoId"] = "promoId not found";
                                                }
                                                else {
                                                    var promo = item.promo;
                                                    var ro = '';
                                                    if (item.item) {
                                                        if (item.item.article)
                                                            ro = item.item.article.realizationOrder;
                                                    }
                                                    var returnRo = '';
                                                    if (returnItem.item) {
                                                        if (returnItem.item.article)
                                                            returnRo = returnItem.item.article.realizationOrder;
                                                    }

                                                    var isGetPromo = true;
                                                    if (ro == returnRo) {
                                                        isGetPromo = false;
                                                    }
                                                    if (promo.reward.type == "special-price") {
                                                        for (var criterion of promo.criteria.criterions) {
                                                            if (returnItem.itemId == criterion.itemId) {
                                                                isGetPromo = false;
                                                                break;
                                                            }
                                                        }
                                                        if (isGetPromo)
                                                            returnItemError["itemId"] = "Barang baru harus berada di paket yang sama";
                                                        else {
                                                            if (returnItem.quantity > item.quantity) {
                                                                returnItemError["quantity"] = "Barang baru tidak boleh lebih besar dari barang diretur";
                                                            }
                                                        }
                                                    }
                                                    if (!isGetPromo) {
                                                        //langsung copy promo aja
                                                        // returnItem.price = parseInt(item.price);
                                                        // returnItem.discount1 = parseInt(item.discount1);
                                                        // returnItem.discount2 = parseInt(item.discount2);
                                                        // returnItem.discountNominal = parseInt(item.discountNominal);
                                                        // returnItem.specialDiscount = parseInt(item.specialDiscount);
                                                        // returnItem.margin = parseInt(item.margin);
                                                        // returnItem.promoId = item.promoId;
                                                        // returnItem.promo = item.promo; 
                                                    }
                                                }
                                            }

                                            if (returnItem.quantity == undefined || (returnItem.quantity && returnItem.quantity == '')) {
                                                returnItemError["quantity"] = "quantity is required";
                                                returnItem.quantity = 0;
                                            }
                                            else if (parseInt(returnItem.quantity) <= 0) {
                                                returnItemError["quantity"] = "quantity must be greater than 0";
                                            }
                                            else {
                                                returnItem.quantity = parseInt(returnItem.quantity);
                                            }

                                            if (returnItem.price == undefined || (returnItem.price && returnItem.price == '')) {
                                                returnItemError["price"] = "price is required";
                                                returnItem.price = 0;
                                            }
                                            else if (parseInt(returnItem.price) < 0) {
                                                returnItemError["price"] = "price must be greater than 0";
                                            }
                                            else
                                                returnItem.price = parseInt(returnItem.price);

                                            if (returnItem.discount1 == undefined || (returnItem.discount1 && returnItem.discount1 == '')) {
                                                returnItemError["discount1"] = "discount1 is required";
                                                returnItem.discount1 = 0;
                                            }
                                            else if (parseInt(returnItem.discount1) < 0 || parseInt(returnItem.discount1) > 100) {
                                                returnItemError["discount1"] = "discount1 must be greater than 0 or less than 100";
                                            }
                                            else
                                                returnItem.discount1 = parseInt(returnItem.discount1);

                                            if (returnItem.discount2 == undefined || (returnItem.discount2 && returnItem.discount2 == '')) {
                                                returnItemError["discount2"] = "discount2 is required";
                                                returnItem.discount2 = 0;
                                            }
                                            else if (parseInt(returnItem.discount2) < 0 || parseInt(returnItem.discount2) > 100) {
                                                returnItemError["discount2"] = "discount2 must be greater than 0 or less than 100";
                                            }
                                            else
                                                returnItem.discount2 = parseInt(returnItem.discount2);

                                            if (returnItem.discountNominal == undefined || (returnItem.discountNominal && returnItem.discountNominal == '')) {
                                                returnItemError["discountNominal"] = "discountNominal is required";
                                                returnItem.discountNominal = 0;
                                            }
                                            else if (parseInt(returnItem.discountNominal) < 0) {
                                                returnItemError["discountNominal"] = "discountNominal must be greater than 0";
                                            }
                                            else
                                                returnItem.discountNominal = parseInt(returnItem.discountNominal);

                                            if (returnItem.margin == undefined || (returnItem.margin && returnItem.margin == '')) {
                                                returnItemError["margin"] = "margin is required";
                                                returnItem.margin = 0;
                                            }
                                            else if (parseInt(returnItem.margin) < 0 || parseInt(returnItem.margin) > 100) {
                                                returnItemError["margin"] = "margin must be greater than 0 or less than 100";
                                            }
                                            else
                                                returnItem.margin = parseInt(returnItem.margin);

                                            if (returnItem.specialDiscount == undefined || (returnItem.specialDiscount && returnItem.specialDiscount == '')) {
                                                returnItemError["specialDiscount"] = "specialDiscount is required";
                                                returnItem.margin = 0;
                                            }
                                            else if (parseInt(returnItem.specialDiscount) < 0 || parseInt(returnItem.specialDiscount) > 100) {
                                                returnItemError["specialDiscount"] = "specialDiscount must be greater than 0 or less than 100";
                                            }
                                            else
                                                returnItem.specialDiscount = parseInt(returnItem.specialDiscount);

                                            _returnItemIndex += 1;
                                            returnItemErrors.push(returnItemError);
                                        }
                                        for (var returnItemError of returnItemErrors) {
                                            for (var prop in returnItemError) {
                                                itemError.returnItems = returnItemErrors;
                                                break;
                                            }
                                            if (itemError.returnItems)
                                                break;
                                        }
                                    }
                                    else {
                                        itemError["returnItems"] = "returnItems is required";
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
                            }

                            for (var prop in errors) {
                                var ValidationError = require('module-toolkit').ValidationError;
                                reject(new ValidationError('data does not pass validation', errors));
                            }


                            var getStocks = [];
                            for (var item of valid.items) {
                                for (var returnItem of item.returnItems) {
                                    getStocks.push(this.inventoryManager.getByStorageIdAndItemIdOrDefault(_store.storageId, returnItem.itemId));
                                }
                            }
                            Promise.all(getStocks)
                                .then(resultStocks => {
                                    var itemErrors = [];
                                    var stockIndex = 0;
                                    for (var item of valid.items) {
                                        var itemError = {};
                                        var returnItemErrors = [];
                                        for (var returnItem of item.returnItems) {
                                            var returnItemError = {};
                                            var stock = resultStocks[stockIndex];

                                            if (stock) {
                                                if (returnItem.quantity > stock.quantity) {
                                                    returnItemError["quantity"] = "Stok Tidak Tersedia";
                                                }
                                            }
                                            else {
                                                returnItemError["quantity"] = "Stok Tidak Tersedia";
                                            }
                                            stockIndex += 1;
                                            returnItemErrors.push(returnItemError);
                                        }
                                        for (var returnItemError of returnItemErrors) {
                                            for (var prop in returnItemError) {
                                                itemError.returnItems = returnItemErrors;
                                                break;
                                            }
                                            if (itemError.returnItems)
                                                break;
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