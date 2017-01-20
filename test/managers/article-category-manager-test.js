var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.master.article;
var generateCode = require('../../src/utils/code-generator');
var manager;

function getData() {
    var ArticleCategory = require('bateeq-models').master.article.ArticleCategory;
    var articleCategory = new ArticleCategory();

    var code = generateCode('UnitTest');

    articleCategory.code = code;
    articleCategory.name = `name[${code}]`;
    articleCategory.description = `description for ${code}`;

    return articleCategory;
}

before('#00. connect db', function(done) {
    helper.getDb()
        .then(db => {
            var ArticleCategoryManager = require('../../src/managers/master/article/article-category-manager');
            manager = new ArticleCategoryManager(db, {
                username: 'unit-test'
            });
            done();
        })
        .catch(e => {
            done(e);
        })
});

var createdId;
it('#01. should success when create new data', function(done) {
    var data = getData();
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
    manager.getSingleByQuery({_id:createdId})
        .then(data => {
            validate.articleCategory(data);
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#03. should success when update created data`, function(done) {

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

it(`#04. should success when get updated data with id`, function(done) {
    manager.getSingleByQuery({_id:createdId})
        .then(data => {
            validate.articleCategory(data);
            data.code.should.equal(createdData.code);
            data.name.should.equal(createdData.name);
            data.description.should.equal(createdData.description);
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#05. should success when delete data`, function(done) { 
    manager.delete(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#06. should _deleted=true`, function(done) {
    manager.getSingleByQuery({_id:createdId})
        .then(data => {
            validate.articleCategory(data);
            data._deleted.should.be.Boolean();
            data._deleted.should.equal(true);
            done();
        })
        .catch(e => {
            done(e);
        })
});
it('#07. should error when create new data with same code', function(done) {
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

it('#08. should error with property code and name ', function(done) { 
    manager.create({})
        .then(id => { 
            done("Should not be able error with property code and name");
        })
        .catch(e => { 
           try
           {
               e.errors.should.have.property('code');
               e.errors.should.have.property('name');  
               done();
           }catch(ex)
           {
               done(ex);
           } 
        })
});