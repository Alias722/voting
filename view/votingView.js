//arguments
//import files
const cookieParserName = "HelloWorldhaha"
const express = require("express")//using http 
const app = express()
const fs = require("fs")//open file

const cookieParser = require("cookie-parser")
const mysql = require("mysql")
const systemconfig = require('../config.json')
const port = systemconfig.viewport // this node.js is working on this port using nginx proxy to outside

//every request will all pass here
//app.use(cookieParser(cookieParserName),(req,res)

//init
const studentpolicy = systemconfig.studentpolicy;
const pexp = systemconfig.pexp;
const pmo = systemconfig.pmo;
const vpexp = systemconfig.vpexp;
const vpmo = systemconfig.vpmo;
const parliamentarypolicy = systemconfig.parliamentarypolicy;
const parliamentarymotivation = systemconfig.parliamentarymotivation;
const parliamentaryexperience = systemconfig.parliamentaryexperience;

for(var e in systemconfig.president){
    var toBeReplace = new RegExp("\n","g")
    studentpolicy[e] = studentpolicy[e].replace(toBeReplace, "<br>");
    pmo[e] = pmo[e].replace(toBeReplace, "<br>");
    vpmo[e] = vpmo[e].replace(toBeReplace, "<br>");
    pexp[e] = pexp[e].replace(toBeReplace, "<br>");
    vpexp[e] = vpexp[e].replace(toBeReplace, "<br>");
}

for(var e in systemconfig.parliamentary){
    var toBeReplace = new RegExp("\n","g")
    parliamentaryexperience[e] = parliamentaryexperience[e].replace(toBeReplace, "<br>");
    parliamentarymotivation[e] = parliamentarymotivation[e].replace(toBeReplace, "<br>");
    parliamentarypolicy[e] = parliamentarypolicy[e].replace(toBeReplace, "<br>");
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
    //redirect to /main/1
    return res.redirect(301,'/main/1')
})

app.get('/main/:pageid',(req,res)=>{
	//entering main page render section
	const pageid = parseInt(req.params.pageid,10)
    if(pageid < 1){
		return res.redirect(301,'/main/1')
	}
	count = "select count(*) as cnt from post"

	conn.query(count,(err,postcount)=>{
        var begin = postcount[0].cnt-5*pageid+1//req.params.pageid*5-4
        var end = postcount[0].cnt-5*pageid+5//(req.params.pageid*5)
        temp = "select * from post where id between "+begin+" AND "+end+";"
        conn.query(temp,(err,results)=>{
            var data = fs.readFileSync("static/main/mainpage/renderheader.html").toString()
            var body = fs.readFileSync("static/main/mainpage/renderbody.html").toString()

            for(var place = 4;place >= 0;--place){
                if(results[place] === undefined){
                    continue;
                }else{
                    var tmp = body
                    params = {title: results[place].title,subtitle: results[place].subtitle,time: results[place].time,id: results[place].id}
                    for(var key in params){
                        tmp = tmp.replace('{%'+key+'%}',params[key])
                    }
                    data += tmp
                }
            }
            pages = fs.readFileSync("static/main/pages.html").toString()
            pageparams={a: pageid-3,b: pageid-2,c: pageid-1,d: pageid,e: pageid+1,f: pageid+2,g: pageid+3}
            for(var key in pageparams){
                var toReplace = "{%"+key+"%}"
                var toBeReplace = new RegExp(toReplace,"g")
                pages = pages.replace(toBeReplace,pageparams[key])
            }
            data += pages
            data += fs.readFileSync("static/main/footer.html").toString()
            return res.send(data)
        })
    })
})

app.get('/pages/:pagenum',(req,res)=>{
    postid = parseInt(req.params.pagenum,10)
    temp = 'select * from post where id = '+postid+';'

    conn.query(temp,(error,result)=>{
        if(result.length === 0){
            return res.status(404).send("not found")
        }
        var data = fs.readFileSync('static/main/elements.html').toString()
        params = {title: result[0].title,context: result[0].context}

        for(var key in params){
            data = data.replace('{%'+key+'%}',params[key])
        }

        data += fs.readFileSync('static/main/footer.html').toString()

        return res.send(data)
    })
})

app.get('/opening',cookieParser(cookieParserName),(req,res)=>{
    if(systemconfig.open){
        var body = fs.readFileSync("static/main/open.html").toString()
        body += fs.readFileSync('static/main/footer.html').toString()
        res.status(200).send(body)
    }else{
        res.cookie('info', "尚未開票，功能未開放", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.redirect(302,"/redirect")
    }
})

app.get('/policy',cookieParser(cookieParserName),(req,res)=>{
    if(systemconfig.policy){
        var body = fs.readFileSync("static/main/policy.html").toString()
        body +="<header class=\"major\"><h1>正副會長候選人政見</h1></header>"
        for(var key in systemconfig.president){
            var priority = parseInt(key) + 1
            body += "<h2>"+priority+"號候選團隊<br>"+systemconfig.president[key]+"、"+systemconfig.vp[key]+"</h2>"
            body += "<blockquote>"+studentpolicy[key]+"</blockquote>"
        }
        body += "<hr />"
        body +="<header class=\"major\"><h1>學生議員 (全校選區)政見</h1></header>"
        for(var key in systemconfig.parliamentary){
            var priority = parseInt(key) + 1
            body += "<h2>"+priority+"號候選人<br>"+systemconfig.parliamentary[key]+"</h2>"
            body += "<blockquote>"+systemconfig.parliamentarypolicy[key]+"</blockquote>"
        }
        body += "</section></div>"
        body += fs.readFileSync('static/main/footer.html').toString()
        res.status(200).send(body)
    }else{
        res.cookie('info', "候選人政見尚未確定", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.redirect(302,"/redirect")
    }
})

app.get('/motivation',cookieParser(cookieParserName),(req,res)=>{
    if(systemconfig.policy){
        var body = fs.readFileSync("static/main/motivation.html").toString()
        body +="<header class=\"major\"><h1>正副會長候選人參選動機</h1></header>"
        for(var key in systemconfig.president){
            var priority = parseInt(key) + 1
            body += "<h2>"+priority+"號候選團隊<br>"
            body += systemconfig.president[key]+"</h2>"
            body += "<blockquote>"+pmo[key]+"</blockquote>"
            body += "<h2>"+systemconfig.vp[key]+"</h2>"
            body += "<blockquote>"+vpmo[key]+"</blockquote>"
            body += "<hr />"
        }
        body +="<header class=\"major\"><h1>學生議員 (全校選區)參選動機</h1></header>"
        for(var key in systemconfig.parliamentary){
            var priority = parseInt(key) + 1
            body += "<h2>"+priority+"號候選人<br>"+systemconfig.parliamentary[key]+"</h2>"
            body += "<blockquote>"+parliamentarymotivation[key]+"</blockquote>"
        }
        body += "</section></div>"
        body += fs.readFileSync('static/main/footer.html').toString()
        res.status(200).send(body)
    }else{
        res.cookie('info', "候選人政見尚未確定", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.redirect(302,"/redirect")
    }
})

app.get('/experience',cookieParser(cookieParserName),(req,res)=>{
    if(systemconfig.policy){
        var body = fs.readFileSync("static/main/experience.html").toString()
        body +="<header class=\"major\"><h1>正副會長候選人經歷</h1></header>"
        for(var key in systemconfig.president){
            var priority = parseInt(key) + 1
            body += "<h2>"+priority+"號候選團隊<br>"
            body += systemconfig.president[key]+"</h2>"
            body += "<blockquote>"+pexp[key]+"</blockquote>"
            body += "<h2>"+systemconfig.vp[key]+"</h2>"
            body += "<blockquote>"+vpexp[key]+"</blockquote>"
            body += "<hr />"
        }
        body +="<header class=\"major\"><h1>學生議員 (全校選區)經歷</h1></header>"
        for(var key in systemconfig.parliamentary){
            var priority = parseInt(key) + 1
            body += "<h2>"+priority+"號候選人<br>"+systemconfig.parliamentary[key]+"</h2>"
            body += "<blockquote>"+parliamentaryexperience[key]+"</blockquote>"
        }
        body += "</section></div>"
        body += fs.readFileSync('static/main/footer.html').toString()
        res.status(200).send(body)
    }else{
        res.cookie('info', "候選人政見尚未確定", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.cookie('location', "/", {maxAge: 1000, signed: true, httpOnly: true, overwrite: true});
        res.redirect(302,"/redirect")
    }
})


app.get('/redirect',cookieParser(cookieParserName),(req,res)=>{
    location = req.signedCookies.location
    info = req.signedCookies.info
    params = {location: location,info: info}
    var data = fs.readFileSync("static/main/redirect.html").toString()
    for(var key in params){
        data = data.replace('{%'+key+'%}',params[key])
    }
    res.send(data)
})

app.get('*',(req,res)=>{
    res.status(404).send("Sooory,Page not found")
})



app.listen(port,()=>{
	console.log("voting web running on %d port",port)
})
