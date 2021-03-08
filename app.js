//arguments
const register = false
const cookieParserName = "HelloWorldhaha"

//import files
const main = require('./main')

const cookieParser = require("cookie-parser")
const crypto = require("crypto") //to have session secret code
const express = require("express")//using http 
const app = express()
const fs = require("fs")//open file

const bodyParser = require("body-parser")//post parser (not using)
//const jsonParser = bodyParser.json()//json parser
const urlencodedParser = bodyParser.urlencoded({extended: false})//form parser  
const mysql = require("mysql")
const port = 17002 // this node.js is working on this port using nginx proxy to outside

//init


//every request will all pass here
//app.use(cookieParser(cookieParserName),(req,res)
var temp
app.use(cookieParser(cookieParserName),(req,res,next)=>{
	//print basic information
	console.log(Date())
	var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress
	console.log("IP from : %s",ip)
	var sessionid = req.signedCookies.id
	console.log("session ID is : %s",sessionid)

	//verify cookie validate
	var email
	var username
	if(sessionid === undefined){
		//if cookie is not validate
		console.log("session id not validate")
		return next()
	}
	//check cookie status
	temp = 'select * from session where id = "'+mysql.escape(sessionid)+'";'
	console.log(temp)
	conn.query(temp,(err,result,fields)=>{
		console.log(result)
		if(result.length == 0){
			//cookie session not correct
			res.clearCookie('id',{signed: true,httpOnly: true,overwrite: true})
			console.log("cookie deleted")
			//reload page
			return res.redirect('back')
			return next()
		}
		email = result[0].email
		var time = result[0].time
		if(Date.now() - time > 1800000){
			//session is expired
			res.clearCookie('id',{signed: true,httpOnly: true,overwrite: true})
			conn.query('delete from session where id = "'+mysql.escape(sessionid)+'";')
			console.log("cookie expired deleted")
			return res.redirect('back')
			return next()
		}else{
			//update session
			var timenow = Date.now()
			temp = 'update session set time = '+ timenow + ' where id = "'+mysql.escape(sessionid)+'";'
			conn.query(temp)
			res.cookie('id', sessionid, {signed: true,httpOnly: true,overwrite: true});
			console.log("session time update")
			return next()
		}
	})
})

const config = {
	//mysql configuration
	host: 'localhost',
	user: 'tnfsacec',
	password: 'YoudontknowandIdontknoweither',
	database: 'tnfsavoting',
	posrt: 3306,
	ssl: false
}
const conn = new mysql.createConnection(config)
conn.connect((err)=>{
	if(err) throw err;
	console.log("connection success!!")
})
conn.query("use tnfsavoting")
conn.query("delete from session")
app.get('/',(req,res)=>{
	//main page
	console.log("mainscreen")
	console.log()

	fs.readFile("static/main/index",(err,data)=>{
		if(err) throw err
		return res.send(data.toString())
	})
})

app.all('/adduser',urlencodedParser,(req,res)=>{
	var add = req.body.adduser;
	if(add){
		//add new user
		console.log("adduser recieved")
		console.log("add user")
		var email = req.body.email
		var passwd = req.body.pass
		var username = req.body.name
		if(register){
			var sql = 'insert into logininfo (email,username,password) values ("'+ mysql.escape(email) + '","' + mysql.escape(username) + '","' + mysql.escape(passwd) + '");'
			console.log(sql)
			conn.query(sql)
			return res.send("<script>alert('account created redirecting to login page');location.replace('https://voting.sivir.pw/login')</script>")
		}else{
			return res.send("<script>alert('function not enabled');location.replace('https://voting.sivir.pw/')</script>")
		}
	}else{
		//print add user page
		fs.readFile("static/adduser/index",(err,data)=>{
			if(err) throw err;
			console.log("printing adding user page")
			console.log()
			return res.send(data.toString())
		})
	}
})
app.all('/auth',urlencodedParser,(req,res)=>{
	//only verified session can get in
	/*var cookieid = req.signedCookies['id']
	if(cookieid === undefined){
		//if not logged in return to login page
		return res.send("<script>alert('only verified session can view');location.replace('http://voting.sivir.pw/login')</script>")
	}else{
		//verify the cookie validate
		console.log("Cookie id : %s is tring in",cookieid)
		//obtain mysql to check
		var querymail = "select * from session where id = '"+mysql.escape(cookieid)+"';"
		console.log(querymail)
		conn.query(querymail,(err,result,fields)=>{
			console.log(result)
			if(result[0].id===undefined){
				return res.send("<script>alert('Please relog in\\nsession is expired');location.replace('https://voting.sivir.pw/login')</script>")
			}else{
				//update session date
				var usermail = result[0].email
				var cookietime = result[0].time
				if(Date.now()- cookietime > 1800000){
					//cookie expired
					conn.query("delete from session where id="+cookieid+";",)
					return res.send("<script>alert('Please relog in\\nsession is expired');location.replace('https://voting.sivir.pw/login')</script>")
				}
				var sqlque = "update session set time="+Date.now()+" where email="+usermail+";"
				conn.query(sqlque)
				//update cookie living time
				res.cookie('id', sessionid, {signed: true, maxAge:1800000,httpOnly: true,overwrite: true});
				//list student id input form
			}
		})
	}*/
	
})

app.all('/login',urlencodedParser,(req,res)=>{
	//the login in app
	//with the parameter "auth" can lead to different page
	var sessionid = req.signedCookies.id
	if(!sessionid){
		//session not exsist
		//print login page
		console.log("printing login page")
		console.log()
		fs.readFile("static/login/index",(err,data)=>{
			if(err) throw err;
			return res.send(data.toString())
		})
	}else{
		//having session id but not triggered with auth parameter
		//if verified enter function page
		//directly print function page
		
		//print function page
		return res.send("Function Page")
	}
		//session exsist
	var auth = req.body.auth
	if(auth){
		console.log("entering auth section")
		//auth exsist verify
		var email = req.body.email
		var passwd = req.body.pass
		temp = 'select * from logininfo where email="'+mysql.escape(email)+'";'
		console.log(temp)
		conn.query(temp,(err,result,fields)=>{
			console.log(result)
			if(!result.length){
				//username not queried
				console.log("username not match")
				return res.send('<script>alert("INVALID username or password");location.replace("https://voting.sivir.pw/login")</script>')
			}else{
				//verify the password
				var sqlpassword = result[0].password
				if(sqlpassword == mysql.escape(passwd)){
					//password is match with the mysql database
					console.log("Correct")
					//deploy session id
					var sessionid = crypto.randomBytes(32).toString('base64')
					var timenow = Date.now()
					var sqlquery = 'insert into session (id,time,email) values ("'+mysql.escape(sessionid)+'",'+timenow+',"'+mysql.escape(email)+'");'
					conn.query(sqlquery)
					res.cookie('id', sessionid, {signed: true,httpOnly: true,overwrite: true})
					return res.redirect(302,"https://voting.sivir.pw/login")
					//reload page
					console.log("here")
					//return res.send('<script>location.replace("https://voting.sivir.pw/login")</script>')
				}else{
					//password is not match with mysql database
				}
			}
		})
	}
	
})
/*
app.get("/function",(req,res)=>{
	//check session id
	var sessionid = req.signedCookies.id
	//check sessionid validate
	if(!sessionid){
		//no session id
		return res.send("<script>alert('permission deny');location.replace('https://voting.sivir.pw/login')</script>")
	}else{
		//have session id
		var temp = 'select * from session where id = "'+mysql.escape(sessionid)+'";'
		conn.query(temp,(err,result,fields)=>{
			console.log(result)
			if(result.length == 0){
				//not valid
				//res.cookie('id', sessionid, {signed: true, maxAge:0,httpOnly: true,overwrite: true});
				console.log("Hello")
				//tobe continued
			}
		})
	}

})*/
/*conn.end((err)=>{
	if(err) throw err;
	console.log("connection ended")
})*/

app.listen(port,()=>{
	console.log("the voting system is running on %d port",port)

})
