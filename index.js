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
	const path_match = u.pathname.match(/^\/(.+)\.png$/);
	if (!path_match) { 
		response.writeHead(403);
		response.end("Invalid pathname.");
		return;
	}
	const username = path_match[1];
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
				console.log("BAD USERNAME JSON", body);
			} else if (!body.users) {
				response.writeHead(404);
				response.end("User not found.");
			} else { 
				const real_username = encodeURIComponent(body.users[0].username);
				_request({
					url: "https://api.moecube.com/accounts/users/" + real_username + ".avatar"
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
	});
});

https_server.listen(parseInt(process.argv[2]));
