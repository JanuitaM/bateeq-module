"use strict";
var _getSert = require("./getsert");
var generateCode = require("../../../src/utils/code-generator");

class CardTypeDataUtil {
    getSert(input) {
        var ManagerType = require("../../../src/managers/master/card-type-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
        var Model = require('bateeq-models').master.CardType;
        var data = new Model();
        
        // var now = new Date();
        // var stamp = now / 1000 | 0;
        var code = generateCode();
        
        data.code = code;
        data.name = `name[${code}]`;
        data.description = `description for ${code}`;
        return Promise.resolve(data);
    }
}
module.exports = new CardTypeDataUtil();