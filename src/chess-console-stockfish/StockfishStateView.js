/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console-stockfish
 * License: MIT, see file 'LICENSE'
 */
import {Component} from "../../lib/svjs-app/Component.js"

export class StockfishStateView extends Component {

    constructor(module) {
        super(module)
        const i18n = module.i18n
        this.element = document.createElement("div")
        this.element.setAttribute("class", "engine-state")
        this.module.componentContainers.controls.appendChild(this.element)
        this.element.innerHTML = `<div class="level">Stockfish ${i18n.t("level")} 1</div>
                                  <div><span class="score">Bewertung 0.1</span> <span class="thinking text-muted"><i class="fas fa-cog fa-spin"></i></span></div>`
    }

}