/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console-stockfish
 * License: MIT, see file 'LICENSE'
 */
import {Component} from "../../lib/svjs-app/Component.js"
import {Observe} from "../../lib/svjs-observe/Observe.js"

export class StockfishStateView extends Component {

    constructor(module, props) {
        super(module, props)
        const i18n = module.i18n
        this.element = document.createElement("div")
        this.element.setAttribute("class", "engine-state")
        this.module.componentContainers.controls.appendChild(this.element)
        this.element.innerHTML = `<div><span class="score">Bewertung 0.1</span> <span class="thinking text-muted"><i class="fas fa-cog fa-spin"></i></span></div>`
        this.scoreElement = this.element.querySelector(".score")
        this.thinkingElement = this.element.querySelector(".thinking")
        this.thinkingElement.style.display = 'none'
        Observe.property(props.player, "depth", () => {
            this.updatePlayerName()
        })
        this.updatePlayerName()
    }

    updatePlayerName() {
        this.props.player.name = `Stockfish ${this.module.i18n.t("level")} ${this.props.player.depth}`
    }
}