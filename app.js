const express = require("express")
const bodyParser = require("body-parser")

const app = express()
const port = 17002


app.get("/",(req,res)=>{
	res.send("Testing")
})

app.listen(port,()=>{
	console.log("Opening voting system")
	console.log("Running on %d port",port)
})
