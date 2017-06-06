
var sql = require("mssql");

var config = {

    user: 'Adminbateeq',
    password: 'Standar123.',
    server: 'efrata.database.windows.net',
    // database: 'efrata.pos',
    database: 'testefrata',
    options: {
        encrypt: true
    },
    connectionTimeout: 300 * 60 * 1000,
    requestTimeout: 60 * 60 * 1000

};

module.exports = class SqlConnection { 
    getConnect(){
        return new Promise((resolve, reject) => {
            sql.connect(config, function (err) {
                resolve(new sql.Request());
            })
        });
    }
    startConnection() {
        return new Promise((resolve, reject) => {
            sql.connect(config, function (err) {
                if(err)
                    reject(err);
                resolve(true);
            })
        });
    }
    
    transaction() {
        return new sql.Transaction();
    }
    
    transactionRequest(transaction) {
        return new sql.Request(transaction);
    }
}
