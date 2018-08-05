/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console-stockfish
 * License: MIT, see file 'LICENSE'
 */

import {ChessConsolePlayer} from "../../lib/chess-console/ChessConsolePlayer.js"
import {Observe} from "../../lib/svjs-observe/Observe.js"

export const ENGINE_STATUS = {LOADING: "LOADING", LOADED: "LOADED", READY: "READY", RUNNING: "RUNNING"};

export class StockfishPlayer extends ChessConsolePlayer {

    constructor(name, chessConsole, props) {
        super(name, chessConsole, props)

        this.engineWorker = null
        this.model = chessConsole.state
        this.depth = 1
        this.scoreHistory = {}
        this.score = null
        this.i18n = chessConsole.i18n
        this.i18n.load({
            de: {
                level: "Stufe"
            },
            en: {
                level: "level"
            }
        })

        // const $chessConsoleElement = $(chessConsole.element)

        // this.$engineStatusView = $chessConsoleElement.find(".engine-status")
        // this.engineStatus = ENGINE_STATUS.LOADING

        Observe.property(this, "depth", () => {
            this.updateName()
        })
        this.updateName()

        // player bar
        // Observe.property(this, "name", this.redrawPlayerBar.bind(this));
        // Observe.property(this, "depth", this.redrawPlayerBar.bind(this));
        // status
        /* TODO:
        if (this.$engineStatusView) {
            Observe.property(this, "score", this.redrawStatus.bind(this))
            Observe.property(this, "engineStatus", this.redrawStatus.bind(this))
        }*/
        this.initWorker()
    }

    updateName() {
        this.name = `Stockfish ${this.i18n.t("level")} ${this.depth}`
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
/*
    redrawPlayerBar() {
        this.$playerBar.html(this.name + " " + _t.level + " " + (this.depth))
    }

    redrawStatus() {
        let output = ""
        if (this.score) {
            output += _t.score + " " + this.score
        }
        if (this.engineStatus === ENGINE_STATUS.RUNNING) {
            output += ' <i class="fa fa-spinner fa-pulse fa-fw"></i>'
        }
        this.$engineStatusView.html(output)
    }
*/
    uciCmd(cmd) {
        console.log("uciCmd", cmd)
        this.engineWorker.postMessage(cmd)
    }

    listener(event) {
        // console.log("listener", event)
        const line = event.data
        if (line === 'uciok') {
            this.engineStatus = ENGINE_STATUS.LOADED
        } else if (line === 'readyok') {
            this.engineStatus = ENGINE_STATUS.READY
        } else {
            let match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbk])? ponder ([a-h][1-8])?([a-h][1-8])?/)
            if (match) {
                this.engineStatus = ENGINE_STATUS.READY
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
                    this.engineStatus = ENGINE_STATUS.RUNNING
                    this.search = 'Depth: ' + match[1] + ' Nps: ' + match[2]
                }
            }
            match = line.match(/^info .*\bscore (\w+) (-?\d+)/)
            if (match) {
                const score = parseInt(match[2], 10) * (this.chessConsole.playerWhite() === this ? 1 : -1)
                if (match[1] === 'cp') {
                    this.score = (score / 100.0).toFixed(2)
                } else if (match[1] === 'mate') {
                    this.score = '#' + Math.abs(score)
                }
                const ply = this.model.ply
                this.scoreHistory[ply] = this.score
            }
        }
    }

    initWorker() {
        this.engineStatus = ENGINE_STATUS.LOADING
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
        console.log("moveRequest", fen)
        this.engineStatus = ENGINE_STATUS.RUNNING
        this.moveResponse = moveResponse
        setTimeout(() => {
            if (!this.model.chess.game_over()) {
                this.uciCmd('position fen ' + this.model.chess.fen())
                this.uciCmd('go depth ' + this.depth)
            }
        }, 500)
    }
}