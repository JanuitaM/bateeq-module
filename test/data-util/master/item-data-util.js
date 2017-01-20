"use strict";
var _getSert = require("./getsert");
var generateCode = require("../../../src/utils/code-generator");

class ItemDataUtil {
    getSert(input) {
        var ManagerType = require("../../../src/managers/master/bank-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
        var Item = require('bateeq-models').master.Item;
        var Component = require('bateeq-models').master.Component;
        var item = new Item();
        
        var code = generateCode('UnitTest');
        
        item.code = code;
        item.name = `name[${code}]`;
        item.description = `description for ${code}`;
        item.uom = 'pcs';
        var component = new Component({
            item: {
                name: 'new item',
                uom: 'pcs'
            },
            quantity: 1,
            uom: 'pcs'
        });
        item.components.push(component);
        
        return Promise.resolve(item);
    }

    getTestData() {
        var data = {
            code: "UT-AV1",
            name: "Silhouette S[UT]",
            description: "Unit test data: article silhoutte [S]",
            uom: "PCS",
            tags: "",
            components: [0]
        };
        return this.getSert(data);
    }
}
module.exports = new ItemDataUtil();