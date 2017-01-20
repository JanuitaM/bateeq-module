"use strict";
var _getSert = require("./getsert");
var generateCode = require("../../../src/utils/code-generator");

class StoreManagerDataUtil {
    getSert(input) {
        var ManagerType = require("../../../src/managers/master/store-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
    var Models = require("bateeq-models").master.Store;
    var store = new Models();

    var now = new Date();
    var code = generateCode();

    store.code = code;
    store.name = `name[${code}]`;
    store.description = `description for ${code}`; 
    store.address = `address for ${code}`; 
    store.phone = `phone ${code}`; 
    store.salesCapital = 5000; 
    store.storageId = null;

    return Promise.resolve(store);
    }

    // getTestData(){
    //     // Define properties.
    //     var data={
    //     code = '',
    //     name = '',
    //     description = '',
    //     address = '',
    //     phone = '',
    //     salesCapital = 5000,
    //     }
    //     return this.getSert(data);
    // }

    

}
module.exports = new StoreManagerDataUtil();
