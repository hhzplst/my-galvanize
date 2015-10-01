var ids = {
  facebook: {
   clientID: process.env.FACEBOOK_APP_ID,
   clientSecret: process.env.FACEBOOK_APP_SECRET,
   callbackURL: "https://my-galvanize-app.herokuapp.com/auth/facebook/callback"
  }
};

module.exports = ids;