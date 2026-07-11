import chess
import chess.pgn
from core.categorization.categorize import categorize_move

def analyse_game(pgn_text, engine, book, game_id="unknown"):
    """
    Анализирует партию из PGN и возвращает отчёт.
    Не открывает файлы, не печатает — чистая функция от текста PGN к словарю.
    """
    import io
    game = chess.pgn.read_game(io.StringIO(pgn_text))
    board = game.board()

    report = {
        "game_id": game_id,
        "opening": None,
        "moves": [],
        "eval_history": [],
    }

    openings_state = {"openings_ended": False}
    opportunity = {"available_chance": False, "chance_for": None}

    info = engine.analyse(board)
    prev_eval = info["score"].white().score(mate_score=10000)

    for move in game.mainline_moves():
        mover = "white" if board.turn else "black"
        move_number = board.fullmove_number
        best_moves = info["pv"]
        board_before = board.copy()

        board.push(move)

        info = engine.analyse(board)
        current_eval = info["score"].white().score(mate_score=10000)

        # Обновляем opening, если позиция ещё имеет имя
        opening_name = book.get_name(board_before)
        if opening_name is not None:
            report["opening"] = opening_name

        context = {
            "board_before": board_before,
            "move": move,
            "mover": mover,
            "best_moves": best_moves,
            "current_eval": current_eval,
            "prev_eval": prev_eval,
            "openings_state": openings_state,
            "opportunity": opportunity,
        }
        category = categorize_move(context, book)

        report["moves"].append({
            "move_number": move_number,
            "move": move.uci(),
            "mover": mover,
            "to_move": "white" if board.turn else "black",
            "mate_in": info["score"].white().mate() if info["score"].is_mate() else None,
            "evaluation": current_eval,
            "category": category,
            "fen": board.fen(),
        })
        report["eval_history"].append(current_eval)

        prev_eval = current_eval

    return report