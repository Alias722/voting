const fs = require('fs')

module.exports = {
	printMainPage : (data)=>{
		fs.readFile("static/main/index",(err,data)=>{
			if(err) throw err
			//res.send(data.toString())
		})
	}
}
