var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.core;
var generateCode = require('../../src/utils/code-generator');
var manager;

function getData() {
    var Account = require('bateeq-models').core.Account;
    var account = new Account();
 
    var code = generateCode('UnitTest');

    account.username = `dev@unit-test.com`;
    account.password ='Standar123';// `${code}`;
    return account;
}

before('#00. connect db', function(done) {
    helper.getDb()
        .then(db => {
            var AccountManager = require('../../src/managers/core/account-manager');
            manager = new AccountManager(db, {
                username: 'unit-test'
            });
            done();
        })
        .catch(e => {
            done(e);
        })
});

var data = getData();
var createdId;
it('#01. should success when create new data', function(done) {
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

var createdData;
it(`#02. should success when get created data with id`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.account(data);
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#03. should success when update created data`, function(done) {

    manager.update(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#04. should success when get updated data with id`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.account(data);
            data.username.should.equal(createdData.username);
            // data.password.should.equal(createdData.password); 
            done();
        })
        .catch(e => {
            done(e);
        });
});

it('#05. get account using username and password', function(done) {
    manager.getByUsernameAndPassword(data.username, data.password)
        .then(account => {
            validate.account(account);
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#06. should success when delete data`, function(done) {
    manager.delete(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#07. should _deleted=true`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.account(data);
            data._deleted.should.be.Boolean();
            data._deleted.should.equal(true);
            done();
        })
        .catch(e => {
            done(e);
        })
});

it('#08. should error when create new data with same username', function(done) {
    var data = Object.assign({}, createdData);
    delete data._id;
    manager.create(data)
        .then(id => {
            id.should.be.Object();
            createdId = id;
            done("Should not be able to create data with same username");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('username');
                done();
            }
            catch (e) {
                done(e);
            }
        })
});

it('#09. should error with property username and password ', function(done) {
    manager.create({})
        .then(id => {
            done("Should not be error with property username and password");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('username');
                e.errors.should.have.property('password');
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});
