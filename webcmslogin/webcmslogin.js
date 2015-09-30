/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
  "use strict";
  var mustache = require("mustache");
	var http = require('http');
  function WebCMSLoginNode(n) {
    RED.nodes.createNode(this,n);
    this.name = n.name;
    this.field = n.field || "payload";
    this.webcmslogin = n.webcmslogin;
    var node = this;

    var b = node.field.split(".");
    var i = 0;
    var m = null;
    var rec = function(obj) {
      i += 1;
      if ((i < b.length) && (typeof obj[b[i-1]] === "object")) {
        rec(obj[b[i-1]]); // not there yet - carry on digging
      }
      else{
        if(i === b.length) { // we've finished so assign the value
          obj[b[i-1]] = mustache.render(node.webcmslogin,m);
          node.send(m);
        }
        else {
          obj[b[i-1]] = {}; // needs to be a new object so create it
          rec(obj[b[i-1]]); // and carry on digging
        }
      }
    }
    node.on("input", function(msg) {
      try {
        m = msg;
        i = 0;
        rec(msg);
      } catch(err) {
        node.error(err.message);
      }
    });
  }

  var mongo = require('mongodb');
  var crypto = require('crypto');
  var MongoClient = mongo.MongoClient;
	function Session(id) {
		this.name = id.name;
		this.session = id.session;
	};
	function User(user) {
		this.name = user.name;
		this.password = user.password;
	};

	function CMSlogin_postrequest(hostIP,param_url,post_data,res){
		console.log("savesessionid hostIP="+hostIP);
		var sessionid;
		var post_options = {
	    host: '172.21.84.2',
	    port: '8089',
	    path: '/IVSWebService/'+param_url,
	    method: 'POST',
	    headers: {
	      'Content-Type': 'application/xml',
	      'charset': 'UTF-8',
	      'Content-Length': post_data.length
	    },
	    data:post_data
	  };
	  console.log("post_data = "+post_data);
	  var post_req = http.request(post_options, function (response) {
	    var responseText=[];
	    var size = 0;
	    response.on('data', function (data) {
	      responseText.push(data);
	      size+=data.length;
	    });
	    response.on('end', function () {
	      responseText = Buffer.concat(responseText,size);
	  		console.log("responseText = " + responseText);
				var parseString = require('xml2js').parseString;
				var util = require("util");
				var useColors = false;
				parseString(responseText, function (err, result) {
					//may be result.result.SessionID==null
//					console.log("result.result.SessionID2="+result.result.SessionID2);
					if(result.result.SessionID == undefined){
						console.log("!!!");
						res.send("server error");
					}
					else{
						sessionid = result.result.SessionID.toString();
						console.log("WEBCMS sessionid="+sessionid);
						var hostname = "127.0.0.1";
						var id = {
							name: hostIP,
							session: sessionid,
						};
						var port = 27017;
						var db = "blog"
						var url = "mongodb://"  + hostname+":"+port+"/"+db;
				    MongoClient.connect(url, function(err, db) {
							if (err) {
				          console.log("MongoClient.connect error");
				      } else {
								db.collection('sessiondb', function(err, collection) {
									if (err) {
										console.log("db.collection err");
										return ;
									}
									else{
										console.log("save hostIP="+hostIP);
										collection.update({name:hostIP},{$set:{session:sessionid}},{upsert:true}, function(err, result){
										if(err){
											console.log("collection.update err");
											return ;
										}
										console.log("session save ok!");
										});	
									}
								})
				   		}
				   	});					
					}
				});
	    });
	  });
	  post_req.write(post_data);
	  post_req.end();
	}
	
	function Eventlogin_postrequest(hostIP,param_url,post_data,res){
		console.log("savesessionid hostIP="+hostIP);
		var sessionid;
		var post_options = {
	    host: '172.21.84.2',
	    port: '8050',
	    path: '/IVSWebService/'+param_url,
	    method: 'POST',
	    headers: {
	      'Content-Type': 'application/xml',
	      'charset': 'UTF-8',
	      'Content-Length': post_data.length
	    },
	    data:post_data
	  };
	  console.log("post_data = "+post_data);
	  var post_req = http.request(post_options, function (response) {
	    var responseText=[];
	    var size = 0;
	    response.on('data', function (data) {
	      responseText.push(data);
	      size+=data.length;
	    });
	    response.on('end', function () {
	      responseText = Buffer.concat(responseText,size);
	  		console.log("responseText = " + responseText);
				var parseString = require('xml2js').parseString;
				var util = require("util");
				var useColors = false;
				parseString(responseText, function (err, result) {
					//may be result.result.SessionID==null
//					console.log("result.result.SessionID2="+result.result.SessionID2);
					if(result.result.SessionID == undefined){
						console.log("!!!");
						res.send("server error");
					}
					else{
						sessionid = result.result.SessionID.toString();
						console.log("event sessionid="+sessionid);
						var hostname = "127.0.0.1";
						var id = {
							name: hostIP,
							session: sessionid,
						};
						var port = 27017;
						var db = "blog"
						var url = "mongodb://"  + hostname+":"+port+"/"+db;
				    MongoClient.connect(url, function(err, db) {
							if (err) {
				          console.log("MongoClient.connect error");
				      } else {
								db.collection('eventdb', function(err, collection) {
									if (err) {
										console.log("db.collection err");
										return ;
									}
									else{
										console.log("save hostIP="+hostIP);
										collection.update({name:hostIP},{$set:{session:sessionid}},{upsert:true}, function(err, result){
										if(err){
											console.log("collection.update err");
											return ;
										}
										console.log("session save ok!");
										});	
									}
								})
				   		}
				   	});					
					}
				});
	    });
	  });
	  post_req.write(post_data);
	  post_req.end();
	}
	
	RED.httpNode.get("/webcmslogin", function(req, res){
		res.setHeader('Access-Control-Allow-Origin', '*');
		console.log("app.get webcmslogin");
		var hostIP = req.connection.remoteAddress;
		var username = req.query.username;
		var password = req.query.password;
		var hostname = "127.0.0.1";
		var md5 = crypto.createHash('md5');
		var md5password = md5.update(password).digest('base64');
		var port = 27017;
		var db = "blog"
		var url = "mongodb://"  + hostname+":"+port+"/"+db;
		
    MongoClient.connect(url, function(err, db) {
			if (err) {
          console.log("MongoClient.connect error");
      }
      else {
				db.collection('users', function(err, collection) {
					if (err) {
						console.log("MongoClient.connect error");
					}
					collection.findOne({name: username}, function(err, doc) {
						if (doc) {
							var user = new User(doc);
							if (!user) {
								console.log('user not exist1');
								res.send("user not exist1");
							}
							if (user.password != md5password) {
								console.log('password error');
								res.send("password error");
							}
							else
							{
								var xml_data_online = '<?xml version="1.0"?><request><item name="username" value="admin"/><item name="password" value="1234"/></request>';
								CMSlogin_postrequest(hostIP,"Authority/Online",xml_data_online,res);
								Eventlogin_postrequest(hostIP,"Authority/Online",xml_data_online,res);
								res.send("ok");
							}
						} else {
							console.log("user not exist2");
							res.send("user not exist2");
						}
					});
				})
      }
		});	
	});
	
	function CMSlogout_postrequest(param_url,post_data){
		console.log("savesessionid");
		var sessionid;
	 	console.log(post_data);
		var post_options = {
	    host: '172.21.84.2',
	    port: '8089',
	    path: '/IVSWebService/'+param_url,
	    method: 'POST',
	    headers: {
	      'Content-Type': 'application/xml',
	      'charset': 'UTF-8',
	      'Content-Length': post_data.length
	    },
	    data:post_data
	  };
	  var post_req = http.request(post_options, function (response) {
	  	console.log("post response = " + response);
	    var responseText=[];
	    var size = 0;
	    response.on('data', function (data) {
	      responseText.push(data);
	      size+=data.length;
	    });
   		response.on('end', function () {
	      responseText = Buffer.concat(responseText,size);
	  		console.log("responseText = " + responseText);
			});
    });
	  post_req.write(post_data);
	  post_req.end();
	}

	function Eventlogout_postrequest(param_url,post_data){
		console.log("savesessionid");
		var sessionid;
	 	console.log(post_data);
		var post_options = {
	    host: '172.21.84.2',
	    port: '8050',
	    path: '/IVSWebService/'+param_url,
	    method: 'POST',
	    headers: {
	      'Content-Type': 'application/xml',
	      'charset': 'UTF-8',
	      'Content-Length': post_data.length
	    },
	    data:post_data
	  };
	  var post_req = http.request(post_options, function (response) {
	  	console.log("post response = " + response);
	    var responseText=[];
	    var size = 0;
	    response.on('data', function (data) {
	      responseText.push(data);
	      size+=data.length;
	    });
   		response.on('end', function () {
	      responseText = Buffer.concat(responseText,size);
	  		console.log("responseText = " + responseText);
			});
    });
	  post_req.write(post_data);
	  post_req.end();
	}
	
	RED.httpNode.get("/webcmslogout", function(req, res){
		console.log("videosystemoffline");
		res.setHeader('Access-Control-Allow-Origin', '*');
		var hostIP = req.connection.remoteAddress;
		var hostname = "127.0.0.1";
		var port = 27017;
		var db = "blog"
		var url = "mongodb://"  + hostname+":"+port+"/"+db;
    MongoClient.connect(url, function(err, db) {
			if (err) {
          console.log("MongoClient.connect error");
      } else {
				db.collection('sessiondb', function(err, collection) {
					if (err) {
						console.log("db.collection err");
						res.send();
						return ;
					}
					else{
						console.log("db.collection ok");
						collection.findOne({name: hostIP}, function(err, doc) {
							if (err) {
								console.log("collection.findOne error");
								res.send();
								return ;
							}
							if(doc){
								var id = new Session(doc);
								console.log(id.name);
								console.log(id.session);
								var xml_data_offline = '<?xml version="1.0"?><request><item name="sessionID" value="'+id.session+'"/></request>';
								CMSlogout_postrequest("Authority/Offline",xml_data_offline);
							}
							else{
								console.log("collection get failed");
								res.send();
								return ;
							}
						});
					}
				})
				db.collection('eventdb', function(err, collection) {
					if (err) {
						console.log("db.collection err");
						res.send();
						return ;
					}
					else{
						console.log("db.collection ok");
						collection.findOne({name: hostIP}, function(err, doc) {
							if (err) {
								console.log("collection.findOne error");
								res.send();
								return ;
							}
							if(doc){
								var id = new Session(doc);
								console.log(id.name);
								console.log(id.session);
								var xml_data_offline = '<?xml version="1.0"?><request><item name="sessionID" value="'+id.session+'"/></request>';
								Eventlogout_postrequest("Authority/Offline",xml_data_offline);
							}
							else{
								console.log("collection get failed");
								res.send();
								return ;
							}
						});
					}
				})
      }
    });
	});
	
  RED.nodes.registerType("webcmslogin",WebCMSLoginNode);
}
