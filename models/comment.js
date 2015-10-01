var mongoose = require("mongoose");
mongoose.set("debug", true);

var commentSchema = mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: String
});

var Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;