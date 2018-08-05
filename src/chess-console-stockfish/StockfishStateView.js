/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console-stockfish
 * License: MIT, see file 'LICENSE'
 */
import {Component} from "../../lib/svjs-app/Component.js"
import {Observe} from "../../lib/svjs-observe/Observe.js"
import {ENGINE_STATE} from "./StockfishPlayer.js"

export class StockfishStateView extends Component {

    constructor(module, props) {
        super(module, props)
        const i18n = module.i18n
        this.element = document.createElement("div")
        this.element.setAttribute("class", "engine-state")
        this.module.componentContainers.controls.appendChild(this.element)
        this.element.innerHTML = `<div><span class="score"></span> <span class="thinking text-muted"><i class="fas fa-spinner fa-spin"></i></span></div>`
        this.scoreElement = this.element.querySelector(".score")
        this.thinkingElement = this.element.querySelector(".thinking")
        this.thinkingElement.style.display = 'none'
        Observe.property(props.player, "depth", () => {
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
                this.scoreElement.innerHTML = `${i18n.t("score")} ${props.player.score}`
            } else {
                this.scoreElement.innerHTML = ''
            }
        })
        Observe.property(this.module.state, "plyViewed", () => {
            let score = props.player.scoreHistory[this.module.state.plyViewed]
            if (!score && this.module.state.plyViewed > 0) {
                score = props.player.scoreHistory[this.module.state.plyViewed - 1]
            }
            if (score) {
                this.scoreElement.innerHTML = `${i18n.t("score")} ${score}`
            } else {
                this.scoreElement.innerHTML = ''
            }
        })
        this.updatePlayerName()
    }

    updatePlayerName() {
        this.props.player.name = `Stockfish ${this.module.i18n.t("level")} ${this.props.player.depth}`
    }
}