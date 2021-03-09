//arguments
const register = true
const cookieParserName = "HelloWorldhaha"

const websiteURL = "http://localhost/"

//import files

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
app.use(cookieParser(cookieParserName), (req, res, next) => {
    //print basic information
    console.log(Date())
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress
    console.log("IP from : %s", ip)
    sessionid = req.signedCookies.id;
    console.log("session ID is : %s", sessionid)

    //verify cookie validate
    var email
    if (sessionid === undefined) {
        //if cookie is not validate
        console.log("session id not validate")
        return next()
    }
    //check cookie status
    temp = 'select * from session where id = "' + mysql.escape(sessionid) + '";'
    console.log(temp)
    conn.query(temp, (err, result) => {
        console.log(result)
        if (result.length === 0) {
            //cookie session not correct
            res.cookie('id', sessionid, {maxAge: 0, signed: true, httpOnly: true, overwrite: true});
            console.log("cookie deleted")
            //reload page
            return res.redirect(301,websiteURL)
            //return next()
        }
        email = result[0].email
        var time = result[0].time
        if (Date.now() - time > 1800000) {
            //session is expired
            res.cookie('id', sessionid, {maxAge: 0, signed: true, httpOnly: true, overwrite: true});
            conn.query('delete from session where id = "' + mysql.escape(sessionid) + '";')
            console.log("cookie expired deleted")
            return res.redirect(301,websiteURL)
            //return next()
        } else {
            //update session
            var timenow = Date.now()
            temp = 'update session set time = ' + timenow + ' where id = "' + mysql.escape(sessionid) + '";'
            conn.query(temp)
            res.cookie('id', sessionid, {signed: true, httpOnly: true, overwrite: true});
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
    console.log()

    fs.readFile("static/main/index", (err, data) => {
        if (err) throw err
        return res.send(data.toString())
    })
})

app.all('/adduser', urlencodedParser, (req, res) => {
    var add = req.body.adduser;
    if (add) {
        //add new user
        console.log("adduser recieved")
        console.log("add user")
        var email = req.body.email
        var passwd = req.body.pass
        var username = req.body.name
        if (register) {
            var sql = 'insert into logininfo (email,username,password) values ("' + mysql.escape(email) + '","' + mysql.escape(username) + '","' + mysql.escape(passwd) + '");'
            console.log(sql)
            conn.query(sql)
            return res.send("<script>alert('account created redirecting to login page');location.replace('" + websiteURL + "login')</script>")
        } else {
            return res.send("<script>alert('function not enabled');location.replace('" + websiteURL + "')</script>")
        }
    } else {
        //print add user page
        fs.readFile("static/adduser/index", (err, data) => {
            if (err) throw err;
            console.log("printing adding user page")
            console.log()
            return res.send(data.toString())
        })
    }
})

app.all('/login', urlencodedParser, (req, res) => {
    //the login in app
    //with the parameter "auth" can lead to different page

    const sessionid = req.signedCookies.id;
    if(!sessionid){
        //session not exist
        var auth = req.body.auth
        if(!auth){
            //no auth print login page
            console.log("printing login page")
            console.log()
            fs.readFile("static/login/index", (err, data) => {
                if (err) throw err;
                return res.send(data.toString())
            })
        }else{
            //receive post login request
            console.log("entering log in page")
            var email = req.body.email
            var passwd = req.body.pass
            temp = 'select * from logininfo where email="' + mysql.escape(email) + '";'
            //console.log(temp)
            conn.query(temp, (err, result) => {
                console.log(result)
                if (!result.length) {
                    //username not queried
                    console.log("username not match")
                    flag = true
                    return res.send('<script>alert("INVALID username or password");location.replace("' + websiteURL + 'login")</script>')
                } else {
                    //account exist , verify the password
                    var sqlpassword = result[0].password
                    if (sqlpassword === mysql.escape(passwd)) {
                        //password is match with the mysql database
                        console.log("Correct")
                        //deploy session id
                        var sessionid = crypto.randomBytes(32).toString('base64')
                        var timenow = Date.now()
                        var sqlquery = 'insert into session (id,time,email) values ("' + mysql.escape(sessionid) + '",' + timenow + ',"' + mysql.escape(email) + '");'
                        console.log(sqlquery)
                        conn.query(sqlquery)
                        res.cookie('id', sessionid, {signed: true, httpOnly: true, overwrite: true})

                        //reload page
                        return res.redirect(302, websiteURL + "login")
                    } else {
                        //password is not match with mysql database
                        return res.redirect(302, websiteURL + "login")
                    }
                }
            })
        }
    }else{
        //logged in
        fs.readFile("static/handwrite/function/index.html", (err, data) => {
            if (err) throw err
            return res.send(data.toString())
        })
        //res.send("Function Page")
    }
})

app.all('/auth', urlencodedParser,(req,res)=>{
    const sessionid = req.signedCookies.id

    if(!sessionid){
        //no session id
        res.redirect(301,websiteURL+'login')
    }else{
        var stu = req.body.stu
        if(!stu){
            //no student post request
            //print the page to insert student number
            fs.readFile("static/handwrite/stu/index.html", (err, data) => {
                if (err) throw err
                return res.send(data.toString())
            })
        }else{
            //receive stu post request
            res.send("handling")
        }
    }
    //res.sendStatus(200)
})

app.listen(port, () => {
    console.log("the voting system is running on %d port", port)

})
