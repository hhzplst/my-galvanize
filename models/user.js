var mongoose = require("mongoose");
mongoose.set("debug", true);

var findOrCreate = require('mongoose-findorcreate');

var bcrypt = require("bcrypt");
var SALT_WORK_FACTOR = 10;

var userSchema = new mongoose.Schema({
  local: {
      userName: {
      type: String,
      lowercase: true
      // required: true
    },    
      password: {
      type: String,
      // required: true
    },
    email: {
      type: String,
      lowercase: true
      // required: true
    }
  },
  
  facebook: {
    displayName:{
      type: String
    },
    facebookId: {
      type: String
    },
    accessToken:{
      type: String
    }
  },
  
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
  }]
});

userSchema.plugin(findOrCreate);

userSchema.pre('save', function(next) {
  var user = this;
  if (!user.local.isModified('local.password')) {
    return next();
  }
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.local.password, salt, function(err, hash) {
      if (err) {
        return next(err);
      }
      user.local.password = hash;
      next();
    });
  });
});

userSchema.statics.authenticate = function (formData, callback) {
  this.findOne({"local.userName": 
    formData.local.userName
  },
  function (err, user) {
    if (user === null){
      callback("Invalid username or password",null);
    }
    else {
      user.checkPassword(formData.local.password, callback);
    }
  });
};

userSchema.methods.checkPassword = function(password, callback) {
  var user = this;
  bcrypt.compare(password, user.local.password, function (err, isMatch) {
    if (isMatch) {
      callback(null, user);
    } else {
      callback(err, null);
    }
  });
};

var User = mongoose.model("User", userSchema);

module.exports = User;
