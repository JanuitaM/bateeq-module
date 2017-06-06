var helper = require("../../helper");
var SqlHelper = require("../../sql-helper")
var Manager = require("../../../src/etl/dim-time");
var instanceManager = null;
var should = require("should");

before("#00. connect db", function(done) {
    var mongoDbConnection = helper.getDb();
    var sql = new SqlHelper();
    var sqlConnection = sql.startConnection();
    Promise.all([mongoDbConnection, sqlConnection])
        .then(result => {
            if(!result[0]){
                done("cannot connect to mongo")
            }
            if(!result[1]){
                done("cannot connect to sql")
            }
            db = result[0];
            instanceManager = new Manager(db, {
                username: "unit-test"
            }, sql);
            done();
        })
        .catch(e => {
            done(e);
        });
});

it("#01. should success when run etl for dim time", function(done) {
    instanceManager.run()
        .then(() => {
            done();
        })
        .catch((e) => {
            done(e);
        });
});
