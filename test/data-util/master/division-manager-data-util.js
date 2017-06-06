"use strict";
var _getSert = require("./getsert");
var generateCode = require("../../../src/utils/code-generator");

class DivisionManagerDataUtil {
    getSert(input) {
        var ManagerType = require("../../../src/managers/master/division-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() { 
        var Models = require('bateeq-models').master.Division;
        var module = new Models();

        var now = new Date();

        var code = generateCode();

        module.code = code;
        module.name = `name[${code}]`;
        module.description = `description for ${code}`; 

        return Promise.resolve(module);
    } 
}
module.exports = new DivisionManagerDataUtil();