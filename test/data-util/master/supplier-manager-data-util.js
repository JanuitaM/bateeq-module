"use strict";
var _getSert = require("./getsert");
var generateCode = require("../../../src/utils/code-generator");

class SupplierManagerDataUtil {
    getSert(input) {
        var ManagerType = require("../../../src/managers/master/supplier-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
        var Models = require("bateeq-models").master.Supplier;
        var supplier = new Models();

        var now = new Date();
        var code = generateCode();

        supplier.code = code;
        supplier.name = `name[${code}]`;
        supplier.description = `description for ${code}`;
        supplier.phone = `phone for ${code}`;
        supplier.address = `address for ${code}`;

        return Promise.resolve(supplier);
    }

}
module.exports = new SupplierManagerDataUtil();
