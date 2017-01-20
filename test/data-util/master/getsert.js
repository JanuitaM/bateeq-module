var helper = require("../../helper");
var user = {
    username: "dev"
};


module.exports = function(data, Manager, filterCallback) {
    var manager;
    return helper.getDb()
        .then((db) => {
            manager = new Manager(db, user);
            return manager.getSingleByQueryOrDefault(filterCallback(data));
        })
        .then((doc) => {
            if (doc) {
                return Promise.resolve(doc);
            }
            else {
                return manager.create(data)
                    .then((id) => manager.getSingleById(id));
            }
        }); 
}; 