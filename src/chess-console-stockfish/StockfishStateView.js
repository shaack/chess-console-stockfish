/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console-stockfish
 * License: MIT, see file 'LICENSE'
 */
import {Observe} from "../../lib/cm-web-modules/observe/Observe.js"
import {UiComponent} from "../../lib/cm-web-modules/app/UiComponent.js"
import {ENGINE_STATE} from "../../lib/cm-chess-engine-runner/EngineRunner.js"

export class StockfishStateView extends UiComponent {

    /**
     * @param chessConsole
     * @param player
     * @param props // { spinnerIcon: spinner }
     */
    constructor(chessConsole, player, props = {}) {
        super(undefined, props)
        this.chessConsole = chessConsole
        this.player = player
        const i18n = chessConsole.i18n
        if (!this.props.spinnerIcon) {
            this.props.spinnerIcon = "spinner"
        }
        this.numberFormat = new Intl.NumberFormat(i18n.locale, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })
        this.element = document.createElement("div")
        this.element.setAttribute("class", "engine-state mb-2")
        this.chessConsole.componentContainers.right.append(this.element)
        this.element.innerHTML = `<div><span class="score"></span> <span class="thinking text-muted"><i class="fas fa-${this.props.spinnerIcon} fa-spin"></i></span></div>`
        this.scoreElement = this.element.querySelector(".score")
        this.thinkingElement = this.element.querySelector(".thinking")
        this.thinkingElement.style.display = 'none'
        Observe.property(player.state, "level", () => {
            this.updatePlayerName()
        })
        Observe.property(player.state, "engineState", () => {
            // console.log("engineState", player.state.engineState)
            if (player.state.engineState === ENGINE_STATE.THINKING) {
                this.thinkingElement.style.display = ''
            } else {
                this.thinkingElement.style.display = 'none'
            }
        })
        Observe.property(player.state, "score", (event) => {
            const newScore = event.newValue
            if (newScore) {
                let scoreFormatted
                if (isNaN(newScore)) {
                    scoreFormatted = newScore
                } else {
                    scoreFormatted = this.numberFormat.format(newScore)
                }
                this.scoreElement.innerHTML = `${i18n.t("score")} ${scoreFormatted}`
            } else {
                this.scoreElement.innerHTML = ``
            }
        })
        Observe.property(this.chessConsole.state, "plyViewed", () => {
            let score = player.state.scoreHistory[this.chessConsole.state.plyViewed]
            if (!score && this.chessConsole.state.plyViewed > 0) {
                score = player.state.scoreHistory[this.chessConsole.state.plyViewed - 1]
            }
            if (score) {
                let scoreFormatted
                if (isNaN(score)) {
                    scoreFormatted = score
                } else {
                    scoreFormatted = this.numberFormat.format(score)
                }
                this.scoreElement.innerHTML = `${i18n.t("score")} ${scoreFormatted}`
            } else {
                this.scoreElement.innerHTML = ''
            }
        })
        this.updatePlayerName()
    }

    updatePlayerName() {
        this.player.name = `Stockfish ${this.chessConsole.i18n.t("level")} ${this.player.state.level}`
    }
}