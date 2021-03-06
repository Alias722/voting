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

conn.end((err)=>{
	if(err) throw err;
	console.log("connection ended")
})

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

app.all('/login',urlencodedParser,(req,res)=>{
	//the login in app
	//with the parameter "auth" can lead to different page
	var auth = req.body.auth
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
	if(auth){
		//inside the true auth place
		var email = req.body.email
		var passwd = req.body.pass
		
		console.log("Logged in from ip:%s",ip)
		console.log("Email: %s. passwd: %s",email,passwd)
		console.log()
		res.sendStatus(200)
	}else{
		//send login website page
		console.log("printing login page")
		console.log("requested from ip: %s",ip)
		console.log()
		fs.readFile("static/login/index",(err,data)=>{
			if(err) throw err;
			res.send(data.toString())
		})
	}
})

app.listen(port,()=>{
	console.log("the voting system is running on %d port",port)

})
