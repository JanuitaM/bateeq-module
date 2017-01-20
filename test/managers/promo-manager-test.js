var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.sales;
var generateCode = require('../../src/utils/code-generator');
var manager;
var testData;

function getDataDiscountItem() {
    var item1 = testData.finishedGoods["UT-FG1"];
    var item2 = testData.finishedGoods["UT-FG2"];
    var stores = [];
    stores.push(testData.stores["ST-FNG"]);
    stores.push(testData.stores["ST-BJB"]);
    stores.push(testData.stores["ST-BJR"]);

    var Promo = require('bateeq-models').sales.Promo;
    var PromoCriteria = require('bateeq-models').sales.PromoCriteria;
    var PromoReward = require('bateeq-models').sales.PromoReward;
    var PromoCriteriaSelectedProduct = require('bateeq-models').sales.PromoCriteriaSelectedProduct;
    var PromoRewardDiscountProduct = require('bateeq-models').sales.PromoRewardDiscountProduct;
    
    var promo = new Promo();
    var code = generateCode('UnitTest');

    promo.code = code;
    promo.name = 'Discount Item';
    promo.description = `description for ${code}`; 
    promo.validFrom = new Date("2000-01-01T00:00:00"); 
    promo.validTo = new Date("2000-12-01T00:00:00"); 
    promo.stores = stores;
    promo.criteria = {};
    promo.reward = {};
     
    var promoCriteria = new PromoCriteria();
    promoCriteria.type = 'selected-product';
    promoCriteria.criterions = [];
    
    var promoCriteriaSelectedProduct = new PromoCriteriaSelectedProduct();
    promoCriteriaSelectedProduct.itemId = item1._id;
    promoCriteriaSelectedProduct.item = item1;
    promoCriteriaSelectedProduct.minimumQuantity = 0;
    promoCriteria.criterions.push(promoCriteriaSelectedProduct);
    
    var promoCriteriaSelectedProduct = new PromoCriteriaSelectedProduct();
    promoCriteriaSelectedProduct.itemId = item2._id;
    promoCriteriaSelectedProduct.item = item2;
    promoCriteriaSelectedProduct.minimumQuantity = 0;
    promoCriteria.criterions.push(promoCriteriaSelectedProduct);
    
    var promoReward = new PromoReward();
    promoReward.type = 'discount-product';
    promoReward.rewards = [];
    
    var promoRewardDiscountProduct = new PromoRewardDiscountProduct();
    promoRewardDiscountProduct.unit = 'percentage';
    promoRewardDiscountProduct.discount1 = 10;
    promoRewardDiscountProduct.discount2 = 5;
    promoRewardDiscountProduct.nominal = 0;
    promoReward.rewards.push(promoRewardDiscountProduct);

    promo.criteria = promoCriteria;
    promo.reward = promoReward;
    return promo;
}

function getDataPackageSpecialPrice() {
    var item1 = testData.finishedGoods["UT-FG1"];
    var item2 = testData.finishedGoods["UT-FG2"];
    var stores = [];
    stores.push(testData.stores["ST-FNG"]);
    stores.push(testData.stores["ST-BJB"]);
    stores.push(testData.stores["ST-BJR"]);

    var Promo = require('bateeq-models').sales.Promo;
    var PromoCriteria = require('bateeq-models').sales.PromoCriteria;
    var PromoReward = require('bateeq-models').sales.PromoReward;
    var PromoCriteriaPackage = require('bateeq-models').sales.PromoCriteriaPackage;
    var PromoRewardSpecialPrice = require('bateeq-models').sales.PromoRewardSpecialPrice;
    
    var promo = new Promo();
    var code = generateCode('UnitTest');

    promo.code = code;
    promo.name = 'Package Special Price';
    promo.description = `description for ${code}`; 
    promo.validFrom = new Date("2000-01-01T00:00:00"); 
    promo.validTo = new Date("2000-12-01T00:00:00"); 
    promo.stores = stores;
    promo.criteria = {};
    promo.reward = {};
     
    var promoCriteria = new PromoCriteria();
    promoCriteria.type = 'package';
    promoCriteria.criterions = [];
    
    var promoCriteriaPackage = new PromoCriteriaPackage();
    promoCriteriaPackage.itemId = item1._id;
    promoCriteriaPackage.item = item1;
    promoCriteria.criterions.push(promoCriteriaPackage);
    
    var promoCriteriaPackage = new PromoCriteriaPackage();
    promoCriteriaPackage.itemId = item2._id;
    promoCriteriaPackage.item = item2;
    promoCriteria.criterions.push(promoCriteriaPackage);
    
    var promoReward = new PromoReward();
    promoReward.type = 'special-price';
    promoReward.rewards = [];
    
    var promoRewardSpecialPrice = new PromoRewardSpecialPrice();
    promoRewardSpecialPrice.quantity1 = 100000;
    promoRewardSpecialPrice.quantity2 = 200000;
    promoRewardSpecialPrice.quantity3 = 300000;
    promoRewardSpecialPrice.quantity4 = 400000;
    promoRewardSpecialPrice.quantity5 = 500000;
    promoReward.rewards.push(promoRewardSpecialPrice);

    promo.criteria = promoCriteria;
    promo.reward = promoReward;
    return promo;
}

var createdId;
var createdData;
before('#00. connect db', function(done) {
    helper.getDb()
        .then(db => {
            var data = require("../data");
            data(db)
                .then(result => { 
                    var PromoManager = require('../../src/managers/sales/promo-manager');
                    manager = new PromoManager(db, {
                        username: 'unit-test'
                    });
                    testData = result; 
                    done();
                });
        })
        .catch(e => {
            done(e);
        });
});

it('#1.01. [Discount Item] should success when create new data', function(done) {
    var data = getDataDiscountItem();
    manager.create(data)
        .then(id => {
            id.should.be.Object();
            createdId = id;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#1.02. [Discount Item] should success when get created data with id`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.promo(data);
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#1.03. [Discount Item] should success when update created data`, function(done) {

    createdData.code += '[updated]';
    createdData.name += '[updated]';
    createdData.description += '[updated]'; 

    manager.update(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#1.04. [Discount Item] should success when get updated data with id`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.promo(data);
            data.code.should.equal(createdData.code);
            data.name.should.equal(createdData.name);
            data.description.should.equal(createdData.description); 
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#1.05. [Discount Item] should success when delete data`, function(done) {
    manager.delete(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#1.06. [Discount Item] should _deleted=true`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.promo(data);
            data._deleted.should.be.Boolean();
            data._deleted.should.equal(true);
            done();
        })
        .catch(e => {
            done(e);
        })
});

it('#1.07. [Discount Item] should error when create new data with same code', function(done) {
    var data = Object.assign({}, createdData);
    delete data._id;
    manager.create(data)
        .then(id => {
            id.should.be.Object();
            createdId = id;
            done("Should not be able to create data with same code");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('code');
                done();
            }
            catch (e) {
                done(e);
            }
        })
});

it('#1.08. [Discount Item] should error with property code, name, criteria.type, reward.type ', function(done) {
    manager.create({})
        .then(id => {
            done("Should not be error with property code, name, criteria.type, reward.type");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('code');
                e.errors.should.have.property('name');
                e.errors.should.have.property('stores');
                e.errors.criteria.should.have.property('type');
                e.errors.reward.should.have.property('type');
                //e.errors.should.have.property('validTo');
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});
 
it('#1.09. [Discount Item] should error with property validFrom and validTo not date ', function(done) {
    var data = getDataDiscountItem();
    data.validFrom = "2000-01-01";
    data.validTo = "2000-01-01";
    manager.create(data)
        .then(id => {
            done("Should not be error with property validFrom and validTo not date");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('validFrom');
                e.errors.should.have.property('validTo');
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#1.10. [Discount Item] should error with property validFrom greater than equal validTo ', function(done) {
    var data = getDataDiscountItem();
    data.validFrom = new Date("2000-01-01T00:00:00"); 
    data.validTo = new Date("2000-01-01T00:00:00");
    manager.create(data)
        .then(id => {
            done("Should not be error with property validFrom greater than equal validTo");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('validFrom');
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#1.11. [Discount Item] should error with property rewards and criterions is empty ', function(done) {
    var data = getDataDiscountItem();
    data.reward.rewards = [];
    data.criteria.criterions = [];
    manager.create(data)
        .then(id => {
            done("Should not be error with property rewards and criterions is empty");
        })
        .catch(e => {
            try {
                e.errors.reward.should.have.property('rewards');
                e.errors.criteria.should.have.property('criterions');
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#1.12. [Discount Item] should error with property rewards unit is empty ', function(done) {
    var data = getDataDiscountItem();
    for (var reward of data.reward.rewards) {
        reward.unit = '';
    }
    manager.create(data)
        .then(id => {
            done("Should not be error with property rewards unit is empty");
        })
        .catch(e => {
            try {
                for (var reward of e.errors.reward.rewards) {
                    reward.should.have.property('unit');
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#1.13. [Discount Item] should error with property rewards unit is not percentage or nominal ', function(done) {
    var data = getDataDiscountItem();
    for (var reward of data.reward.rewards) {
        reward.unit = reward.unit + '-';
    }
    manager.create(data)
        .then(id => {
            done("Should not be error with property rewards unit is not percentage or nominal");
        })
        .catch(e => {
            try {
                for (var reward of e.errors.reward.rewards) {
                    reward.should.have.property('unit');
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#1.14. [Discount Item] should error with property rewards discount1, discount2, nominal less than 0 ', function(done) {
    var data = getDataDiscountItem();
    for (var reward of data.reward.rewards) {
        reward.discount1 = -1;
        reward.discount2 = -1;
        reward.nominal = -1;
    }
    manager.create(data)
        .then(id => {
            done("Should not be error with property rewards discount1, discount2, nominal less than 0");
        })
        .catch(e => {
            try {
                for (var reward of e.errors.reward.rewards) {
                    reward.should.have.property('discount1');
                    reward.should.have.property('discount2');
                    reward.should.have.property('nominal');
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#1.15. [Discount Item] should error with property rewards discount1, discount2 greater than 100 ', function(done) {
    var data = getDataDiscountItem();
    for (var reward of data.reward.rewards) {
        reward.discount1 = 101;
        reward.discount2 = 101;
    }
    manager.create(data)
        .then(id => {
            done("Should not be error with property rewards discount1, discount2 greater than 100");
        })
        .catch(e => {
            try {
                for (var reward of e.errors.reward.rewards) {
                    reward.should.have.property('discount1');
                    reward.should.have.property('discount2');
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#1.16. [Discount Item] should error with property criterions itemId is empty ', function(done) {
    var data = getDataDiscountItem();
    for (var criterion of data.criteria.criterions) {
        criterion.itemId = '';
    }
    manager.create(data)
        .then(id => {
            done("Should not be error with property criterions itemId is empty");
        })
        .catch(e => {
            try {
                for (var criterion of e.errors.criteria.criterions) {
                    criterion.should.have.property('itemId');
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#1.17. [Discount Item] should error with property criterions itemId not found ', function(done) {
    var data = getDataDiscountItem();
    for (var criterion of data.criteria.criterions) {
        criterion.itemId = "000000000000000000000000";
        break;
    }
    manager.create(data)
        .then(id => {
            done("Should not be error with property criterions itemId not found");
        })
        .catch(e => {
            try {
                for (var criterion of e.errors.criteria.criterions) {
                    criterion.should.have.property('itemId');
                    break;
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#1.18. [Discount Item] should error with property criterions itemId must unique ', function(done) {
    var data = getDataDiscountItem();
    var item = testData.finishedGoods["UT-FG1"];
    for (var criterion of data.criteria.criterions) {
        criterion.itemId = item._id;
    }
    manager.create(data)
        .then(id => {
            done("Should not be error with property criterions itemId must unique ");
        })
        .catch(e => {
            try {
                for (var criterion of e.errors.criteria.criterions) {
                    criterion.should.have.property('itemId');
                    break;
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#1.19. [Discount Item] should error with property criterions minimumQuantity less than 0 ', function(done) {
    var data = getDataDiscountItem();
    for (var criterion of data.criteria.criterions) {
        criterion.minimumQuantity = -1;
    }
    manager.create(data)
        .then(id => {
            done("Should not be error with property criterions minimumQuantity less than 0");
        })
        .catch(e => {
            try {
                for (var criterion of e.errors.criteria.criterions) {
                    criterion.should.have.property('minimumQuantity');
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#2.01. [Package Special Price] should success when create new data', function(done) {
    var data = getDataPackageSpecialPrice();
    manager.create(data)
        .then(id => {
            id.should.be.Object();
            createdId = id;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#2.02. [Package Special Price] should success when get created data with id`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.promo(data);
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#2.03. [Package Special Price] should success when update created data`, function(done) {

    createdData.code += '[updated]';
    createdData.name += '[updated]';
    createdData.description += '[updated]'; 

    manager.update(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#2.04. [Package Special Price] should success when get updated data with id`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.promo(data);
            data.code.should.equal(createdData.code);
            data.name.should.equal(createdData.name);
            data.description.should.equal(createdData.description); 
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#2.05. [Package Special Price] should success when delete data`, function(done) {
    manager.delete(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#2.06. [Package Special Price] should _deleted=true`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.promo(data);
            data._deleted.should.be.Boolean();
            data._deleted.should.equal(true);
            done();
        })
        .catch(e => {
            done(e);
        })
});

it('#2.07. [Package Special Price] should error when create new data with same code', function(done) {
    var data = Object.assign({}, createdData);
    delete data._id;
    manager.create(data)
        .then(id => {
            id.should.be.Object();
            createdId = id;
            done("Should not be able to create data with same code");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('code');
                done();
            }
            catch (e) {
                done(e);
            }
        })
});

it('#2.08. [Package Special Price] should error with property code, name, criteria.type, reward.type ', function(done) {
    manager.create({})
        .then(id => {
            done("Should not be error with property code, name, criteria.type, reward.type");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('code');
                e.errors.should.have.property('name');
                e.errors.should.have.property('stores');
                e.errors.criteria.should.have.property('type');
                e.errors.reward.should.have.property('type');
                //e.errors.should.have.property('validTo');
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});
 
it('#2.09. [Package Special Price] should error with property validFrom and validTo not date ', function(done) {
    var data = getDataPackageSpecialPrice();
    data.validFrom = "2000-01-01";
    data.validTo = "2000-01-01";
    manager.create(data)
        .then(id => {
            done("Should not be error with property validFrom and validTo not date");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('validFrom');
                e.errors.should.have.property('validTo');
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#2.10. [Package Special Price] should error with property validFrom greater than equal validTo ', function(done) {
    var data = getDataPackageSpecialPrice();
    data.validFrom = new Date("2000-01-01T00:00:00"); 
    data.validTo = new Date("2000-01-01T00:00:00");
    manager.create(data)
        .then(id => {
            done("Should not be error with property validFrom greater than equal validTo");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('validFrom');
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#2.11. [Package Special Price] should error with property rewards and criterions is empty ', function(done) {
    var data = getDataPackageSpecialPrice();
    data.reward.rewards = [];
    data.criteria.criterions = [];
    manager.create(data)
        .then(id => {
            done("Should not be error with property rewards and criterions is empty");
        })
        .catch(e => {
            try {
                e.errors.reward.should.have.property('rewards');
                e.errors.criteria.should.have.property('criterions');
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#2.12. [Package Special Price] should error with property rewards quantity1, quantity2, quantity3, quantity4, quantity5 less than 0 ', function(done) {
    var data = getDataPackageSpecialPrice();
    for (var reward of data.reward.rewards) {
        reward.quantity1 = -1;
        reward.quantity2 = -1;
        reward.quantity3 = -1;
        reward.quantity4 = -1;
        reward.quantity5 = -1;
    }
    manager.create(data)
        .then(id => {
            done("Should not be error with property rewards quantity1, quantity2, quantity3, quantity4, quantity5 less than 0");
        })
        .catch(e => {
            try {
                for (var reward of e.errors.reward.rewards) {
                    reward.should.have.property('quantity1');
                    reward.should.have.property('quantity2');
                    reward.should.have.property('quantity3');
                    reward.should.have.property('quantity4');
                    reward.should.have.property('quantity5');
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#2.13. [Package Special Price] should error with property criterions itemId is empty ', function(done) {
    var data = getDataPackageSpecialPrice();
    for (var criterion of data.criteria.criterions) {
        criterion.itemId = '';
    }
    manager.create(data)
        .then(id => {
            done("Should not be error with property criterions itemId is empty");
        })
        .catch(e => {
            try {
                for (var criterion of e.errors.criteria.criterions) {
                    criterion.should.have.property('itemId');
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#2.14. [Package Special Price] should error with property criterions itemId not found ', function(done) {
    var data = getDataPackageSpecialPrice();
    for (var criterion of data.criteria.criterions) {
        criterion.itemId = "000000000000000000000000";
        break;
    }
    manager.create(data)
        .then(id => {
            done("Should not be error with property criterions itemId not found");
        })
        .catch(e => {
            try {
                for (var criterion of e.errors.criteria.criterions) {
                    criterion.should.have.property('itemId');
                    break;
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});

it('#2.15. [Package Special Price] should error with property criterions itemId must unique ', function(done) {
    var data = getDataPackageSpecialPrice();
    var item = testData.finishedGoods["UT-FG1"];
    for (var criterion of data.criteria.criterions) {
        criterion.itemId = item._id;
    }
    manager.create(data)
        .then(id => {
            done("Should not be error with property criterions itemId must unique ");
        })
        .catch(e => {
            try {
                for (var criterion of e.errors.criteria.criterions) {
                    criterion.should.have.property('itemId');
                    break;
                }
                done();
            }
            catch (ex) {
                done(ex);
            }
        });
});