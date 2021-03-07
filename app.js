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

//every request will all pass here
//app.use(cookieParser(cookieParserName),(req,res)

app.use(cookieParser(cookieParserName),(req,res,next)=>{
	//print basic information
	console.log(Date())
	var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress
	console.log("IP from : %s",ip)

	//verify cookie validate
	var sessionid = req.signedCookies.id
	var email
	var username
	if(sessionid === undefined){
		//if cookie is not validate
		console.log("not logged in")
		return next()
	}
	//check cookie status
	var temp = 'select * from session where id = "'+mysql.escape(sessionid)+'";'
	conn.query(temp,(err,result,fields)=>{
		if(result.length == 0){
			//cookie session not exsist
			return next()
		}
		email = result[0].email
		var time = result[0].time
		if(Date.now() - time > 1800000){
			//session is expired
			conn.query('delete from session where id = "'+mysql.escape(sessionid)+'";')
			return next()
		}else{
			//update session
			var timenow = Date.now()
			temp = 'update session set time = '+ timenow + ' where id = "'+mysql.escape(sessionid)+'";'
			conn.query(temp)
			res.cookie('id', sessionid, {signed: true, maxAge:1800000,httpOnly: true,overwrite: true});
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

app.get("/rand",(req,res)=>{
	var rand = crypto.randomBytes(16).toString('base64')
	res.send(rand)
})


app.get('/',(req,res)=>{
	//main page
	console.log("mainscreen")
	console.log()

	fs.readFile("static/main/index",(err,data)=>{
		if(err) throw err
		res.send(data.toString())
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
			res.send("<script>alert('account created redirecting to login page');location.replace('https://voting.sivir.pw/login')</script>")
		}else{
			res.send("<script>alert('function not enabled');location.replace('https://voting.sivir.pw/')</script>")
		}
	}else{
		//print add user page
		fs.readFile("static/adduser/index",(err,data)=>{
			if(err) throw err;
			console.log("printing adding user page")
			console.log()
			res.send(data.toString())
		})
	}
})
app.all('/auth',urlencodedParser,(req,res)=>{
	//only verified session can get in
	var cookieid = req.signedCookies['id']
	if(cookieid === undefined){
		//if not logged in return to login page
		res.send("<script>alert('only verified session can view');location.replace('http://voting.sivir.pw/login')</script>")
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
	}
	
})

app.all('/login',urlencodedParser,(req,res)=>{
	//the login in app
	//with the parameter "auth" can lead to different page
	/*if(typeof(req.signedCookies.id)!==undefined){
		var querymail = "select * from session where id = "+req.signedCookies.id
		conn.query(querym)
		var qemail = req.signedCookies.id
		var sqlque = "update session set time="+Date.now()+" where email="+qemail
	}*/
	var sessionid = req.signedCookies.id
	console.log("session ID is : %s",sessionid)
	if(!sessionid){
		var auth = req.body.auth
		if(auth){
			//inside the true auth place
			var email = req.body.email
			var passwd = req.body.pass
			var sql = 'select * from logininfo where email="'+mysql.escape(email)+'";'
			conn.query(sql,(err,result,fields)=>{
				//var jsonresult = JSON.stringify(result)
				//var obj = JSON.parse(jsonresult)
				if(!result.length){
					console.log("username not match")
					return res.send("<script>alert('INVALIDE username or password');location.replace('https://voting.sivir.pw/login')</script>")
				}else{
					sqlpassword = result[0].password
					if(sqlpassword == mysql.escape(passwd)){
						console.log("correct")
						console.log()
				
						//establishing session
       	 				var sessionid = crypto.randomBytes(16).toString('base64')
						var timenow = Date.now()
						//put session id and date into mysql server
						var sqlquery = 'insert into session (id,time,email) values ("'+mysql.escape(sessionid)+'",'+timenow+',"'+mysql.escape(email)+'");'
						console.log(sqlquery)
						conn.query(sqlquery)
						//add cookie file in client
						res.cookie('id', sessionid, {signed: true, maxAge:1800000,httpOnly: true,overwrite: true});
						return res.sendStatus(200)
					}else{
						console.log("password not match")
						console.log()
						return res.send("<script>alert('INVALIDE username or password');location.replace('https://voting.sivir.pw/login')</script>")
					}
				}
	
			})
		}else{
			//send login website page
			console.log("printing login page")
			console.log()
			fs.readFile("static/login/index",(err,data)=>{
				if(err) throw err;
				return res.send(data.toString())
			})
		}
	}else{
		return res.send("<script>location.replace('https://voting.sivir.pw/function')</script>")
	}
})
app.get("/function",(req,res)=>{
	//check session id
	var sessionid = req.signedCookies.id
	//check sessionid validate
	var temp = 'select * from session where id = "'+mysql.escape(sessionid)+'";'
	conn.query(temp,(err,result,fields)=>{
		if(result.length == 0){
			//not valid
			res.cookie('id', sessionid, {signed: true, maxAge:0,httpOnly: true,overwrite: true});
			return res.send("<script>location.replace('https://voting.sivir.pw/login')</script>")
		}
	})	
	res.sendStatus(200)	
})
/*conn.end((err)=>{
	if(err) throw err;
	console.log("connection ended")
})*/

app.listen(port,()=>{
	console.log("the voting system is running on %d port",port)

})
