var mongoose = require("mongoose");

module.exports = function(){
    require('./Lake')(mongoose);
    return mongoose;
}