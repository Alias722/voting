const express = require("express")
const app = express()
const fs = require("fs")

const bodyParser = require("body-parser")
const jsonParser = bodyParser.json()//json parser                                                                                                           
const urlencodedParser = bodyParser.urlencoded({extended: false})//form parser  
const port = 17002

app.get('/',(req,res)=>{
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
	console.log(Date())
	console.log("IP from : %d",ip)
	console.log("mainscreen")
	console.log()

	fs.readFile("/static/main/index.html",(err,data)=>{
		if(err) throw err
		res.send(data.toString())
	})
	

})
app.post('/auth',urlencodedParser,(req,res) => {
	if(!req.body) return res.sendStatus(404)        
	var tosend = "POST request here\nYour name is "+req.body.name+", and your age is "+req.body.age+".\n Is it correct?"
	console.log("Inside post auth")
	console.log(req.body.name)
	console.log(req.body.age)
	res.send(tosend.toString)
})

app.all('/login',urlencodedParser,(req,res)=>{
	if(!res){
		//send get request
		fs.readFile("/templates/login/index.html",(err,data)=>{
			if(err) throw err;
			res.send(data.toString())
		})
	}else{
		//send POST request

	}
})

app.listen(port,()=>{
	console.log("the voting system is running on %d port",port)

})
