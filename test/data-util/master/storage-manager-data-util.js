"use strict";
var _getSert = require("./getsert");
var generateCode = require("../../../src/utils/code-generator");

class StorageManagerDataUtil {
    getSert(input) {
        var ManagerType = require("../../../src/managers/master/storage-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {

        var Models = require("bateeq-models").master.Storage;
        var storage = new Models();

        var now = new Date();
        var code = generateCode();

        storage.code = code;
        storage.name = `name[${code}]`;
        storage.description = `description for ${code}`;
        storage.phone = `phone for ${code}`;
        storage.address = `address for ${code}`;


        return Promise.resolve(storage);
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
module.exports = new StorageManagerDataUtil();
