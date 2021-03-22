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
            res.cookie('info', "建立使用者成功，請登入", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
            res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
            res.redirect(302,"/redirect")
        } else {
            res.cookie('info', "新增使用者功能未啟用", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
            res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
            res.redirect(302,"/redirect")
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
            var email = req.body.email
            var passwd = req.body.pass
            temp = 'select * from logininfo where email="' + mysql.escape(email) + '";'
            //console.log(temp)
            conn.query(temp, (err, result) => {
                //console.log(result)
                if (!result.length) {
                    //username not queried
                    res.cookie('info', "使用者名稱或密碼錯誤", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                    res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                    res.redirect(302,"/redirect")
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

                        //login success and reload page
                        return res.redirect(302, "/login")
                    } else {
                        //password is not match with mysql database
                        res.cookie('info', "使用者名稱或密碼錯誤", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                        res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                        res.redirect(302,"/redirect")
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
    }
})

app.all('/auth', urlencodedParser, (req, res) => {
    const sessionid = req.signedCookies.id
    if (!sessionid) {
        //no session id
        res.cookie('info', "請依循正常管道登入", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.redirect(302,"/redirect")
    } else {
        finduser = 'select * from session where id="'+mysql.escape(sessionid)+'";'
        conn.query(finduser, (err, session) => {
            useremail = session[0].email
            sqlpermission = 'select * from logininfo where email="'+useremail+'";'
            conn.query(sqlpermission, (err, permission) => {
                if(permission[0].auth){
                    //permission access
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
                                res.send("請輸入正確學生證號："+stuid)
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
                }else{
                    //permission deny
                    res.cookie('info', "使用者權限不足", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                    res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                    res.redirect(302,"/redirect")
                }
            })
        })

    }
    //res.sendStatus(200)
})

app.get('/post', (req, res) => {
    const sessionid = req.signedCookies.id
    if (!sessionid) {
        //no session id
        res.cookie('info', "請依循正常管道登入", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.redirect(302,"/redirect")
    } else {
        //showing page
        finduser = 'select * from session where id="'+mysql.escape(sessionid)+'";'
        conn.query(finduser, (err, session) => {
            useremail = session[0].email
            sqlpermission = 'select * from logininfo where email="'+useremail+'";'
            conn.query(sqlpermission, (err, permission) => {
                if(permission[0].configpost){
                    // permitted
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
                }else{
                    //permission deny
                    res.cookie('info', "使用者權限不足", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                    res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                    res.redirect(302,"/redirect")
                }
            })
        })

    }
})

app.all('/newpost', urlencodedParser, (req, res) => {
    if (!sessionid) {
        //no session id
        res.cookie('info', "請依循正常管道登入", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.redirect(302,"/redirect")
    } else {
        finduser = 'select * from session where id="'+mysql.escape(sessionid)+'";'
        conn.query(finduser, (err, session) => {
            useremail = session[0].email
            sqlpermission = 'select * from logininfo where email="' + useremail + '";'
            conn.query(sqlpermission, (err, permission) => {
                if (permission[0].configpost) {
                    if (req.body.add) {
                        reqcontext = req.body.context
                        var toReplace = "\r\n"
                        var toBeReplace = new RegExp(toReplace,"g")
                        reqcontext = reqcontext.replace(toBeReplace, "<br>");
                        var toReplace = "\n"
                        var toBeReplace = new RegExp(toReplace,"g")
                        reqcontext = reqcontext.replace(toBeReplace, "<br>");
                        temp = "insert into post (title,context,time,subtitle) values ('"+req.body.title+"','"+reqcontext+"','"+req.body.time+"','"+req.body.subtitle+"');"
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
                    }
                }else{
                    //permission denied
                    res.cookie('info', "使用者權限不足", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                    res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                    res.redirect(302,"/redirect")
                }
            })
        })


    }
})

app.all('/config', urlencodedParser, (req, res) => {
    const sessionid = req.signedCookies.id
    if(sessionid){
        finduser = 'select * from session where id="'+mysql.escape(sessionid)+'";'
        conn.query(finduser, (err, session) => {
            useremail = session[0].email
            sqlpermission = 'select * from logininfo where email="' + useremail + '";'
            conn.query(sqlpermission, (err, permission) => {
                if (permission[0].configpost) {
                    console.log(req.body.modify)
                    if(req.body.modify){
                        //recieve modify command
                        reqcontext = req.body.context
                        var toReplace = "\r\n"
                        var toBeReplace = new RegExp(toReplace,"g")
                        reqcontext = reqcontext.replace(toBeReplace, "<br>");
                        var toReplace = "\n"
                        var toBeReplace = new RegExp(toReplace,"g")
                        reqcontext = reqcontext.replace(toBeReplace, "<br>");

                        temp = "update post set time='"+req.body.time+"',context='"+reqcontext+"',title='"+req.body.title+"',subtitle='"+req.body.subtitle+"' where id="+mysql.escape(req.body.id)+";"
                        console.log(temp)
                        conn.query(temp)
                        res.redirect(302,"/post")
                    }else{
                        res.redirect(302,"/post")
                    }
                } else {
                    //permission denied
                    res.cookie('info', "使用者權限不足", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                    res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                    res.redirect(302,"/redirect")
                }
            })
        })

    }else{
        //no session id detected
        res.cookie('info', "請依循正當管道登入", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.redirect(302,"/redirect")
    }
})

app.all('/config/:postid', (req, res) => {
    const sessionid = req.signedCookies.id
    console.log("Entering config page")
    if (!sessionid) {
        //no session id
        res.cookie('info', "請依循正當管道登入", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.cookie('location', "/login", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.redirect(302,"/redirect")
    } else {
        finduser = 'select * from session where id="'+mysql.escape(sessionid)+'";'
        conn.query(finduser, (err, session) => {
            useremail = session[0].email
            sqlpermission = 'select * from logininfo where email="' + useremail + '";'
            conn.query(sqlpermission, (err, permission) => {
                if (permission[0].configpost) {
                    var modify = req.query.modify
                    if (modify) {
                        res.cookie('info', "請依循正確管道登入", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                        res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                        res.redirect(302,"/redirect")
                    } else {
                        //no modify command
                        //return modify page
                        temp = "select * from post where id=" + mysql.escape(req.params.postid) + ";"
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
                } else {
                    //permission denied
                    res.cookie('info', "使用者權限不足", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                    res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
                    res.redirect(302,"/redirect")
                }
            })
        })
    }
})

app.get('/redirect',(req,res)=>{
    location = req.signedCookies.location
    info = req.signedCookies.info
    params = {location: location,info: info}
    var data = fs.readFileSync("static/redirect.html").toString()
    for(var key in params){
        data = data.replace('{%'+key+'%}',params[key])
    }
    res.send(data)
})

app.all('*', (req, res) => {
    res.status(404).send("Page not found")
})

app.listen(port, () => {
    console.log("the voting system is running on %d port", port)

})
