const express = require('express');
const app=express();
const { execFile } = require('child_process');
const deparam = require('jquery-deparam');
const { MongoClient, ObjectID } = require('mongodb');
const {MONGO_URL,SECRET}=require("./config");
const bodyParser = require('body-parser');
const session=require("express-session");
const ejs=require("ejs");
const sanitize=require("mongo-sanitize");
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(session({secret:SECRET,resave:false,saveUninitialized:false}))
app.use(express.static('static'));
app.set('views', './views');
app.set('view engine', 'ejs');
const client = new MongoClient(MONGO_URL,{useUnifiedTopology: true});

app.get("/",(req,res)=>{
	return res.render("index");
});

app.get("/logout",(req,res)=>{
	try{
	if (req.session.username && req.session.anime){
		req.session.destroy();
		res.redirect(302,"/");
	}
	else{
		res.redirect(302,"/");
	}
}
catch(err)
{
	console.log(err);
}})

app.get("/animes",(req,res)=>{
	if(req.session.username && req.session.anime){
		return res.render("animes");
	}
	else res.redirect(302,"/login");
});

app.get("/register",(req,res)=>{
	var sess=req.session;
	if(sess.username && sess.anime){
		res.redirect(302,"/home");
	}
	else{
		return res.render("register",{error:""});	
	}
});

app.post("/register",(req,res)=>{
	try{
	var username=sanitize(req.body.username);
	var password=sanitize(req.body.password);
	var anime=sanitize(req.body.anime);
	if(username && password && anime){
		client.connect(function (err){
			if (err) return res.render("register",{error:"An unknown error has occured"});
			const db=client.db("kimetsu");
			const collection=db.collection("users");
			collection.findOne({"username":username},(err,result)=>{
				if (err) {return res.render("register",{error:"An unknown error has occured"});console.log(err);}
				if (result) return res.render("register",{error:"This username already exists, Please use another one"});
				else{
					collection.insertOne({"username":username,"password":password,"anime":anime},(err,result)=>{
						if (err) {return res.render("register",{error:"An unknown error has occured"});console.log(err);}
						req.session.username=username;
						req.session.anime=anime;
						res.redirect(302,"/home");
						});
				}
		});
	});
}

	else return res.render("register",{error:"An unknown error has occured"});
}
catch(err){
	console.log(err);
}
});

app.get("/login",(req,res)=>{
	if(req.session.username && req.session.anime){
		res.redirect(302,"/home");
	}
	else{
		return res.render("login",{error:""});
	}
});
app.post("/login",(req,res)=>{
	try{
	var username=sanitize(req.body.username);
	var password=sanitize(req.body.password);
	if (username && password){
		client.connect(function(err){
			if (err) return res.render("login",{error:"An unknown error has occured"});
			const db=client.db("kimetsu");
			const collection=db.collection("users");
			collection.findOne({"username":username,"password":password},(err,result)=>{
				if (err) return res.render("login",{error:"An unknown error has occured"});
				if (result) {
					req.session.username=username;
					req.session.anime=result.anime;
					res.redirect(302,"/home");
				}
				else{
					return res.render("login",{error:"Your username or password is wrong"});
				}
	});
	});
	}
	else return res.render("login",{error:"An unknown error has occured"});
}
catch(err){
	console.log(err);
}
});

app.get("/home",(req,res)=>{
	if(req.session.username && req.session.anime){
		return res.render("home",{"username":req.session.username,"anime":req.session.anime});
	}
	else{
		res.redirect(302,"/login");
	}

});

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

app.get("/update",(req,res)=>{
	try{
	Object.seal && [ Object, Array, String, Number ].map( function( builtin ) { Object.seal( builtin.prototype ); } )
	if(req.session.username && req.session.anime){
					String.lucky=getRandomInt(100000);
					console.log(req.originalUrl.slice(8));
					var input=deparam(req.originalUrl.slice(8));
					console.log(input);
					if(input.luck==String.lucky){
						req.session.isAdmin=1;
						req.session.save();
						return res.render("update",{"username":req.session.username,"anime":req.session.anime,error:"Lucky People!"});	
					}		
			return res.render("update",{"username":req.session.username,"anime":req.session.anime,error:"Not too lucky"});
	}
	else res.redirect(302,"/login");
}	
catch(err){
	console.log(err);
	return res.redirect(302,"/home");

}
});

app.get("/admin",(req,res)=>{
	if(req.session.isAdmin === 1){
		return res.render("admin",{msg:""});
	}
	else res.redirect(302,"/home");
})
app.post("/admin",(req,res)=>{
	if(req.session.isAdmin){
		var envName=req.body.envname;
		var env=req.body.env;
		var path=req.body.path;
		if(env && envName && path){
			if(path.includes("app.js") || path.includes("-")) return res.render("admin",{msg:"Not allowed"});
			process.env[envName] = env;
 			const child = execFile('node', [path], (error, stdout, stderr) => {
    		 if (error) {
			console.log(error);
        		return res.render("admin",{msg:"An error has occured"});
     		}
     		return res.render("admin",{msg:stdout});
 });
		}
		else res.redirect(302,"/home");
	}
	else res.redirect(302,"/home");


})

app.listen(8000,"0.0.0.0");
console.log("Listening 8000 ....")
