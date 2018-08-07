/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console-stockfish
 * License: MIT, see file 'LICENSE'
 */

import {ChessConsolePlayer} from "../../lib/chess-console/ChessConsolePlayer.js"
import {Observe} from "../../lib/svjs-observe/Observe.js"
import {MESSAGE} from "../../lib/chess-console/ChessConsole.js"

export const ENGINE_STATE = {
    LOADING: 1,
    LOADED: 2,
    READY: 3,
    THINKING: 4
}

export class StockfishPlayer extends ChessConsolePlayer {

    constructor(name, chessConsole, props) {
        super(name, chessConsole, props)

        this.engineWorker = null
        this.model = chessConsole.state
        this.level = 1
        this.scoreHistory = {}
        this.score = null
        this.i18n = chessConsole.i18n
        this.i18n.load({
            de: {
                score: "Bewertung",
                level: "Stufe"
            },
            en: {
                score: "score",
                level: "level"
            }
        })

        this.engineState = ENGINE_STATE.LOADING
        this.chessConsole.messageBroker.subscribe(MESSAGE.gameStarted, (data) => {
            if(data.gameProps.engineLevel) {
                this.level = data.gameProps.engineLevel
            }
        })
        //const persistence = this.chessConsole.persistence
        this.chessConsole.messageBroker.subscribe(MESSAGE.load, () => {
            if(this.chessConsole.persistence.readValue("level")) {
                this.level = parseInt(this.chessConsole.persistence.readValue("level"), 10)
            }
            if(this.chessConsole.persistence.readValue("scoreHistory")) {
                this.scoreHistory = this.chessConsole.persistence.readValue("scoreHistory")
                let score = this.scoreHistory[this.chessConsole.state.plyViewed]
                if (!score && this.chessConsole.state.plyViewed > 0) {
                    score = this.scoreHistory[this.chessConsole.state.plyViewed - 1]
                }
                this.score = score
            }
        })
        this.chessConsole.messageBroker.subscribe(MESSAGE.gameStarted, () => {
            this.scoreHistory = {}
            this.score = null
        })
        Observe.property(this, "level", () => {
            this.chessConsole.persistence.saveValue("level", this.level)
        })
        Observe.property(this, "score", () => {
            this.chessConsole.persistence.saveValue("score", this.score)
            this.chessConsole.persistence.saveValue("scoreHistory", this.scoreHistory)
        })

        this.initWorker()
    }

    /*
        newGame(depth = 1) {
            this.depth = depth
            this.search = ""
            this.ponder = undefined
            this.score = undefined
            this.scoreHistory = {}
            // this.name = "Stockfish " + _t.level + " " + this.depth
            // this.redraw()
        }
    */

    uciCmd(cmd) {
        this.engineWorker.postMessage(cmd)
    }

    listener(event) {
        // console.log("listener", event)
        const line = event.data
        if (line === 'uciok') {
            this.engineState = ENGINE_STATE.LOADED
        } else if (line === 'readyok') {
            this.engineState = ENGINE_STATE.READY
        } else {
            let match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbk])? ponder ([a-h][1-8])?([a-h][1-8])?/)
            if (match) {
                this.engineState = ENGINE_STATE.READY
                if (match[4] !== undefined) {
                    this.ponder = {from: match[4], to: match[5]}
                } else {
                    this.ponder = undefined
                }
                const move = {from: match[1], to: match[2], promotion: match[3]}
                this.moveResponse(move)
            } else {
                match = line.match(/^info .*\bdepth (\d+) .*\bnps (\d+)/)
                if (match) {
                    this.engineState = ENGINE_STATE.THINKING
                    this.search = 'Depth: ' + match[1] + ' Nps: ' + match[2]
                }
            }
            match = line.match(/^info .*\bscore (\w+) (-?\d+)/)
            if (match) {
                const score = parseInt(match[2], 10) * (this.chessConsole.playerWhite() === this ? 1 : -1)
                let tmpScore
                if (match[1] === 'cp') {
                    tmpScore = (score / 100.0).toFixed(1)
                } else if (match[1] === 'mate') {
                    tmpScore = '#' + Math.abs(score)
                }
                this.scoreHistory[this.model.plyCount] = tmpScore
                this.score = tmpScore
            }
        }
    }

    initWorker() {
        this.engineState = ENGINE_STATE.LOADING
        const listener = (event) => {
            this.listener(event)
        }
        if (this.engineWorker !== null) {
            this.engineWorker.removeEventListener("message", listener)
            this.engineWorker.terminate()
        }
        this.engineWorker = new Worker(this.props.worker)
        this.engineWorker.addEventListener("message", listener)

        this.loadBook()
        this.uciCmd('uci')
        this.uciCmd('ucinewgame')
        this.uciCmd('isready')
    }

    loadBook() {
        const bookRequest = new XMLHttpRequest()
        bookRequest.open('GET', this.props.book, true)
        bookRequest.responseType = "arraybuffer"
        bookRequest.onload = (() => {
            if (bookRequest.status === 200) {
                this.engineWorker.postMessage({book: bookRequest.response})
            } else {
                console.error("engine book not loaded")
            }
        })
        bookRequest.send(null)
    }

    moveRequest(fen, moveResponse) {
        this.engineState = ENGINE_STATE.THINKING
        this.moveResponse = moveResponse
        setTimeout(() => {
            if (!this.model.chess.game_over()) {
                this.uciCmd('position fen ' + this.model.chess.fen())
                this.uciCmd('go depth ' + (this.level - 1))
            }
        }, 500)
    }
}