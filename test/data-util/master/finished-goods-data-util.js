"use strict";
var _getSert = require("./getsert");
var generateCode = require("../../../src/utils/code-generator");

class FinishedGoodsDataUtil {
    getSert(input) {
        var ManagerType = require("../../../src/managers/master/finished-goods-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
    var FinishedGoods = require('bateeq-models').master.FinishedGoods;
    var Material = require('bateeq-models').master.Material;
    var Component = require('bateeq-models').master.Component;
    var finishedGoods = new FinishedGoods();

    var code = generateCode('UnitTest');

    finishedGoods.code = generateCode("FinishedGoods");
    finishedGoods.name = `name[${code}]`;
    finishedGoods.description = `description for ${code}`;
    finishedGoods.uom = 'pcs';

    var component = new Component({
        item: {
            name: 'new item',
            uom: 'pcs'
        },
        quantity: 1,
        uom: 'pcs'
    });
    var component2 = new Component({
        item: new Material({
            name: 'new material',
            uom: 'pcs'
        }),
        quantity: 1,
        uom: 'pcs'
    });
    finishedGoods.components.push(component);
    finishedGoods.components.push(component2);

    return Promise.resolve(finishedGoods);
    }
}
module.exports = new FinishedGoodsDataUtil();