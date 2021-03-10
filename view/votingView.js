//arguments
const register = false

const websiteURL = "https://tnfsacec.sivir.pw/"

//import files
const express = require("express")//using http 
const app = express()
const fs = require("fs")//open file

const mysql = require("mysql")
const port = 17006 // this node.js is working on this port using nginx proxy to outside

//init

//every request will all pass here
//app.use(cookieParser(cookieParserName),(req,res)

const config = {
    //mysql configuration
    host: 'localhost',
    user: 'tnfsacec',
    password: 'YoudontknowandIdontknoweither',
    database: 'tnfsavoting',
    port: 3306,
    ssl: false
}
const conn = new mysql.createConnection(config)

/*conn.connect((err) => {
    if (err) throw err;
    console.log("connection success!!")
})*/

conn.query("delete from session")
app.get('/', (req, res) => {
    //main page
    console.log("mainscreen")
    //console.log()

    fs.readFile("static/main/index", (err, data) => {
        if (err) throw err
        return res.send(data.toString())
    })
})

app.listen(port,()=>{
	console.log("voting web running on %d port",port)
})
