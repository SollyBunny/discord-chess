import { Chess, KING } from "chess.js";

function chunkString(str, len) {
	const size = Math.ceil(str.length / len);
	const arr = Array(size);
	for (let i = 0; i < size; ++i)
		arr[i] = str.substr(i * len, len);
	return arr;
}

const moveCache = new Map();
async function doAI(game) {
	const fen = game.fen();
	if(!moveCache.has(fen)) {

		const moves = game.moves();
		let bestMove = undefined;
		let bestScore = Infinity;
		for (const move of moves) {
			game.move(move);
			const score = game.perft(2);
			game.undo();
			if (score < bestScore) {
				bestScore = score;
				bestMove = move;
			}
			
		}
		moveCache.set(fen, bestMove);
		if(moveCache.size > 256)
			moveCache.delete(moveCache.keys().next().value);
	}
	if (moveCache.get(fen))
		game.move(moveCache.get(fen));
	return;
}

function badMoveStr(str) {
	if (str.length < 4)
		return `Invalid move, try s/Y${str}/Y`;
	if (str.length < 8)
		return `Stop it, try s/Y${str}/Y`;
	if (str.length < 12)
		return `):<, try s/Y${str}/Y`;
	if (str.length < 16)
		return `I give up`;
	return "";
}

export async function playGame(movesStr) {
	let msg = undefined;
	let moves;
	if(movesStr.length % 4 !== 0) {
		msg = badMoveStr(movesStr.slice(0, movesStr.length % 4));
		moves = chunkString(movesStr.slice(movesStr.length % 4), 4).reverse();
	} else {
		moves = chunkString(movesStr, 4).reverse();
	}
	const game = new Chess();
	for (let i = 0; i < moves.length; ++i) {
		const move = moves[i];
		try {
			game.move(move.toLowerCase(), { sloppy: true });
		} catch (e) {
			msg = badMoveStr(movesStr.slice(0, movesStr.length % 4) + moves.slice(i).reverse().join(""));
			break;
		}
		await doAI(game);
	}
	if(!msg) {
		if (game.isStalemate())
			msg = "Draw, stalemate";
		else if (game.isThreefoldRepetition())
			msg = "Draw, threefold repetition";
		else if (game.isInsufficientMaterial())
			msg = "Draw, insufficient material";
		else if (game.isDrawByFiftyMoves())
			msg = "Draw, fifty move rule";
		else if (game.isDraw())
			msg = "Draw";
		else if (game.isCheckmate())
			msg = "Checkmate";
	}
	return {
		fen: game.fen(),
		from: game.history({ verbose: true }).at(-1)?.from ?? "-",
		to: game.history({ verbose: true }).at(-1)?.to ?? "-",
		check: game.inCheck() ? game.findPiece({ type: KING, color: game.turn() }).at(0) || "-" : "-",
		msg: msg ?? "Use s/Y/Y[move] to play, eg: s/Y/YD2D3",
	};
}
