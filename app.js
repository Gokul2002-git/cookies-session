require('dotenv').config();
const express=require("express");
const mongoose = require("mongoose");
const bodyparser=require("body-parser");
const app=express();
const session=require("express-session");
const passport=require("passport");
const passportlocalmongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const res = require("express/lib/response");
var cookieParser = require('cookie-parser');
const findOrCreate=require("mongoose-findorcreate");

app.use(bodyparser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(cookieParser());


app.use(session({
    secret:"our little secret.",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://19csr044:Gokul2002@cluster0-shard-00-00.dowfo.mongodb.net:27017,cluster0-shard-00-01.dowfo.mongodb.net:27017,cluster0-shard-00-02.dowfo.mongodb.net:27017/session?ssl=true&replicaSet=atlas-108jkb-shard-0&authSource=admin&retryWrites=true&w=majority")
//mongoose.set("useCreateIndex",true);
const signupschema=new mongoose.Schema({
    mail:String,
    password:String,
    name:String,
    googleId:String,
    username:String
});
signupschema.plugin(passportlocalmongoose);
signupschema.plugin(findOrCreate);
const usersignup=mongoose.model("usersignup",signupschema);

passport.use(usersignup.createStrategy());
passport.serializeUser(usersignup.serializeUser());
passport.deserializeUser(usersignup.deserializeUser());
passport.serializeUser(function(usersignup,done){
    done(null,usersignup._id);
});
passport.deserializeUser(function(id,done){
    usersignup.findById(id,function(err,usersignup){
        done(err,usersignup);
    });
});

//google auth
passport.use(new GoogleStrategy({
    clientID:process.env.client_id,
    clientSecret:process.env.client_secret,
    callbackURL: "http://localhost:3000/auth/google/secret",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile,cb) {
      console.log(profile._json.email);
   
    usersignup.findOrCreate({ googleId: profile.id,username:profile._json.email }, function (err, user) {
      return cb(err, user);
      
    }); 
  }
));

app.get("/",function(req,res)
{
    res.render("login",{});

});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] })
  );

app.get('/auth/google/secret', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
  
    // Successful authentication, redirect home.
    console.log(req.user.username);
    res.cookie('mail',req.user.username);
    res.redirect('/secret');
  });

app.get('/secret',function(req,res)
{
    console.log(req.isAuthenticated());
    if(req.isAuthenticated()){
        res.render("secret",{});
          // Cookies that have not been signed
  console.log('Cookies: ', req.cookies);
  console.log('Cookies: ', req.cookies.mail);

    }else{
        // res.render("secret",{});
    res.redirect("/");
    }
});
app.post("/signup",function(req,res)
{
    usersignup.register({username:req.body.mailid,name:req.body.username},req.body.password,function(err,user)
    {
        if(err)
        {
            console.log(err);

        }else{
            // passport.authenticate("local")(req,res,function(){
            //     res.redirect("/secret");
            // });
            res.redirect("/");

        }

    });

});
app.get("/auth",passport.authenticate("local", { failureRedirect: "/secret", failureMessage: true }),
  function(req, res) {

    res.redirect('/secret');
  });

app.post("/login",function(req1,res1)
{
    const user=new usersignup({
        username:req1.body.mail,
        password:req1.body.password
    });
    req1.login(user,function(err)
    {
        if(err)
        {
            console.log(err);
        }else{
            //res1.cookie('mail',req1.body.mail);
          res1.redirect("/secret");
//            passport.authenticate('local', { failureRedirect: '/secret', failureMessage: true })(req1,res1,function() {      
//     res1.redirect('/secret');
//   });
}
});
});

app.get("/logout",function(req,res)
{
    req.logout();
    res.redirect("/");

});
app.listen(process.env.PORT || 3000,function()
{
    console.log("server started");

});
