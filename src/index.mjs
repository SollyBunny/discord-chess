#!/bin/env node

import { createServer } from "node:http";

import { renderFen } from "./render.mjs";

import { playGame } from "./game.mjs";

import fs from "fs/promises";

const PORT = 8080;

const HELP = await fs.readFile("data/index.html");

const FAVICON = await fs.readFile("data/wp.png");

createServer(async (req, res) => {
	if(req.url === "/favicon.ico") {
		res.writeHead(200, { "content-type": "image/png" });
		res.end(FAVICON);
		return;
	}
	if(!req.url.startsWith("/PLAY") || !req.url.endsWith(".png")) {
		res.writeHead(200, { "content-type": "text/html" });
		res.end(HELP);
		return;
	}
	res.writeHead(200, { "content-type": "image/png" });
	const game = await playGame(req.url.slice("/PLAY".length, -".png".length));
	const output = renderFen(game);
	output.pipe(res);
}).listen(PORT, () => {
	console.log(`Hosting on port ${PORT}`);
});
