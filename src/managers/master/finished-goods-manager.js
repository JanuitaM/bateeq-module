'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;
var ItemManager = require('./item-manager');
var FinishedGoods = BateeqModels.master.FinishedGoods;
var ArticleMotifManager = require('./article/article-motif-manager');
var ArticleColorManager = require('./article/article-color-manager');

module.exports = class FinishedGoodsManager extends ItemManager {
    constructor(db, user) {
        super(db, user);
    }

    _getQuery(paging) {
        var basicFilter = {
            _deleted: false,
            _type: 'finished-goods'
        }, keywordFilter = {};

        var query = {};

        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");
            var filterCode = {
                'code': {
                    '$regex': regex
                }
            };
            var filterName = {
                'name': {
                    '$regex': regex
                }
            };

            keywordFilter = {
                '$or': [filterCode, filterName]
            };
        }
        query = { '$and': [basicFilter, paging.filter, keywordFilter] };
        return query;
    }


    _validate(data) {
        return super._validate(new FinishedGoods(data));
        // var errors = {};
        // return new Promise((resolve, reject) => {
        //     // 1. begin: Declare promises.
        //     var getFinishedGoods = this.collection.singleOrDefault({
        //         "$and": [{
        //             _id: {
        //                 '$ne': new ObjectId(data._id)
        //             }
        //         }, {
        //             code: data.code
        //         }]
        //     });
        //     // 1. end: Declare promises.

        //     // 2. begin: Validation.
        //     Promise.all([getFinishedGoods])
        //         .then(results => {
        //             var _item = results[0];

        //             if (!data.code || data.code == '')
        //                 errors["code"] = "code is required";
        //             else if (_item)
        //                 errors["code"] = "code already exists";

        //             if (!data.name || data.name == '')
        //                 errors["name"] = "name is required";


        //             if (data.domesticCOGS == undefined || (data.domesticCOGS && data.domesticCOGS == '')) {
        //                 errors["domesticCOGS"] = "domesticCOGS is required";
        //             }
        //             else if (parseInt(data.domesticCOGS) < 0) {
        //                 errors["domesticCOGS"] = "domesticCOGS must be greater with 0";
        //             }
        //             if (data.domesticWholesale == undefined || (data.domesticWholesale && data.domesticWholesale == '')) {
        //                 errors["domesticWholesale"] = "domesticWholesale is required";
        //             }
        //             else if (parseInt(data.domesticWholesale) < 0) {
        //                 errors["domesticWholesale"] = "domesticWholesale must be greater with 0";
        //             }
        //             if (data.domesticRetail == undefined || (data.domesticRetail && data.domesticRetail == '')) {
        //                 errors["domesticRetail"] = "domesticRetail is required";
        //             }
        //             else if (parseInt(data.domesticRetail) < 0) {
        //                 errors["domesticRetail"] = "domesticRetail must be greater with 0";
        //             }
        //             if (data.domesticSale == undefined || (data.domesticSale && data.domesticSale == '')) {
        //                 errors["domesticSale"] = "domesticSale is required";
        //             }
        //             else if (parseInt(data.domesticSale) < 0) {
        //                 errors["domesticSale"] = "domesticSale must be greater with 0";
        //             }
        //             if (data.internationalCOGS == undefined || (data.internationalCOGS && data.internationalCOGS == '')) {
        //                 errors["internationalCOGS"] = "internationalCOGS is required";
        //             }
        //             else if (parseInt(data.internationalCOGS) < 0) {
        //                 errors["internationalCOGS"] = "internationalCOGS must be greater with 0";
        //             }
        //             if (data.internationalWholesale == undefined || (data.internationalWholesale && data.internationalWholesale == '')) {
        //                 errors["internationalWholesale"] = "internationalWholesale is required";
        //             }
        //             else if (parseInt(data.internationalWholesale) < 0) {
        //                 errors["internationalWholesale"] = "internationalWholesale must be greater with 0";
        //             }
        //             if (data.internationalRetail == undefined || (data.internationalRetail && data.internationalRetail == '')) {
        //                 errors["internationalRetail"] = "internationalRetail is required";
        //             }
        //             else if (parseInt(data.internationalRetail) < 0) {
        //                 errors["internationalRetail"] = "internationalRetail must be greater with 0";
        //             }
        //             if (data.internationalSale == undefined || (data.internationalSale && data.internationalSale == '')) {
        //                 errors["internationalSale"] = "internationalSale is required";
        //             }
        //             else if (parseInt(data.internationalSale) < 0) {
        //                 errors["internationalSale"] = "internationalSale must be greater with 0";
        //             }

        //             // 2c. begin: check if data has any error, reject if it has.
        //             for (var prop in errors) {
        //                 var ValidationError = require('../../validation-error');
        //                 reject(new ValidationError('data does not pass validation', errors));
        //             }

        //             var valid = new FinishedGoods(data);
        //             valid.stamp(this.user.username, 'manager');
        //             resolve(valid);
        //         })
        //         .catch(e => {
        //             reject(e);
        //         })
        // });
    }

    updateImage(colorCode, articleColor, products, imagePath, motifPath) {
        return new Promise((resolve, reject) => {
            var dataError = [], errorMessage;
            if (colorCode === "") {
                dataError["colorCode"] = "Kode warna harus diisi";
            }

            var articleMotifCode = "";

            if (!products || products.length == 0) {
                dataError["dataDestination"] = "Produk harus dipilih";
            } else {
                articleMotifCode = products[0].code.substring(9, 11);
            }

            var getItems = [];
            for (var item of products) {
                getItems.push(this.getByCode(item.code));
            }

            var motifManager = new ArticleMotifManager(this.db, this.user);
            var getMotif = motifManager.getSingleByQuery({
                "code": articleMotifCode
            })

            var colorManager = new ArticleColorManager(this.db, this.user);
            var getColor = colorManager.getSingleByIdOrDefault(articleColor._id);


            Promise.all([getMotif, getColor].concat(getItems))
                .then(results => {
                    if (results[0] && results[1] && results.length > 2) {

                        var motif = results[0];
                        var color = results[1];
                        motif["filePath"] = motifPath;
                        var updateMotif = motifManager.update(motif);


                        var updateItem = [];
                        for (var i = 2; i < results.length; i++) {
                            var item = results[i];
                            item["imagePath"] = imagePath;
                            item["motifPath"] = imagePath;
                            item["motifDoc"] = motif;
                            item["colorCode"] = colorCode;
                            item["colorDoc"] = color;
                            updateItem.push(this.update(item));
                        }

                        Promise.all([updateMotif].concat(updateItem))
                            .then(updateResults => {
                                resolve(updateResults);
                            })
                            .catch(updateErrors => {
                                reject(updateErrors);
                            })
                    } else {
                        if (!results[2]) {
                            dataError["dataDestination"] = "produk tidak ditemukan";
                        }
                        if (!results[0]) {
                            dataError["motif"] = "article motif tidak ditemukan";
                        }
                        if (!results[1]) {
                            dataError["color"] = "article color tidak ditemukan";
                        }

                        if (dataError.length > 0) {
                            resolve(dataError);
                        }
                    }
                })
                .catch(errors => {
                    reject(errors);
                });
        });
    }

    insert(dataFile) {
        return new Promise((resolve, reject) => {
            var data = [];
            if (dataFile != "") {
                for (var i = 1; i < dataFile.length; i++) {
                    data.push({ "code": dataFile[i][0], "name": dataFile[i][1], "uom": dataFile[i][2], "size": dataFile[i][3], "domesticCOGS": dataFile[i][4], "domesticSale": dataFile[i][5], "internationalSale": dataFile[i][6], "realizationOrder": dataFile[i][7] });
                }
            }
            var dataError = [], errorMessage;
            for (var i = 0; i < data.length; i++) {
                errorMessage = "";
                if (data[i]["code"] === "") {
                    errorMessage = errorMessage + "Barcode List tidak boleh kosong,";
                }
                if (data[i]["name"] === "") {
                    errorMessage = errorMessage + "Nama tidak boleh kosong,";
                }
                if (data[i]["size"] === "") {
                    errorMessage = errorMessage + "Size tidak boleh kosong,";
                }
                if (data[i]["domesticCOGS"] === "") {
                    errorMessage = errorMessage + "HPP tidak boleh kosong,";
                }
                if (data[i]["domesticCOGS"] !== "" || data[i]["domesticCOGS"] !== " ") {
                    if (isNaN(data[i]["domesticCOGS"])) {
                        errorMessage = errorMessage + "HPP harus numerik,";
                    }
                }
                if (data[i]["domesticSale"] === "") {
                    errorMessage = errorMessage + "Harga Jual (Domestic) tidak boleh kosong,";
                }
                if (data[i]["domesticSale"] !== "" || data[i]["domesticSale"] !== " ") {
                    if (isNaN(data[i]["domesticSale"])) {
                        errorMessage = errorMessage + "Harga Jual (Domestic) harus numerik,";
                    }
                }
                if (data[i]["internationalSale"] === "") {
                    errorMessage = errorMessage + "Harga Jual (Internasional) tidak boleh kosong,";
                }
                if (data[i]["internationalSale"] !== "" || data[i]["internationalSale"] !== " ") {
                    if (isNaN(data[i]["internationalSale"])) {
                        errorMessage = errorMessage + "Harga Jual (Internasional) harus numerik,";
                    }
                }
                if (data[i]["realizationOrder"] === "") {
                    errorMessage = errorMessage + "RO tidak boleh kosong,";
                }

                if (errorMessage !== "") {
                    dataError.push({ "Barcode": data[i]["code"], "Nama": data[i]["name"], "UOM": data[i]["uom"], "Size": data[i]["size"], "HPP": data[i]["domesticCOGS"], "Harga Jual (Domestic)": data[i]["domesticSale"], "Harga Jual (Internasional)": data[i]["internationalSale"], "RO": data[i]["realizationOrder"], "Error": errorMessage });
                }
            }
            if (dataError.length === 0) {
                var fgTemp = [];
                for (var fg of data) {
                    var item = fg;
                    // super.getByCode(item.code)
                    //     .then(resultItem => {
                    // if (resultItem) {
                    //     resultItem.name = item.name;
                    //     resultItem.uom = item.uom;
                    //     resultItem.size = item.size;
                    //     resultItem.domesticCOGS = item.domesticCOGS;
                    //     resultItem.domesticSale = item.domesticSale;
                    //     resultItem.internationalSale = item.internationalSale;
                    //     resultItem.article.realizationOrder = item.realizationOrder;
                    //     this.update(resultItem)
                    //         .then(id => {
                    //             super.getSingleById(id)
                    //                 .then(resultItem => {
                    //                     fgTemp.push(resultItem)
                    //                     resolve(fgTemp);
                    //                 })
                    //                 .catch(e => {
                    //                     reject(e);
                    //                 });
                    //         })
                    //         .catch(e => {
                    //             reject(e);
                    //         });
                    // }
                    // else {
                    var finishGood = new FinishedGoods();
                    finishGood.code = item.code;
                    finishGood.name = item.name;
                    finishGood.uom = item.uom;
                    finishGood.size = item.size;
                    finishGood.domesticCOGS = item.domesticCOGS;
                    finishGood.internationalSale = item.internationalSale;
                    finishGood.domesticSale = item.domesticSale;
                    finishGood.article.realizationOrder = item.realizationOrder;
                    this.create(finishGood)
                        .then(id => {
                            super.getSingleById(id)
                                .then(resultItem => {
                                    fgTemp.push(resultItem)
                                    resolve(fgTemp);
                                })
                                .catch(e => {
                                    reject(e);
                                });
                        })
                        .catch(e => {
                            reject(e);
                        });
                    break;
                    // }

                    // })
                    // .catch(e => {
                    //     reject(e);
                    // });
                }
            } else {
                resolve(dataError);
            }

        });
    }
};