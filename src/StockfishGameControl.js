/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console-stockfish
 * License: MIT, see file 'LICENSE'
 */

import {GameControl} from "chess-console/src/components/GameControl/GameControl.js"
import {StockfishNewGameDialog} from "./StockfishNewGameDialog.js"

export class StockfishGameControl extends GameControl {
    showNewGameDialog() {
        new StockfishNewGameDialog(this.chessConsole, {
            title: this.chessConsole.i18n.t('start_game'),
            player: this.props.player
        })
    }
}
