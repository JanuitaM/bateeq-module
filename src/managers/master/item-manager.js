'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var ComponentHelper = require('./component-helper');

var BateeqModels = require('bateeq-models');
var Item = BateeqModels.master.Item;
var FinishedGoods = BateeqModels.master.FinishedGoods;
var Material = BateeqModels.master.Material;
var map = BateeqModels.map;


module.exports = class ItemManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.master.Item);
        this.componentHelper = new ComponentHelper(this);
    }

    upsertComponents(data) {
        return new Promise((resolve, reject) => {
            var tag = `#${data.code}`;
            var task = [];
            for (var component of data.components) {

                var item = component.item;
                var tags = (item.tags || '').split(",").filter(el => el && el.trim().length > 0);
                var tagIndex = tags.findIndex(t => {
                    return t == tag;
                });

                if (tagIndex < 0)
                    tags.push(tag);

                item.tags = tags.join(",");

                if (item._id)
                    task.push(this.update(item));
                else
                    task.push(this.create(item));
            }

            Promise.all(task)
                .then(results => {
                    var getItems = [];

                    for (var itemId of results)
                        getItems.push(this.getSingleById(itemId));

                    Promise.all(getItems)
                        .then(items => {
                            var index = 0;
                            for (var item of items) {
                                var component = data.components[index++];
                                component.itemId = item._id;
                                component.item = item;
                            }
                            this.collection.update(data).then(id => {
                                resolve(id);
                            });
                        })
                        .catch(e => {
                            reject(e);
                        });
                })
                .catch(e => {
                    reject(e);
                });

        });
    }

    create(data) {
        return new Promise((resolve, reject) => {
            this._validate(data)
                .then(validData => {
                    this.collection.insert(validData)
                        .then(id => {
                            validData._id = id;
                            this.upsertComponents(validData)
                                .then(id => {
                                    resolve(id);
                                })
                                .catch(e => {
                                    reject(e);
                                });
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

    update(data) {
        return new Promise((resolve, reject) => {
            this._validate(data)
                .then(validData => {
                    this.collection.update(validData)
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

    getByCode(code) {
        return new Promise((resolve, reject) => {
            if (code === '')
                resolve(null);
            var query = {
                code: code,
                _deleted: false
            };
            this.collection.singleOrDefault(query)
                .then(item => {
                    resolve(item);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    _getQuery(paging) {
        var basicFilter = {
            _deleted: false
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
        var errors = {};
        return new Promise((resolve, reject) => {
            // 1. begin: Declare promises.
            var getItem = this.collection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(data._id)
                    }
                }, {
                    code: data.code
                }]
            });
            // 1. end: Declare promises.

            // 2. begin: Validation.
            Promise.all([getItem])
                .then(results => {
                    var _item = results[0];

                    if (!data.code || data.code == '')
                        errors["code"] = "code is required";
                    else if (_item)
                        errors["code"] = "code already exists";

                    if (!data.name || data.name == '')
                        errors["name"] = "name is required";

                    if (!data.uom || data.uom == '')
                        errors["uom"] = "uom is required";

                    this.componentHelper.validate(data.components)
                        .then(result => {
                            data.components = result.components;

                            // 2c. begin: check if data has any error, reject if it has.
                            for (var prop in errors) {
                                var ValidationError = require('module-toolkit').ValidationError;
                                reject(new ValidationError('data does not pass validation', errors));
                            }
                            var valid = data;
                            if (!valid.stamp) {
                                switch (data._type) {
                                    case 'material':
                                        valid = new Material(data);
                                        break;
                                    case 'finished-goods':
                                        valid = new FinishedGoods(data);
                                        break;
                                    default:
                                        valid = new Item(data);
                                }
                            }
                            valid.stamp(this.user.username, 'manager');
                            resolve(valid);
                        })
                        .catch(e => {
                            errors["components"] = e;

                            // 2c. begin: check if data has any error, reject if it has.
                            for (var prop in errors) {
                                var ValidationError = require('module-toolkit').ValidationError;
                                reject(new ValidationError('data does not pass validation', errors));
                            }
                        });
                })
                .catch(e => {
                    reject(e);
                })
        });
    }
};