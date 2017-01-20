"use strict";
var _getSert = require("./getsert");
var generateCode = require("../../../src/utils/code-generator");

class ModuleManagerDataUtil {
    getSert(input) {
        var ManagerType = require("../../../src/managers/master/module-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {

        var Models = require("bateeq-models").master.Module;
        var module = new Models();

        var now = new Date();

        var code = generateCode();

        module.code = code;
        module.name = `name[${code}]`;
        module.description = `description for ${code}`;
        module.config = {};


        return Promise.resolve(module);
    }

    // getTestData() {
    //     // Define properties.
    //     var data = {
    //         code="",
    //         name="",
    //         description="",
    //         phone="",
    //         address="",
    //     }

    //     return this.getSert(data);
    // }

}
module.exports = new ModuleManagerDataUtil();