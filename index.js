"use strict";
const https = require("https");
const fs = require("fs");
const _request = require("request");
const url = require("url");

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
				const real_user = body.user.username;
				var real_username = encodeURIComponent(real_user);
				if (real_user.match(/[a-z0-9]{20}/)) || (real_user.match(/[0-9]{1,6}/)) { //random username
					real_username = encodeURIComponent(body.user.name);
				}
				request_avatar(response, real_username);
			}
	});
});

function request_avatar(response, username) { 
	_request({
		url: "https://api.moecube.com/accounts/users/" + username + ".avatar"
	}, (error, res, body) => {
			if (error) {
				response.writeHead(500);
				response.end("Request error.");
				console.error("REQUEST ERROR", error);
			} else if (body == "{\"message\":\"Not Found\"}") {
				response.writeHead(404);
				response.end("Avatar not found.");
			} else {
				//console.log(body);
				_request({
					url: body,
					encoding: null
				}, (error, res, body) => { 
						if (error) {
							response.writeHead(500);
							response.end("Avatar error.");
							console.error("AVATAR ERROR", error);
						} else { 
							var recv_buf = Buffer.from(body, 'binary');
							response.writeHead(200, { "Content-Type": "image/png" });
							fs.writeFileSync("./test.png", recv_buf);
							response.end(recv_buf);
						}
				});
			}
	 });
}

https_server.listen(parseInt(process.argv[2]));
