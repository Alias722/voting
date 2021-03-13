//arguments
const register = false
const cookieParserName = "HelloWorldhaha"

const websiteURL = "https://admin.sivir.pw/"

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
const port = 17005 // this node.js is working on this port using nginx proxy to outside

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
    //console.log(temp)
    conn.query(temp, (err, result) => {
        //console.log(result)
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
    //console.log()
	
    res.redirect(301,"login")
})

app.all('/adduser', urlencodedParser, (req, res) => {
    var add = req.body.adduser;
    if (add) {
        //add new user
        console.log("adduser recieved")
        //console.log("add user")
        var email = req.body.email
        var passwd = req.body.pass
        var username = req.body.name
        if (register) {
            var sql = 'insert into logininfo (email,username,password) values ("' + mysql.escape(email) + '","' + mysql.escape(username) + '","' + mysql.escape(passwd) + '");'
            //console.log(sql)
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
            //console.log()
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
            //console.log()
            fs.readFile("static/login/index", (err, data) => {
                if (err) throw err;
                return res.send(data.toString())
            })
        }else{
            //receive post login request
            console.log("entering login page")
            var email = req.body.email
            var passwd = req.body.pass
            temp = 'select * from logininfo where email="' + mysql.escape(email) + '";'
            //console.log(temp)
            conn.query(temp, (err, result) => {
                //console.log(result)
                if (!result.length) {
                    //username not queried
                    console.log("username not match")
                    return res.send('<script>alert("INVALID username or password");location.replace("' + websiteURL + 'login")</script>')
                } else {
                    //account exist , verify the password
                    var sqlpassword = result[0].password
			console.log(sqlpassword)
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
        const stu = req.body.stu
        if(!stu){
            //no student post request
            //print the page to insert student number
            fs.readFile("static/handwrite/stu/index.html", (err, data) => {
                if (err) throw err
                return res.send(data.toString())
            })
        }else{
            //receive stu post request
            const stuid = req.body.stuid
            temp = 'select * from student where id="'+stuid+'";'
            console.log(temp)
            conn.query(temp,(error,result)=>{
                //console.log(result)
                if(result.length === 0){
                    //not exist
                    res.send("Please insert valid student id")
                }else{
                    //found student in database
                    //get operator email
                    if(result[0].status === 1){
                        //ticket taken
                        tosend = "無效已經領取<br>於帳號："+result[0].modified+"<br>姓名："+result[0].name+"<br>班級座號："+result[0].class+result[0].number+"<br>學號："+result[0].id
                        return res.send(tosend)
                    }else{
                        temp = 'select * from session where id="' + mysql.escape(sessionid)+'";'
                        conn.query(temp,(error,result)=>{
                            //console.log(result)
                            var user = result[0].email
                            console.log(user)
                            sql = temp = 'update student set modified = ' + user + ',status = "1" where id = "' + stuid + '";'
                            console.log(sql)
                            conn.query(sql)
                        })
                        tosend = "資格符合 <br>姓名："+result[0].name+"<br>班級座號："+result[0].class+result[0].number+"<br>學號："+result[0].id
                        return res.send(tosend)
                    }
                }
            })
            //end else
        }
    }
    //res.sendStatus(200)
})

app.all('addpost',(req,res)=>{
    const sessionid = req.signedCookies.id

    if(!sessionid){
        //no session id
        res.redirect(301,'/login')
    }else{
	//showing page
	temp = "select * from post;"
	
	conn.query(temp,(err,result,fields)=>{
		var rows = "<h1>A place to add new post</h1>"
		// prepare what to print
		for results in result{
			//get things in results
			id = results.id
			time = results.time
			title = results.title
			subtitle = results.subtitle
			context = results.context
			//print things
			row = "id: "+id+"<br>time: "+time+"<br>title: "+title+"<br>subtitle: "+subtitle+"context: "+context+"<br>"
			//add edit button
			row += "<button href='/config/"+id+"'></button><br>"
			rows += row

		}
		//prepare add button
		// new row button
		rows += "<button href='/newpost'>Add new post</button>"
		res.status(200).send(rows)
	})
    }
	
})

app.listen(port, () => {
    console.log("the voting system is running on %d port", port)

})
