/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console-stockfish
 * License: MIT, see file 'LICENSE'
 */
import {Observe} from "../../lib/cm-web-modules/observe/Observe.js"
import {ENGINE_STATE} from "./StockfishPlayer.js"

export class StockfishStateView {

    constructor(module, props = {}) {
        this.app = module
        this.props = props
        const i18n = module.i18n
        if(!props.spinnerIcon) {
            props.spinnerIcon = "spinner"
        }
        this.numberFormat = new Intl.NumberFormat(i18n.locale, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })
        this.element = document.createElement("div")
        this.element.setAttribute("class", "engine-state mb-2")
        this.app.componentContainers.right.append(this.element)
        this.element.innerHTML = `<div><span class="score"></span> <span class="thinking text-muted"><i class="fas fa-${props.spinnerIcon} fa-spin"></i></span></div>`
        this.scoreElement = this.element.querySelector(".score")
        this.thinkingElement = this.element.querySelector(".thinking")
        this.thinkingElement.style.display = 'none'
        Observe.property(props.player, "level", () => {
            this.updatePlayerName()
        })
        Observe.property(props.player, "engineState", () => {
            if(props.player.engineState === ENGINE_STATE.THINKING) {
                this.thinkingElement.style.display = ''
            } else {
                this.thinkingElement.style.display = 'none'
            }
        })
        Observe.property(props.player, "score", () => {
            if(props.player.score) {
                let scoreFormatted
                if(props.player.score.indexOf("#") !== -1) {
                    scoreFormatted = props.player.score
                } else {
                    scoreFormatted = this.numberFormat.format(props.player.score)
                }
                this.scoreElement.innerHTML = `${i18n.t("score")} ${scoreFormatted}`
            } else {
                this.scoreElement.innerHTML = ``
            }
        })
        Observe.property(this.app.state, "plyViewed", () => {
            let score = props.player.scoreHistory[this.app.state.plyViewed]
            if (!score && this.app.state.plyViewed > 0) {
                score = props.player.scoreHistory[this.app.state.plyViewed - 1]
            }
            if (score) {
                let scoreFormatted
                if(score.indexOf("#") !== -1) {
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
        this.props.player.name = `Stockfish ${this.app.i18n.t("level")} ${this.props.player.level}`
    }
}