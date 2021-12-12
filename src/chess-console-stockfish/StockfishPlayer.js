/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console-stockfish
 * License: MIT, see file 'LICENSE'
 */

import {ChessConsolePlayer} from "../../lib/chess-console/ChessConsolePlayer.js"
import {Observe} from "../../lib/cm-web-modules/observe/Observe.js"
import {consoleMessageTopics} from "../../lib/chess-console/ChessConsole.js"
import {PolyglotRunner} from "../../lib/cm-chess-engine-runner/PolyglotRunner.js"
import {ENGINE_STATE} from "../../lib/cm-chess-engine-runner/EngineRunner.js"
import {StockfishRunner} from "../../lib/cm-chess-engine-runner/StockfishRunner.js"
// import {COLOR} from "../../lib/cm-chess/Chess.js"

export class StockfishPlayer extends ChessConsolePlayer {

    constructor(chessConsole, name, props) {
        super(chessConsole, name, props)
        this.polyglotRunner = new PolyglotRunner({bookUrl: props.book, responseDelay: 1000})
        this.stockfishRunner = new StockfishRunner({workerUrl: props.worker, debug: true, responseDelay: 2000})
        this.state = {
            scoreHistory: {},
            score: null,
            level: props.level,
            engineState: ENGINE_STATE.LOADING,
            currentRunner: this.polyglotRunner
        }
        this.initialisation = Promise.all([this.polyglotRunner.initialization, this.stockfishRunner.initialization])
        this.initialisation.then(() => {
            this.state.engineState = ENGINE_STATE.LOADED
        })

        this.i18n = chessConsole.i18n
        this.i18n.load({
            de: {
                score: "Bewertung",
                level: "Stufe"
            },
            en: {
                score: "Ccore",
                level: "Level"
            }
        })

        this.chessConsole.messageBroker.subscribe(consoleMessageTopics.load, () => {
            if (this.chessConsole.persistence.loadValue("level")) {
                this.state.level = parseInt(this.chessConsole.persistence.loadValue("level"), 10)
            }
            if (this.chessConsole.persistence.loadValue("scoreHistory")) {
                this.state.scoreHistory = this.chessConsole.persistence.loadValue("scoreHistory")
                let score = this.state.scoreHistory[this.chessConsole.state.plyViewed]
                if (!score && this.chessConsole.state.plyViewed > 0) {
                    score = this.state.scoreHistory[this.chessConsole.state.plyViewed - 1]
                }
                this.state.score = score
            }
        })
        this.chessConsole.messageBroker.subscribe(consoleMessageTopics.newGame, () => {
            this.state.scoreHistory = {}
            this.state.score = 0
        })
        this.chessConsole.messageBroker.subscribe(consoleMessageTopics.initGame, (data) => {
            if (data.props.engineLevel) {
                this.state.level = data.props.engineLevel
            }
            this.state.currentRunner = this.polyglotRunner
        })
        Observe.property(this.state, "level", () => {
            this.chessConsole.persistence.saveValue("level", this.state.level)
        })
        Observe.property(this.state, "score", () => {
            this.chessConsole.persistence.saveValue("score", this.state.score)
            this.chessConsole.persistence.saveValue("scoreHistory", this.state.scoreHistory)
        })
    }

    moveRequest(fen, moveResponse) {
        if (this.props.debug) {
            console.log("moveRequest", fen)
        }
        this.initialisation.then(async () => {
            this.state.engineState = ENGINE_STATE.THINKING
            let nextMove = await this.state.currentRunner.calculateMove(fen, {level: this.state.level })
            if (!nextMove) {
                if (this.props.debug) {
                    console.log("no move found with", this.state.currentRunner.constructor.name)
                }
                if (this.state.currentRunner === this.polyglotRunner) {
                    this.state.currentRunner = this.stockfishRunner
                    this.moveRequest(fen, moveResponse)
                } else {
                    throw new Error("can't find move with fen " + fen + " and runner " + this.state.currentRunner)
                }
            } else {
                if (this.props.debug) {
                    console.log("nextMove", nextMove, this.state.currentRunner.constructor.name)
                }
                let newScore = undefined
                if (nextMove.score !== undefined) {
                    if(!isNaN(nextMove.score)) {
                        // newScore = this.chessConsole.props.playerColor === COLOR.white ? -nextMove.score : nextMove.score
                        newScore = -nextMove.score
                    } else {
                        newScore = nextMove.score
                    }
                    this.state.scoreHistory[this.chessConsole.state.chess.plyCount()] = newScore
                    this.state.score = newScore
                } else {
                    this.state.score = undefined
                }
                this.state.engineState = ENGINE_STATE.READY
                moveResponse(nextMove)
            }
        })
    }
}