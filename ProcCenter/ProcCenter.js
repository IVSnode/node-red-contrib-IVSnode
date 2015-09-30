module.exports = function(RED) {
  "use strict";
  var mustache = require("mustache");
	var http = require('http');
/*	
	var ws = require("nodejs-websocket");
	
	var websocketmessage = new function MyObj(msg){
		this.doFunction = function(msg){
			console.log("doFunction="+msg);
		
			var server = ws.createServer(function(conn){
				console.log("Connection request on Websocket-Server");
			  conn.on("text", function (str) {
			  	var ts = Date.now();
			    conn.sendText(""+Date.now());
					    conn.sendText(str);
					    setInterval(function(){
								console.log("delay send");
								conn.sendText("delay send");
							},2000);
			  })
			  conn.on("close", function (code, reason) {
			    console.log("close");
			  });
			  conn.on("error", function (code, reason) {
			    console.log("error");
			  });
			  console.log("doFunction finish");
			}).listen(30001);
		}
	}
/*
	var obj2 = new function MyObj(str){
		this.doFunction = function(str){
			console.log("doFunction="+str);
		}
	};
	var server = ws.createServer(function(conn){
		console.log("Connection request on Websocket-Server");
	  conn.on("text", function (str) {
	    console.log("receive:"+str)
			    conn.sendText(str);
			    setInterval(function(){
						console.log("delay send");
						conn.sendText("delay send");
					},2000);
	  })
	  conn.on("close", function (code, reason) {
	    console.log("close");
	  });
	  conn.on("error", function (code, reason) {
	    console.log("error");
	  });
		this.sendmessage = function(){
			console.log("sendmessage=");
		}
	}).listen(30001);
*/
/*
	var server = ws.createServer(function(conn){
		console.log("Connection request on Websocket-Server");
	  conn.on("text", function (str) {
	    console.log("receive:"+str)
			    conn.sendText(str);
			    setInterval(function(){
						console.log("delay send");
						conn.sendText("delay send");
					},2000);
	  })
	  conn.on("close", function (code, reason) {
	    console.log("close");
	  });
	  conn.on("error", function (code, reason) {
	    console.log("error");
	  });
	}).listen(30001);
*/	

  function ProCenterNode(n) {
  	console.log("!ProCenterNode");
    RED.nodes.createNode(this,n);
    console.log("procenter node");
    this.name = n.name;
    this.field = n.field || "payload";
    this.procenter = n.procenter;
    var node = this;

    var b = node.field.split(".");
    var i = 0;
    var m = null;

    node.on("input", function(msg) {
      try {

      } catch(err) {
        node.error(err.message);
      }
    });
      
		function post_videoplayrequest(param_url,post_data,channel,res,node){
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
			var post_req = http.request(post_options, function (response) {
				var responseText=[];
				var size = 0;
				response.on('data', function (data) {
				responseText.push(data);
				size+=data.length;
				});
				response.on('end', function () {
					responseText = Buffer.concat(responseText,size);
					var aaa = responseText.toString();
					var result = aaa.split("&");
					var state = result[0].split("=");
					if (state[1] == "OK"){
						var body = result[1].split("=");
						var msgsend = {topic:"mytopic"};
						msgsend.payload = "ch"+channel+"="+body[1];
						node.send(msgsend);
						res.send();
					}
					else{
						console.log("state=error");
					}	
				});
			});
			post_req.write(post_data);
			post_req.end();
		}

		RED.httpNode.get("/procenterplay", function(req, res){
			console.log("procenterplay");
			res.setHeader('Access-Control-Allow-Origin', '*');
			var hostIP = req.connection.remoteAddress;
			var channel = req.query.channel;
			var begintime = req.query.begintime;
			console.log("begintime="+begintime);
			var endtime = req.query.endtime;
		  var msecbegintime = changeushoptime(begintime);
			console.log("msecbegintime="+msecbegintime);
		  var msecendtime = msecbegintime+3600;
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
							console.log("find hostip="+hostIP);
							collection.findOne({name: hostIP}, function(err, doc) {
								if (err) {
									console.log("collection.findOne error");
									res.send();
									return ;
								}
								if (doc) {
									var id = new Session(doc);
									if(begintime == "0"){
										console.log("preview");				
										var param_url = 'LiveView/Connection';
										var post_data= '<request><item name="sessionID" value="' + id.session + '"/><item name="IVSID" value="IVS-1000-123-12-00001"/><item name="channel" value='+channel+'"/></request>';
										post_videoplayrequest(param_url,post_data,channel,res,node);
								  }
									else{
										console.log("playback");
										var param_url = 'Playback/Connection';
										var post_data= '<request><item name="sessionID" value="' + id.session + '"/><item name="IVSID" value="IVS-1000-123-12-00001"/><item name="channel" value='+channel+'"/><item name="beginTime" value="'+msecbegintime+'"/><item name="endTime" value="'+msecendtime+'"/></request>';
										console.log("playback post_data="+post_data);
										post_videoplayrequest(param_url,post_data,channel,res,node);
									}
								} 
								else {
									console.log("collection get failed");
									res.send();
									return ;
								}
							});
						}
					})
        }
			});
			console.log("RED.httpNode get videoshow ok");
		});
			
		function post_videostoprequest(param_url,post_data,channel,res,node){
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
			var post_req = http.request(post_options, function (response) {
				var responseText=[];
				var size = 0;
				response.on('data', function (data) {
				responseText.push(data);
				size+=data.length;
				});
				response.on('end', function () {
					responseText = Buffer.concat(responseText,size);
		      console.log("responseText="+responseText);
		      var aaa = responseText.toString();
		  		var result = aaa.split("&");
				  var state = result[0].split("=");
				  if (state[1] == "OK"){
            var msgsend = {topic:"mytopic"};
            msgsend.payload = "ch"+channel+"="+"stop";
            node.send(msgsend);
						console.log("stop ok");
						res.send("ok");
				  }
				  else
				  {
				    console.log("error responseText="+responseText);
				  }	
				});
			});
			post_req.write(post_data);
			post_req.end();
		}

		RED.httpNode.get("/procenterstop", function(req, res){
			console.log("procenterstop");
			var hostIP = req.connection.remoteAddress;
			var channel = req.query.channel;
			var begintime = req.query.begintime;
			var endtime = req.query.endtime;
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
							console.log("get hostIP="+hostIP);
							collection.findOne({name: hostIP}, function(err, doc) {
								if (err) {
									console.log("collection.findOne error");
									res.send();
									return ;
								}
								if (doc) {
									var id = new Session(doc);
									console.log(id.name);
									console.log(id.session);
									var id = new Session(doc);
									if(begintime == "0" || endtime == "0"){
										var param_url = 'LiveView/Disconnection';
									}
									else{
										var param_url = 'Playback/Disconnection';
									}
									var post_data= '<request><item name="sessionID" value="' + id.session + '"/><item name="IVSID" value="IVS-1000-123-12-00001"/><item name="channel" value=1"/></request>';
									post_videostoprequest(param_url,post_data,channel,res,node);
								} 
								else {
									console.log("collection get failed");
									res.send();
									return ;
								}
							});
						}
					})
        }
			});	
			console.log("RED.httpNode get videoshowstop ok");
		});				

		function getevent_postrequest(param_url,post_data,res){
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
		    var responseText=[];
		    var size = 0;
		    response.on('data', function (data) {
		      responseText.push(data);
		      size+=data.length;
		    });
		    response.on('end', function () {
		      responseText = Buffer.concat(responseText,size);
		      console.log("!!!receive responseText="+responseText);
		      var eventdemo = '{"transaction_summary": [["09/14/2015 13:38:32", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:39:04", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:40:19", "\u53d1\u7968: \u91d1\u989d 175.0 \u5143"], ["09/14/2015 13:40:51", "\u53d1\u7968: \u91d1\u989d 55.0 \u5143"], ["09/14/2015 13:41:23", "\u53d1\u7968: \u91d1\u989d 21.0 \u5143"], ["09/14/2015 13:41:55", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:42:27", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:42:58", "\u53d1\u7968: \u91d1\u989d 175.0 \u5143"], ["09/14/2015 13:43:30", "\u53d1\u7968: \u91d1\u989d 55.0 \u5143"], ["09/14/2015 13:44:02", "\u53d1\u7968: \u91d1\u989d 21.0 \u5143"], ["09/14/2015 13:44:34", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:45:06", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:45:38", "\u53d1\u7968: \u91d1\u989d 175.0 \u5143"], ["09/14/2015 13:46:09", "\u53d1\u7968: \u91d1\u989d 55.0 \u5143"], ["09/14/2015 13:46:41", "\u53d1\u7968: \u91d1\u989d 21.0 \u5143"], ["09/14/2015 13:47:13", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:47:45", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:48:17", "\u53d1\u7968: \u91d1\u989d 175.0 \u5143"], ["09/14/2015 13:48:49", "\u53d1\u7968: \u91d1\u989d 55.0 \u5143"], ["09/14/2015 13:49:20", "\u53d1\u7968: \u91d1\u989d 21.0 \u5143"], ["09/14/2015 13:49:52", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:50:24", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:50:56", "\u53d1\u7968: \u91d1\u989d 175.0 \u5143"], ["09/14/2015 13:51:28", "\u53d1\u7968: \u91d1\u989d 55.0 \u5143"], ["09/14/2015 13:52:00", "\u53d1\u7968: \u91d1\u989d 21.0 \u5143"], ["09/14/2015 13:52:31", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:53:03", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:53:35", "\u53d1\u7968: \u91d1\u989d 175.0 \u5143"], ["09/14/2015 13:54:07", "\u53d1\u7968: \u91d1\u989d 55.0 \u5143"], ["09/14/2015 13:54:39", "\u53d1\u7968: \u91d1\u989d 21.0 \u5143"], ["09/14/2015 13:55:11", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:55:43", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:56:14", "\u53d1\u7968: \u91d1\u989d 175.0 \u5143"], ["09/14/2015 13:56:46", "\u53d1\u7968: \u91d1\u989d 55.0 \u5143"], ["09/14/2015 13:57:18", "\u53d1\u7968: \u91d1\u989d 21.0 \u5143"], ["09/14/2015 13:57:50", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:58:22", "\u53d1\u7968: \u91d1\u989d 72.0 \u5143"], ["09/14/2015 13:58:54", "\u53d1\u7968: \u91d1\u989d 175.0 \u5143"], ["09/14/2015 13:59:26", "\u53d1\u7968: \u91d1\u989d 55.0 \u5143"], ["09/14/2015 13:59:57", "\u53d1\u7968: \u91d1\u989d 21.0 \u5143"]]}';
					var resopnseTextdemo = '<?xml version="1.0" encoding="UTF-8"?>\n<result>\n<itemcount>2</itemcount>\n<version>1.0.1</version>\n<item><VMSEvents timestamp="2015-08-09 16:30"  type="EVT_SENSOR" subType="SENSOR_TRIGGER" desc=""/></item>\n<item><VMSEvents timestamp="2015-08-09 16:50"  type="EVT_PLUGIN" subType="2:forbidden Zone" desc=""/></item>\n</result>\n';
					var parseString = require('xml2js').parseString;
					var util = require("util");
					var useColors = false;
					parseString(responseText, function (err, result) {
						if(result.result.itemcount == undefined){
						}
						else{
							console.log("!!");
							var itemcount = parseInt(result.result.itemcount);
							console.log("itemcount="+itemcount);
							var payload = '{"transaction_summary": [';
							for(i=0;i<itemcount;i++){
								payload = payload+"[\"";
								var time = result.result.item[i].VMSEvents[0].$.timestamp;
								payload = payload+time+"\",";
								payload = payload+"\"type="+result.result.item[i].VMSEvents[0].$.type+"\",";
								payload = payload+"\"subType="+result.result.item[i].VMSEvents[0].$.subType+"\"],";
							}
							if(itemcount != 0){
								payload = payload.substring(0,payload.length-1);
							}
							payload = payload+"]}";
							console.log("payload="+payload);											
							res.send(payload);
						}
					});
				});
		  });
		  post_req.write(post_data);
		  post_req.end();
		}
			
		RED.httpNode.get("/procentergetevent", function(req, res){
			console.log("procentergetevent");
			res.setHeader('Access-Control-Allow-Origin', '*');
			var hostIP = req.connection.remoteAddress;
			var channel = req.query.channel;
			var hostname = "127.0.0.1";
			var port = 27017;
			var db = "blog"
			var url = "mongodb://"  + hostname+":"+port+"/"+db;
			var xml_data_online = '<?xml version="1.0"?><request><item name="username" value="admin"/><item name="password" value="1234"/></request>';
			var hostname = "127.0.0.1";
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
							res.send();
							return ;
						}
						else{
							console.log("find hostip="+hostIP);
							collection.findOne({name: hostIP}, function(err, doc) {
								if (err) {
									console.log("collection.findOne error");
									res.send();
									return ;
								}
								if (doc) {
									var id = new Session(doc);
									console.log(id.name);
									console.log(id.session);
									var param_url = 'EVTMgmt/LiveEvents';
									var post_data= '<?xml version="1.0"?><request><item name="sessionID" value="' + id.session + '"/><item name="IVSID" value="IVS-1000-123-12-00001"/><item name="mode" value="'+channel+'"/></request>';
									getevent_postrequest("EVTMgmt/LiveEvents",post_data,res);
									console.log("RED.httpNode get videoshow ok");
								} 
								else {
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

		RED.httpNode.get("/procentergetsusiaccess", function(req, res){
			console.log("procentergetsusiaccess");
			res.setHeader('Access-Control-Allow-Origin', '*');
			websocketmessage.doFunction("111");
			res.send("123");
		});
  }
	
  var mongo = require('mongodb');
  var MongoClient = mongo.MongoClient;
	function Session(id) {
		this.name = id.name;
		this.session = id.session;
	};

	function changetime(evt){
	  var starttime = evt.replace(new RegExp("-","gm"),"/");
	  var minisecond = (new Date(starttime)).getTime(); //得到毫秒数 
	  return minisecond/1000;
	}
	
	function changeushoptime(evt){
		var minisecond = (new Date(evt)).getTime(); //得到毫秒数 
		return minisecond/1000;
	}
		
  RED.nodes.registerType("procenter",ProCenterNode);
}
