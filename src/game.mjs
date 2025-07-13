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

export async function playGame(moves) {
	let msg = "";
	if(moves.length % 4 !== 0) {
		msg = `Invalid move, try s/Y${moves.slice(0, moves.length % 4)}/Y`;
		moves = moves.slice(moves.length % 4);
	}
	moves = chunkString(moves, 4).reverse();
	const game = new Chess();
	for (const move of moves) {
		try {
			game.move(move.toLowerCase(), { sloppy: true });
		} catch (e) {
			msg = `Invalid move, try s/Y${move}/Y`;
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
		msg
	};
}
