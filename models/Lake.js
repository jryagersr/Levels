var mongoose = require("mongoose");
module.exports = function (connection) {
  // Save a reference to the Schema constructor
  var Schema = mongoose.Schema;

  // Using the Schema constructor, create a new UserSchema object
  // This is similar to a Sequelize model
  var LakeSchema = new Schema({
    // `title` is required and of type String
    name: {
      type: String,
      required: true
    },
    usgsID: {
      type: String
    },
    current: {
      level: Number,
      date: String,
      time: Number
    },
    data: [{
      date: String,
      time: Number,
      flow: Number,
      level: Number
    }
    ]
  });

  // This creates our model from the above schema, using mongoose's model method
  var Lake = connection.model("Lake", LakeSchema);
}
