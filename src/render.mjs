
import { createCanvas, loadImage, registerFont } from "canvas";

const SIZE = 64;
const POSSIZE = SIZE / 4;
const COLOR1 = "#eeeed2";
const COLOR2 = "#769656";
const COLORSEL = "rgb(255, 255, 51, 0.5)";
const COLORCHECK = "rgba(255, 0, 0, 0.5)";
const TEXTSIZE = SIZE / 2;
const COLORBG = "#323339";
const COLORFG = "white";

const peices = {};
{
	console.log("Loading graphics");
	await Promise.all("pbnrkq".split("").map(async p => {
		let img;
		img = await loadImage("data/w" + p + ".png");
		peices[p.toUpperCase()] = img;
		img = await loadImage("data/b" + p + ".png");
		peices[p] = img;
		
	}));
}

console.log("Loading font");
registerFont("data/font.ttf", { family: "Font" });

console.log("Prerendering BG");
function createBG(player) {
	const can = createCanvas(SIZE * 8, SIZE * 8);
	const ctx = can.getContext("2d");
	ctx.font = `${POSSIZE}px Font`;
	// Draw COLOR1
	ctx.fillStyle = COLOR1;
	ctx.fillRect(0, 0, SIZE * 8, SIZE * 8);
	// Draw COLOR2
	ctx.fillStyle = COLOR2;
	ctx.beginPath();
	for (let x = 0; x < 8; ++x) for (let y = 0; y < 8; ++y) {
		if ((x + y) % 2 === 1)
			ctx.rect(x * SIZE, y * SIZE, SIZE, SIZE);
	}
	ctx.fill();
	ctx.closePath();
	// Draw Y markings
	ctx.textBaseline = "hanging";
	ctx.textAlign = "left";
	for (let y = 0; y < 8; ++y) {
		ctx.fillStyle = y % 2 == 1 ? COLOR1 : COLOR2;
		ctx.fillText(
			String(player === 0 ? 8 - y : 1 + y),
			0.1 * SIZE, (y + 0.05) * SIZE
		);
	};
	// Draw X markings
	ctx.textBaseline = "alphabetic";
	ctx.textAlign = "right";
	for (let x = 0; x < 8; ++x) {
		ctx.fillStyle = x % 2 == 1 ? COLOR2 : COLOR1;
		ctx.fillText(
			String.fromCodePoint("a".codePointAt(0) + (player === 0 ? x : 7 - x)),
			(x + 0.9) * SIZE, (8 - 0.1) * SIZE
		);
	};
	// Return
	return can;
}
const backgrounds = [createBG(0), createBG(1)];

const can = createCanvas(SIZE * 8, SIZE * 8 + TEXTSIZE);
const ctx = can.getContext("2d");
export function renderFen({ from, to, check, fen, msg }) {
	const [position, turn, castling, lastMove, halfMove, fullMove] = fen.split(' ');
	// Draw background
	ctx.drawImage(backgrounds[turn === "w" ? 0 : 1], 0, 0);
	// Draw highlight
	if (from === to)
		from = "-";
	if (from === check)
		from = "-";
	if (to === check)
		to = "-";
	function highlight(pos, color) {
		const x = pos.charCodeAt(0) - "a".charCodeAt(0);
		const y = pos.charCodeAt(1) - "1".charCodeAt(0);
		ctx.fillStyle = color;
		ctx.fillRect(
			(turn === "w" ? x : 7 - x) * SIZE,
			(turn === "w" ? 7 - y : y) * SIZE,
			SIZE, SIZE
		);
	}
	if (from !== "-")
		highlight(from, COLORSEL);
	if (to !== "-")
		highlight(to, COLORSEL);
	if (check !== "-")
		highlight(check, COLORCHECK);
	// Draw peices
	let x = 0;
	let y = 0;
	for (const char of position) {
		if (char === "/") {
			y++;
			x = 0;
		} else if (!isNaN(char)) {
			x += parseInt(char); // Skip empty spaces
		} else {
			ctx.drawImage(
				peices[char], 0, 0, peices[char].width, peices[char].height,
				(turn === "w" ? x : 7 - x) * SIZE,
				(turn === "w" ? y : 7 - y) * SIZE,
				SIZE, SIZE
			);
			x++;
		}
	}
	// Draw text BG
	ctx.fillStyle = COLORBG;
	ctx.fillRect(0, 8 * SIZE, 8 * SIZE, TEXTSIZE);
	// Draw text
	ctx.fillStyle = COLORFG;
	ctx.textBaseline = "top";
	ctx.textAlign = "center";
	ctx.font = `${TEXTSIZE * 0.7}px Font`;
	if (msg)
		ctx.fillText(msg, SIZE * 8 / 2, SIZE * 8, SIZE * 8);
	// Return PNG stream
	return can.createPNGStream();
}
