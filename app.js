const express = require("express")//using http 
const app = express()
const fs = require("fs")//open file

const bodyParser = require("body-parser")//post parser (not using)
//const jsonParser = bodyParser.json()//json parser
const urlencodedParser = bodyParser.urlencoded({extended: false})//form parser  
const mysql = require("mysql")
const port = 17002 // this node.js is working on this port using nginx proxy to outside

const config = {
	//mysql configuration
	host: 'localhost',
	user: 'tnfsacec',
	password: 'YoudontknowandIdontknoweither',
	database: 'tnfsavoting',
	posrt: 3306,
	ssl: false
}
const conn = new mysql.createConnection(config);

conn.connect((err)=>{
	if(err) throw err;
	console.log("connection success!!")
})
/*conn.connect((err)=>{
	if(err) throw err;
	console.log("connection success!!")
})*/

/*conn.end((err)=>{
	if(err) throw err;
	console.log("connection ended")
})*/

app.get('/',(req,res)=>{
	//main page
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
	console.log(Date())
	console.log("IP from : %s",ip)
	console.log("mainscreen")
	console.log()

	fs.readFile("static/main/index",(err,data)=>{
		if(err) throw err
		res.send(data.toString())
	})
	

})
app.post('/auth',urlencodedParser,(req,res) => {
	//auth page I will use it authorize the student's validation
	
	/*if(!req.body) return res.sendStatus(404)        
	var tosend = "POST request here\nYour name is "+req.body.name+", and your age is "+req.body.age+".\n Is it correct?"
	console.log("Inside post auth")
	console.log(req.body.name)
	console.log(req.body.age)
	res.send(tosend.toString)*/
})
/*app.all('/adduser',urlencodedParser,(req,res)=>{
	var add = req.body.adduser;
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
	console.log("ip from %s",ip)
	if(add){
		//add new user
		console.log("adduser recieved")
		console.log("establishing mysql connection")
		console.log("add user")
		var email = req.body.email
		var passwd = req.body.pass
		var username = req.body.name
		var sql = 'insert into logininfo (email,username,password) values ("'+ mysql.escapeId(email) + '","' + mysql.escapeId(username) + '","' + mysql.escapeId(passwd) + '");'
		console.log(sql)
		conn.query("use tnfsavoting")
		conn.query(sql)
		res.send("<script>alert('account created redirecting to login page');location.replace('https:////voting.sivir.pw/login')</script>")
	}else{
		//print add user page
		fs.readFile("static/adduser/index",(err,data)=>{
			if(err) throw err;
			console.log("printing adding user page")
			console.log()
			res.send(data.toString())
		})
	}
})*/
app.all('/login',urlencodedParser,(req,res)=>{
	//the login in app
	//with the parameter "auth" can lead to different page
	var auth = req.body.auth
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
	console.log("Requested ip from ip:%s",ip)
	if(auth){
		//inside the true auth place
		var email = req.body.email
		var passwd = req.body.pass
		var sql = "select * from logininfo where email="+mysql.escapeId(email)+";"
		console.log(sql)
		conn.query(sql,(err,result,fields)=>{
			console.log(result);
		})	
		console.log("Email: %s. passwd: %s",email,passwd)
		console.log()
		res.sendStatus(200)
	}else{
		//send login website page
		console.log("printing login page")
		console.log()
		fs.readFile("static/login/index",(err,data)=>{
			if(err) throw err;
			res.send(data.toString())
		})
	}
})
/*conn.end((err)=>{
	if(err) throw err;
	console.log("connection ended")
})*/

app.listen(port,()=>{
	console.log("the voting system is running on %d port",port)

})
