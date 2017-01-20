
var sql = require("mssql");

var config = {

    user: 'Adminbateeq',
    password: 'Standar123.',
    server: 'efrata.database.windows.net',
    database: 'efrata.pos',
    // database: 'testefrata',
    options: {
        encrypt: true
    },
    connectionTimeout: 300*60*1000,
    requestTimeout: 1000000

};

module.exports = {
    getConnect: function () {
        return new Promise((resolve, reject) => {
            sql.connect(config, function (err) {
                resolve(new sql.Request());
            })
        });
    }
}
