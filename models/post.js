var mongoose = require("mongoose");
mongoose.set("debug", true);

var postSchema = mongoose.Schema({
  postTitle: {
    type: String,
    requried: true
  },
  postContent: {
    type: String,
    required: true
  },
  postPic: {
    type: String,
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

var Post = mongoose.model("Post", postSchema);

module.exports = Post;