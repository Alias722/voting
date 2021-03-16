//arguments
const register = false
const cookieParserName = "HelloWorldhaha"

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
const systemconfig = require('../config.json')
const port = systemconfig.loginport // this node.js is working on this port using nginx proxy to outside

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
            return res.redirect(302, '/')
            //return next()
        }
        email = result[0].email
        var time = result[0].time
        if (Date.now() - time > 1800000) {
            //session is expired
            res.cookie('id', sessionid, {maxAge: 0, signed: true, httpOnly: true, overwrite: true});
            conn.query('delete from session where id = "' + mysql.escape(sessionid) + '";')
            console.log("cookie expired deleted")
            return res.redirect(302, '/')
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

    res.redirect(302, "/login")
})

app.get('/logout',(req,res)=>{
    res.cookie('id', sessionid, {maxAge: 0, signed: true, httpOnly: true, overwrite: true})
    res.redirect(302,'/')
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
            return res.send("<script>alert('account created redirecting to login page');location.replace('/login')</script>")
        } else {
            return res.send("<script>alert('function not enabled');location.replace('/login')</script>")
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
    if (!sessionid) {
        //session not exist
        var auth = req.body.auth
        if (!auth) {
            //no auth print login page
            console.log("printing login page")
            //console.log()
            fs.readFile("static/login/index", (err, data) => {
                if (err) throw err;
                return res.send(data.toString())
            })
        } else {
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
                    return res.send('<script>alert("INVALID username or password");location.replace("/login")</script>')
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
                        return res.redirect(302, "/login")
                    } else {
                        //password is not match with mysql database
                        return res.redirect(302, "/login")
                    }
                }
            })
        }
    } else {
        //logged in
        fs.readFile("static/handwrite/function/index.html", (err, data) => {
            if (err) throw err
            return res.send(data.toString())
        })
        //res.send("Function Page")
    }
})

app.all('/auth', urlencodedParser, (req, res) => {
    const sessionid = req.signedCookies.id
    if (!sessionid) {
        //no session id
        res.redirect(302, 'login')
    } else {
        const stu = req.body.stu
        if (!stu) {
            //no student post request
            //print the page to insert student number
            fs.readFile("static/handwrite/stu/index.html", (err, data) => {
                if (err) throw err
                return res.send(data.toString())
            })
        } else {
            //receive stu post request
            const stuid = req.body.stuid
            temp = 'select * from student where id="' + stuid + '";'
            console.log(temp)
            conn.query(temp, (error, result) => {
                //console.log(result)
                if (result.length === 0) {
                    //not exist
                    res.send("Please insert valid student id")
                } else {
                    //found student in database
                    //get operator email
                    if (result[0].status === 1) {
                        //ticket taken
                        tosend = "無效已經領取<br>於帳號：" + result[0].modified + "<br>姓名：" + result[0].name + "<br>班級座號：" + result[0].class + result[0].number + "<br>學號：" + result[0].id
                        return res.send(tosend)
                    } else {
                        temp = 'select * from session where id="' + mysql.escape(sessionid) + '";'
                        conn.query(temp, (error, result) => {
                            //console.log(result)
                            var user = result[0].email
                            console.log(user)
                            sql = temp = 'update student set modified = ' + user + ',status = "1" where id = "' + stuid + '";'
                            console.log(sql)
                            conn.query(sql)
                        })
                        tosend = "資格符合 <br>姓名：" + result[0].name + "<br>班級座號：" + result[0].class + result[0].number + "<br>學號：" + result[0].id
                        return res.send(tosend)
                    }
                }
            })
            //end else
        }
    }
    //res.sendStatus(200)
})

app.get('/post', (req, res) => {
    const sessionid = req.signedCookies.id
    if (!sessionid) {
        //no session id
        console.log("no session id")
        res.redirect(302, '/login')
    } else {
        //showing page
        temp = "select * from post;"
        conn.query(temp, (err, results) => {
            var rows = "<h1>A place to add new post</h1>"
            rows += "<form action='/newpost'><input type='submit' value='新貼文'/></form>"
            // prepare what to print
            console.log(results)
            for (place in results) {
                //get things in results
                id = results[place].id
                time = results[place].time
                title = results[place].title
                subtitle = results[place].subtitle
                context = results[place].context
                //print things
                row = "id: " + id + "<br>time: " + time + "<br>title: " + title + "<br>subtitle: " + subtitle + "<br>context: " + context + "<br>"
                //add edit button
                row += "<form action='/config/" + id + "'><input type='submit' value='修改貼文'/></form>"
                rows += row
            }
            //prepare add button
            // new row button
            res.status(200).send(rows)
        })
    }
})

app.all('/newpost', urlencodedParser, (req, res) => {
    if (!sessionid) {
        //no session id
        res.redirect(302, 'login')
    } else {
        if (req.body.add) {
                temp = "insert into post (title,context,time,subtitle) values ('"+req.body.title+"','"+req.body.context+"','"+req.body.time+"','"+req.body.subtitle+"');"
                console.log(temp)
                conn.query(temp)
            return res.redirect(302,'post')
        } else {
            var data = fs.readFileSync("static/handwrite/addpost/index.html").toString()
            data = data.toString()

            var month = new Array();
            month[0] = "January";
            month[1] = "February";
            month[2] = "March";
            month[3] = "April";
            month[4] = "May";
            month[5] = "June";
            month[6] = "July";
            month[7] = "August";
            month[8] = "September";
            month[9] = "October";
            month[10] = "November";
            month[11] = "December";
            var d = new Date();
            systemtimenow = month[d.getMonth()]+ " "+d.getDate()+", " + d.getFullYear()

            params={timenow: systemtimenow}
            for (var key in params) {
                data = data.replace('{%' + key + '%}', params[key]);
            }
            return res.send(data)
            /*fs.readFile("static/handwrite/addpost/index.html", (err, data) => {
                if (err) throw err
                systemtimenow = "timenow"
                params={timenow: systemtimenow}
                for (var key in params) {
                    data = data.replace('{%' + key + '%}', params[key]);
                }
                return res.send(data.toString())
            })*/
        }

    }
})

app.all('/config', urlencodedParser, (req, res) => {
    const sessionid = req.signedCookies.id
    if(sessionid){
        console.log(req.body.modify)
        if(req.body.modify){
            //recieve modify command
            console.log()
            console.log("Maybe it is corrupted")
            temp = "update post set time='"+req.body.time+"',context='"+req.body.context+"',title='"+req.body.title+"',subtitle='"+req.body.subtitle+"' where id="+req.body.id+";"
            console.log(temp)
            conn.query(temp)
            res.redirect(302,"/post")
        }else{
            res.redirect(302,"/post")
        }
    }
})

app.all('/config/:postid', (req, res) => {
    const sessionid = req.signedCookies.id
    console.log("Entering config page")
    if (!sessionid) {
        //no session id
        console.log("redirect to login page owing to no valid sessionid")
        res.redirect(302, 'login')
    } else {
        console.log("TIME to config the wrong page")
        var modify = req.query.modify
        if (modify) {
            //haha
            // it is impossible to get here
            // If it does, it means someone is playing with it
        } else {
            //no modify command
            //return modify page
            temp = "select * from post where id=" + req.params.postid + ";"
            console.log(temp)
            conn.query(temp, (err, results) => {
                console.log(results)
                var data = fs.readFileSync("static/handwrite/modifypost/index.html").toString()
                if (results === undefined) {
                    return res.send("page not exist")
                } else {
                    var params = {
                        title: results[0].title,
                        subtitle: results[0].subtitle,
                        time: results[0].time,
                        context: results[0].context,
                        id: results[0].id
                    }
                    for (var key in params) {
                        data = data.replace('{%' + key + '%}', params[key]);
                    }
                    return res.send(data.toString())
                }
            })
        }

    }
})

app.all('*', (req, res) => {
    res.status(404).send("Page not found")
})

app.listen(port, () => {
    console.log("the voting system is running on %d port", port)

})
