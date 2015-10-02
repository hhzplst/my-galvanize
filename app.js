require('dotenv').load();

var express = require("express"),
    app = express(),
    jade = require("jade"),
    session = require("cookie-session"),
    bcrypt = require("bcrypt"),
    morgan = require("morgan"),
    bodyParser = require("body-parser"),
    db = require("./models"),
    mandrill = require("node-mandrill")("oF-GQq-f1K3ZbfAVT7r5Gw"),
    passport = require("passport"),
    oauthConfig = require("./auth"),
    FacebookStrategy = require('passport-facebook').Strategy,
    flash = require('connect-flash');

var loginMiddleware = require("./middleware/loginHelper");
var routeMiddleware = require("./middleware/routeHelper");

var currentUserId, currentUser;

app.use(morgan("tiny"));
app.set("view engine", "jade");
app.use(express.static(__dirname + "/public/"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());
app.use(flash());

app.use(session({
  maxAge: 3600000,
  secret: process.env.SESSION_SECRET,
  name: process.env.SESSION_NAME
}));

passport.serializeUser(function(user, done) {
done(null, user);
});
passport.deserializeUser(function(obj, done) {
done(null, obj);
});

passport.use(new FacebookStrategy({
    clientID: oauthConfig.facebook.clientID,
    clientSecret: oauthConfig.facebook.clientSecret,
    callbackURL: oauthConfig.facebook.callbackURL,
    enableProof: false,
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done){
    currentUser = profile.displayName;
    db.User.findOrCreate({facebook: {facebookId: profile.id, displayName: currentUser}}, function (err, user) {
      req.session.id = user._id;
      currentUserId = user._id;
      return done(err, user);
    });
  }
));

app.use(loginMiddleware);

app.listen(process.env.PORT || 3000, function(){
    console.log("Server is Starting on Port 3000:");
});

app.get("/", function(req, res){
  res.redirect("/login");
});

app.get("/login", function(req, res){
  res.render("users/new", {pageTitle: "Welcome to My Galvanize"});
});

app.get("/auth/facebook",
  passport.authenticate("facebook", {scope: "email"}));

app.get("/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/", failureFlash: true }),
  function(req, res) {
    res.redirect("/posts");
  });

app.get("/posts", function(req, res){
  if(req.session.id){
    db.User.findById(req.session.id, function(err, user){
      currentUser = user.local.userName || user.facebook.displayName;
      res.locals.currentUser = currentUser;
      res.locals.currentUserId = req.session.id;
    });
  }
  db.Post.find({}).populate("author").populate("comments").exec(function(err, posts){
    res.render("posts/index", {pageTitle: "Home", posts: posts});    
  });
});

//SIGN UP or LOG IN FORM

app.post("/signup", function(req, res){
  db.User.create({local: req.body.user}, function(err, user){
      currentUser = user.local.userName;
      currentUserId = user.local._id;
      if(user){
        mandrill('/messages/send', {
            message: {
                to: [{email: ''+ user.local.email, name: ''+user.local.userName}],
                from_email:'ivycwq@gmail.com',
                from_name: "My Galvanize",
                subject: "Thanks for Signning Up!",
                text: "Sucess"
            }
        }, function(error, response)
        {
            //uh oh, there was an error
            if (error) console.log( JSON.stringify(error) );

            //everything's good, lets see what mandrill said
            else console.log(response);
        });
        //render the posts page with different header
        res.redirect("/login");
      }else{
        console.log(err);
      }
  });
});

app.post("/login",routeMiddleware.preventLoginSignup, function(req, res){
  db.User.authenticate({local: req.body.user},
  function (err, user) {
    if (!err && user !== null) {
      req.login(user);
      currentUser = user.local.userName;
      currentUserId = user._id;
      res.redirect("/posts");
    } else {
      res.render("users/new");
    }
  });
});

app.get("/posts/new", function(req, res){
  res.render("posts/new", {pageTitle: "New Post"});
});

app.post("/posts", function(req, res){
  if(currentUserId){
  req.body.post.author = currentUserId;
  db.Post.create(req.body.post, function(err, post){
    db.User.findOne({_id: currentUserId}, function(err, user){
      user.posts.push(post._id);
      user.save();
      res.redirect("/posts");
    });
  });
  }else{
    res.redirect("/users/new");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
  currentUser = null;
  currentUserId = null;
});

app.get("/database", function(req, res){
  if(req.query.comment !== null){
    var newComment = new db.Comment({content:req.query.comment});
    newComment.save(function(err,comment){
      comment.author = currentUser;
      comment.save(function(err,comment){
        db.Post.findById(req.query.postId, function(err, post){
          post.comments.push(comment.id);
          post.save(function(err,post){
            res.send(newComment);
          });
        });    
      });
    });    
  }
  if(req.query.userName){
    db.User.find({"local.userName": req.query.userName}, function(err, doc){
      if(doc.length === 0){
        res.json("new", {pageTitle: "New Record", result: 1});
      }else{
        res.json("new", {pageTitle: "New Record", result: 0});
      }
    });
  }
});







