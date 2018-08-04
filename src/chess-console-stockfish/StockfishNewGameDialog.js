/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console-stockfish
 * License: MIT, see file 'LICENSE'
 */

import {COLOR} from "../../lib/cm-chesstools/ChessTools.js"

export class StockfishNewGameDialog {

    constructor(module, props) {
        this.module = module
        const i18n = module.i18n
        i18n.load({
            de: {
                color: "Farbe",
                white: "Weiss",
                black: "Schwarz",
                auto: "automatisch"
            },
            en: {
                color: "Color",
                white: "White",
                black: "Black",
                auto: "automatically"
            }
        }).then(() => {
            props.modalClass = "fade"
            props.body = `<div class="form-group row">
                        <div class="col-3"><label for="color" class="col-form-label">${i18n.t("color")}</label></div>
                        <div class="col-9"><select id="color" class="form-control">
                        <option value="auto">${i18n.t("auto")}</option>
                        <option value="w">${i18n.t("white")}</option>
                        <option value="b">${i18n.t("black")}</option>
                        </select></div>
                        </div>
                        <div class="form-group row">
                        <div class="col-3"><label for="level" class="col-form-label">${i18n.t("level")}</label></div>
                        <div class="col-9"><select id="level" class="form-control">
                        ${this.renderLevelOptions()}
                        </select></div>
                        </div>`
            props.footer = `<button type="button" class="btn btn-link" data-dismiss="modal">${i18n.t("cancel")}</button>
            <button type="submit" class="btn btn-primary">${i18n.t("ok")}</button>`
            props.onCreate = (modal) => {
                $(modal.element).on("submit", "form", function (event) {
                    event.preventDefault()
                    const $form = $(modal.element).find("form")
                    let color = $form.find("#color").val()
                    const level = $form.find("#level").val() || 1
                    if (color !== COLOR.white && color !== COLOR.black) {
                        color = (module.state.playerColor === COLOR.white) ? COLOR.black : COLOR.white
                    }
                    modal.hide()
                    module.startGame({playerColor: color, engineLevel: level})
                })
            }
            $.showModal(props)
        })
    }

    renderLevelOptions() {
        let html = ''
        const currentLevel = this.module.opponent.depth
        for (var i = 1; i <= 15; i++) {
            var selected = ''
            if (currentLevel === i) {
                selected = 'selected '
            }
            html += '<option ' + selected + 'value="' + i + '">' + i + '</option>'
        }
        return html
    }

}