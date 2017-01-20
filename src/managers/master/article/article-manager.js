'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;

var ArticleApproval = BateeqModels.master.article.ArticleApproval;
var ArticleBrand = BateeqModels.master.article.ArticleBrand;
var ArticleCategory = BateeqModels.master.article.ArticleCategory;
var ArticleColor = BateeqModels.master.article.ArticleColor;
var ArticleCostCalculationDetail = BateeqModels.master.article.ArticleCostCalculationDetail;
var ArticleCostCalculation = BateeqModels.master.article.ArticleCostCalculation;
var ArticleCounter = BateeqModels.master.article.ArticleCounter;
var ArticleMaterial = BateeqModels.master.article.ArticleMaterial;
var ArticleMotif = BateeqModels.master.article.ArticleMotif;
var ArticleOrigin = BateeqModels.master.article.ArticleOrigin;
var ArticleSeason = BateeqModels.master.article.ArticleSeason;
var ArticleSize = BateeqModels.master.article.ArticleSize;
var ArticleSubCounter = BateeqModels.master.article.ArticleSubCounter;
var ArticleTheme = BateeqModels.master.article.ArticleTheme;
var ArticleType = BateeqModels.master.article.ArticleType;
var ArticleVariant = BateeqModels.master.article.ArticleVariant;
var Article = BateeqModels.master.article.Article;

module.exports = class ArticleManager {
    constructor(db, user) {
        this.db = db;
        this.user = user;
        this.articleCollection = this.db.use(map.master.article.Article);
        this.articleApprovalCollection = this.db.use(map.master.article.ArticleApproval);
    }

    read(paging) {
        var _paging = Object.assign({
            page: 1,
            size: 20,
            order: '_id',
            asc: true
        }, paging);

        return new Promise((resolve, reject) => {
            var deleted = {
                _deleted: false
            };
            var query = _paging.keyword ? {
                '$and': [deleted]
            } : deleted;

            if (_paging.keyword) {
                var regex = new RegExp(_paging.keyword, "i");
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
                var $or = {
                    '$or': [filterCode, filterName]
                };

                query['$and'].push($or);
            }


            this.articleCollection
                .where(query)
                .page(_paging.page, _paging.size)
                .orderBy(_paging.order, _paging.asc)
                .execute()
                .then(articles => {
                    resolve(articles);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleById(id) {
        return new Promise((resolve, reject) => {
            if (id === '')
                resolve(null);
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleByQuery(query)
                .then(article => {
                    resolve(article);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByIdOrDefault(id) {
        return new Promise((resolve, reject) => {
            if (id === '')
                resolve(null);
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleByQueryOrDefault(query)
                .then(article => {
                    resolve(article);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByQuery(query) {
        return new Promise((resolve, reject) => {
            this.articleCollection
                .single(query)
                .then(article => {
                    resolve(article);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getSingleByQueryOrDefault(query) {
        return new Promise((resolve, reject) => {
            this.articleCollection
                .singleOrDefault(query)
                .then(article => {
                    resolve(article);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    create(article) {
        return new Promise((resolve, reject) => {
            this._validate(article)
                .then(validArticle => {

                    this.articleCollection.insert(validArticle)
                        .then(id => {
                            resolve(id);
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

    update(article) {
        return new Promise((resolve, reject) => {
            this._validate(article)
                .then(validArticle => {
                    this.articleCollection.update(validArticle)
                        .then(id => {
                            resolve(id);
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

    delete(article) {
        return new Promise((resolve, reject) => {
            this._validate(article)
                .then(validArticle => {
                    validArticle._deleted = true;
                    this.articleCollection.update(validArticle)
                        .then(id => {
                            resolve(id);
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


    _validate(article) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = new Article(article);
            //1.begin: Declare promises.
            var getArticleMotif = this.articleCollection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                    code: valid.code
                }]
            });
            //1. end:Declare promises.

            //2.begin: Validation 
            Promise.all([getArticleMotif])
                .then(results => {
                    var _articleMotif = results[0];

                    if (!valid.code || valid.code == '')
                        errors["code"] = "code is required";
                    else if (_articleMotif) {
                        errors["code"] = "code already exists";
                    }

                    if (!valid.name || valid.name == '')
                        errors["name"] = "name is required";

                    // 2a. begin: check if data has any error, reject if it has.
                    for (var prop in errors) {
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    valid.stamp(this.user.username, 'manager');
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                })
        });
    }
};