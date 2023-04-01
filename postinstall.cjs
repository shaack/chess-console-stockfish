/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * License: MIT, see file 'LICENSE'
 */

const modLib = new (require("modlib"))

modLib.add("cm-web-modules")
modLib.add("cm-chessboard")
modLib.add("cm-pgn")
modLib.add("cm-chess")
modLib.add("chess.mjs")
modLib.add("chess-console")
modLib.add("bootstrap-show-modal", "src", "bootstrap-show-modal.js")
modLib.add("cm-polyglot")
modLib.add("cm-polyglot", "src", "stakelbase")
modLib.add("cm-engine-runner")
modLib.add("cm-engine-runner", "engines", "stockfish-v10-niklasf.js")
