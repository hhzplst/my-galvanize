var mongoose = require("mongoose");
mongoose.connect(process.env.MONGOLAB_URI || "mongodb://localhost/reddit");
mongoose.set("debug", true);

module.exports.Post = require("./post");
module.exports.Comment = require("./comment");
module.exports.User = require("./user");