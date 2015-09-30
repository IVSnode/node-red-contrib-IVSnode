module.exports = function(RED) {
    "use strict";
		var util = require("util");
		var useColors = false;
    var mustache = require("mustache");
		var http = require('http');
    function VideoDisplayNode(n) {
        RED.nodes.createNode(this,n);
        console.log("videodisplay node");
        this.name = n.name;
        this.field = n.field || "payload";
        this.videodisplay = n.videodisplay;
        this.channelid = n.channelid;
        var node = this;
				var inputurl = "stop";
        var b = node.field.split(".");
        console.log("b.length="+b.length);
        var i = 0;
        var m = null;
        var rec = function(obj) {
            i += 1;
            if ((i < b.length) && (typeof obj[b[i-1]] === "object")) {
                rec(obj[b[i-1]]); // not there yet - carry on digging
            }
            else {
                 if (i === b.length) { // we've finished so assign the value
										var msg = "<html>\n<script type=\"text/javascript\" src=\"https://rawgit.com/j491424570/dash.debug.js/master/dash.debug.js\"></script>\n<body>\n<script type=\"text/javascript\">\nvar flag = 0;\nwindow.onload=function(){\nvar url = \"" + inputurl +"\";\nif(url !==\"stop\")\nsetupVideo(url);\n}\nfunction setupVideo(url)\n{\nvar context1 = new Dash.di.DashContext();\nvar player1 = new MediaPlayer(context1);\nplayer1.startup();\nplayer1.attachView(document.querySelector(\"#videoPlayer\"));\nplayer1.attachSource(url);\nalert(url);\n}\n</script>\n<video id = \"videoPlayer\" controls width = \"100%\" height = \"100%\"  >\nYour browser does not support the video tag.\n</video>\n</body>\n</html>";
										obj[b[i-1]] = mustache.render(msg,m);
										httpout(m);
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
								var state = msg.payload.split("=");
								console.log("msg.payload = "+ msg.payload);
								if(state[1] == "stop"){
									inputurl = "stop";
								}
								else{
									inputurl = state[1];
								}
								console.log("save inputurl = "+ inputurl);
//								rec(m);
            } catch(err) {
                node.error(err.message);
            }
        });
		
				function httpout(msg){
            if (msg.res) {
                if (msg.headers) {
                    msg.res.set(msg.headers);
                }
                var statusCode = msg.statusCode || 200;
                if (typeof msg.payload == "object" && !Buffer.isBuffer(msg.payload)) {
                    msg.res.jsonp(statusCode,msg.payload);
                }
                else {
                    if (msg.res.get('content-length') == null) {
                        var len;
                        if (msg.payload == null) {
                            len = 0;
                        } else if (Buffer.isBuffer(msg.payload)) {
                            len = msg.payload.length;
                        } else if (typeof msg.payload == "number") {
                            len = Buffer.byteLength(""+msg.payload);
                        } else {
                            len = Buffer.byteLength(msg.payload);
                        }
                        msg.res.set('content-length', len);
                    }

                    msg.res._msgId = msg._id;
                    msg.res.send(statusCode,msg.payload);
                }
            } else {
//                node.warn("No response object");
            }
				}
		    var http = require("follow-redirects").http;
		    var https = require("follow-redirects").https;
		    var urllib = require("url");
		    var express = require("express");
		    var getBody = require('raw-body');
		    var mustache = require("mustache");
		    var querystring = require("querystring");
		    var cors = require('cors');
		    var jsonParser = express.json();
		    var urlencParser = express.urlencoded();
		    var onHeaders = require('on-headers');
        if (RED.settings.httpNodeRoot !== false) {

            this.url = "/"+node.channelid;
            this.method = "get";
            this.swaggerDoc = "";

            var node = this;

            this.errorHandler = function(err,req,res,next) {
                node.warn(err);
                res.send(500);
            };

            this.callback = function(req,res) {
                if (node.method.match(/(^post$|^delete$|^put$|^options$)/)) {
                } else if (node.method == "get") {
										m = {payload:{},req:req,res:res};
										i = 0;
										rec(m);
                } else {
										console.log("call back error");
                }
            };

            var corsHandler = function(req,res,next) { next(); }

            if (RED.settings.httpNodeCors) {
                corsHandler = cors(RED.settings.httpNodeCors);
                RED.httpNode.options(this.url,corsHandler);
            }

            var httpMiddleware = function(req,res,next) { next(); }

            if (RED.settings.httpNodeMiddleware) {
                if (typeof RED.settings.httpNodeMiddleware === "function") {
                    httpMiddleware = RED.settings.httpNodeMiddleware;
                }
            }

            var metricsHandler = function(req,res,next) { next(); }

            if (this.metric()) {
                metricsHandler = function(req, res, next) {
                    var startAt = process.hrtime();
                    onHeaders(res, function() {
                        if (res._msgId) {
                            var diff = process.hrtime(startAt);
                            var ms = diff[0] * 1e3 + diff[1] * 1e-6;
                            var metricResponseTime = ms.toFixed(3);
                            var metricContentLength = res._headers["content-length"];
                            //assuming that _id has been set for res._metrics in HttpOut node!
                            node.metric("response.time.millis", {_id:res._msgId} , metricResponseTime);
                            node.metric("response.content-length.bytes", {_id:res._msgId} , metricContentLength);
                        }
                    });
                    next();
                };
            }

            if (this.method == "get") {
                RED.httpNode.get(this.url,httpMiddleware,corsHandler,metricsHandler,this.callback,this.errorHandler);
            } else if (this.method == "post") {
                RED.httpNode.post(this.url,httpMiddleware,corsHandler,metricsHandler,jsonParser,urlencParser,rawBodyParser,this.callback,this.errorHandler);
            } else if (this.method == "put") {
                RED.httpNode.put(this.url,httpMiddleware,corsHandler,metricsHandler,jsonParser,urlencParser,rawBodyParser,this.callback,this.errorHandler);
            } else if (this.method == "delete") {
                RED.httpNode.delete(this.url,httpMiddleware,corsHandler,metricsHandler,jsonParser,urlencParser,rawBodyParser,this.callback,this.errorHandler);
            }

            this.on("close",function() {
                var routes = RED.httpNode.routes[this.method];
                for (var i = 0; i<routes.length; i++) {
                    if (routes[i].path == this.url) {
                        routes.splice(i,1);
                        //break;
                    }
                }
                if (RED.settings.httpNodeCors) {
                    var routes = RED.httpNode.routes['options'];
                    if (routes) {
                        for (var j = 0; j<routes.length; j++) {
                            if (routes[j].path == this.url) {
                                routes.splice(j,1);
                                //break;
                            }
                        }
                    }
                }
            });
        } else {
            this.warn("Cannot create http-in node when httpNodeRoot set to false");
        }
    }
		
    function rawBodyParser(req, res, next) {
        if (req._body) { return next(); }
        req.body = "";
        req._body = true;
        getBody(req, {
            limit: '1mb',
            length: req.headers['content-length'],
            encoding: 'utf8'
        }, function (err, buf) {
            if (err) { return next(err); }
            req.body = buf;
            next();
        });
    }

    RED.nodes.registerType("videodisplay",VideoDisplayNode);
}