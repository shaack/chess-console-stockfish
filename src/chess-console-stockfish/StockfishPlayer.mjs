/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console-stockfish
 * License: MIT, see file 'LICENSE'
 */

import {ChessConsolePlayer} from "../../lib/chess-console/ChessConsolePlayer.mjs"
import {Observe} from "../../lib/cm-web-modules/observe/Observe.mjs"
import {messageBrokerTopics} from "../../lib/chess-console/ChessConsole.mjs"

export const ENGINE_STATE = {
    LOADING: 1,
    LOADED: 2,
    READY: 3,
    THINKING: 4
}

const LEVEL_DEPTH = {
    1: 0,
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    7: 7,
    8: 10,
    9: 13,
    10: 16
}

export class StockfishPlayer extends ChessConsolePlayer {

    constructor(chessConsole, name, props) {
        super(chessConsole, name, props)

        this.engineWorker = null
        this.props = props
        this.model = chessConsole.state
        this.level = props.level ? props.level : 1
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
        this.chessConsole.messageBroker.subscribe(messageBrokerTopics.newGame, (data) => {
            if(data.props.engineLevel) {
                this.level = data.props.engineLevel
            }
        })
        this.chessConsole.messageBroker.subscribe(messageBrokerTopics.load, () => {
            if(this.chessConsole.persistence.loadValue("level")) {
                this.level = parseInt(this.chessConsole.persistence.loadValue("level"), 10)
            }
            if(this.chessConsole.persistence.loadValue("scoreHistory")) {
                this.scoreHistory = this.chessConsole.persistence.loadValue("scoreHistory")
                let score = this.scoreHistory[this.chessConsole.state.plyViewed]
                if (!score && this.chessConsole.state.plyViewed > 0) {
                    score = this.scoreHistory[this.chessConsole.state.plyViewed - 1]
                }
                this.score = score
            }
        })
        this.chessConsole.messageBroker.subscribe(messageBrokerTopics.newGame, () => {
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

    uciCmd(cmd) {
        if(this.props.debug) {
            console.log("uciCmd", cmd)
        }
        this.engineWorker.postMessage(cmd)
    }

    workerListener(event) {
        if(this.props.debug) {
            console.log("workerListener event", event)
        }
        const line = event.data
        if (line === 'uciok') {
            this.engineState = ENGINE_STATE.LOADED
        } else if (line === 'readyok') {
            this.engineState = ENGINE_STATE.READY
        } else {
            let match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbk])?/)
            // let match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbk])? ponder ([a-h][1-8])?([a-h][1-8])?/)
            if (match) {
                this.engineState = ENGINE_STATE.READY
                /*
                if (match[4] !== undefined) {
                    this.ponder = {from: match[4], to: match[5]}
                } else {
                    this.ponder = undefined
                }
                */
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
            this.workerListener(event)
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
        if(this.props.debug) {
            console.log("moveRequest", fen)
        }
        this.engineState = ENGINE_STATE.THINKING
        this.moveResponse = moveResponse
        const timeout = 1000    // https://www.reddit.com/r/ProgrammerHumor/comments/6xwely/from_the_apple_chess_engine_code/
                                // https://opensource.apple.com/source/Chess/Chess-347/Sources/MBCEngine.mm.auto.html
        setTimeout(() => {
            if (!this.model.chess.gameOver()) {
                this.uciCmd('position fen ' + fen)
                this.uciCmd('go depth ' + (LEVEL_DEPTH[this.level]))
            }
        }, timeout)
    }
}