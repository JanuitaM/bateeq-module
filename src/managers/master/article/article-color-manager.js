'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;

var ArticleColor = BateeqModels.master.article.ArticleColor;

module.exports = class ArticleColorManager {
    constructor(db, user) {
        this.db = db;
        this.user = user;
        this.articleColorCollection = this.db.use(map.master.article.ArticleColor);
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


            this.articleColorCollection
                .where(query)
                .page(_paging.page, _paging.size)
                .orderBy(_paging.order, _paging.asc)
                .execute()
                .then(articleColors => {
                    resolve(articleColors);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    readAll() {
        var query = {
            _deleted: false
        }

        return new Promise((resolve, reject) => {
            this.articleColorCollection
                .where(query)
                .orderBy("name", true)
                .execute()
                .then(articleColors => {
                    resolve(articleColors);
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
                .then(articleColor => {
                    resolve(articleColor);
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
                .then(articleColor => {
                    resolve(articleColor);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByQuery(query) {
        return new Promise((resolve, reject) => {
            this.articleColorCollection
                .single(query)
                .then(articleColor => {
                    resolve(articleColor);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }
    getSingleByQueryOrDefault(query) {
        return new Promise((resolve, reject) => {
            this.articleColorCollection
                .singleOrDefault(query)
                .then(articleColor => {
                    resolve(articleColor);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }
};