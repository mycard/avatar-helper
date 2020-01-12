"use strict";
const https = require("https");
const fs = require("fs");
const _request = require("request");
const url = require("url");
const gm = require("gm");

const https_options = {
	cert: fs.readFileSync("./certs/fullchain.pem"),
	key: fs.readFileSync("./certs/privkey.pem")
};

const https_server = https.createServer(https_options, (request, response) => {
	const u = url.parse(request.url, false);
	const path_match = u.pathname.match(/^\/user_avatar\/ygobbs.com\/(.+)\/\d+\/\d+_2\.png$/);
	if (!path_match) { 
		response.writeHead(403);
		response.end("Invalid pathname.");
		return;
	}
	//const username = encodeURIComponent(path_match[1]);
	const username = path_match[1];
	//console.log("REQUEST", username);
	_request({
		url: "https://ygobbs.com/users/" + username + ".json",
		json: true
	}, (error, res, body) => { 
			if (error) {
				response.writeHead(500);
				response.end("Username error.");
				console.error("USERNAME ERROR", error)
			} else if (typeof (body) === "string") {
				response.writeHead(500);
				response.end("Bad username JSON.");
				console.error("BAD USERNAME JSON", body);
			} else if (!body.users) {
				//console.log("FALLBACK", username);
				request_avatar(response, username);
			} else { 
				request_avatar(response, encodeURIComponent(body.user.username), encodeURIComponent(body.user.name));
			}
	});
});

function request_avatar(response, username, fallback_username) { 
	_request({
		url: "https://api.moecube.com/accounts/users/" + username + ".avatar"
	}, (error, res, body) => {
			if (error) {
				if (fallback_username) {
					request_avatar(response, fallback_username);
				} else {
					response.writeHead(500);
					response.end("Request error.");
				}
				console.error("REQUEST ERROR", error);
			} else if (!body.startsWith("http")) {
				if (fallback_username) {
					request_avatar(response, fallback_username);
				} else { 
					response.writeHead(404);
					response.end("Avatar not found.");
				}
			} else {
				//console.log(body);
				_request({
					url: body,
					encoding: null
				}, (error, res, body) => { 
						if (error) {
							if (fallback_username) {
								request_avatar(response, fallback_username);
							} else {
								response.writeHead(500);
								response.end("Avatar error.");
								console.error("AVATAR ERROR", error);
							}
						} else { 
							var recv_buf = Buffer.from(body, 'binary');
							gm(recv_buf).resize(25, 25).toBuffer("PNG", (error, dst_buf) => { 
								if (error) {
									if (fallback_username) {
										request_avatar(response, fallback_username);
									} else {
										response.writeHead(500);
										response.end("Convert error.");
										console.error("CONVERT ERROR", error);
									}
								} else {
									response.writeHead(200, { "Content-Type": "image/png" });
									response.end(dst_buf);
								}
							});
						}
				});
			}
	 });
}

https_server.listen(parseInt(process.argv[2]));
