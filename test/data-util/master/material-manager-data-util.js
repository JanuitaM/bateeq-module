"use strict";
var _getSert = require("./getsert");
var generateCode = require("../../../src/utils/code-generator");

class MaterialManagerDataUtil {
    getSert(input) {
        var ManagerType = require("../../../src/managers/master/supplier-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
        var Material = require('bateeq-models').master.Material;
        var Component = require('bateeq-models').master.Component;
        var material = new Material();

        var now = new Date();
 
        var code = generateCode();

        material.code = code;
        material.name = `name[${code}]`;
        material.description = `description for ${code}`;
        material.uom = 'pcs';

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
        material.components.push(component);
        material.components.push(component2);

        return Promise.resolve(material);
    }

}
module.exports = new MaterialManagerDataUtil();