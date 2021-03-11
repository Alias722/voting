//arguments
//import files
const express = require("express")//using http 
const app = express()
const fs = require("fs")//open file

const mysql = require("mysql")
const port = 17006 // this node.js is working on this port using nginx proxy to outside

//init

//every request will all pass here
//app.use(cookieParser(cookieParserName),(req,res)

function render(filename, params, callback) {
    fs.readFile(filename, 'utf8', function (err, data) {
        if (err) return callback(err);
        for (var key in params) {
            data = data.replace('{%' + key + '%}', params[key]);
        }
        callback(null, data); // 用 callback 傳回結果
    });
}

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

conn.connect((err) => {
    if (err) throw err;
    console.log("connection success!!")
})

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

app.get('/pages/:pagenum',(req,res)=>{
    postid = req.params.pagenum

    temp = 'select * from post where id = '+postid+';'
    conn.query(temp,(error,result,fields)=>{
        if(result.length === 0){
            return res.status(404).send("not found")
        }
        sqltitle = result[0].title
        sqlcontext = result[0].context

        render('static/main/elements.html',{
            title: sqltitle,
            context: sqlcontext
        },(err,data)=>{
            console.log("rendering files")
            return res.send(data)
        })

    })



})
app.get('*',(req,res)=>{
    res.status(404).send("Sooory,Page not found")
})


app.listen(port,()=>{
	console.log("voting web running on %d port",port)
})
