from core.categorization.winrate import calculate_winrate
from core.categorization.miss import is_miss
from core.categorization.forced import is_forced_move
from core.categorization.classic import classic_moves

def categorize_move(context, book):
    """
    Определяет категорию хода на основе всего контекста.
    `context` — dict со всем нужным (см. analyzer.py, где он собирается).
    `book` — экземпляр OpeningBook.
    """
    mover = context["mover"]
    current_winrate = calculate_winrate(context["current_eval"])
    prev_winrate = calculate_winrate(context["prev_eval"])
    mover_curr_wr = current_winrate if mover == "white" else 100 - current_winrate

    # Book
    if not context["openings_state"]["openings_ended"]:
        if book.is_book_move(context["board_before"], context["move"]):
            return "Book"
        context["openings_state"]["openings_ended"] = True

    # Forced
    if is_forced_move(context["board_before"]):
        return "Forced"

    # Miss
    if context["best_moves"] and is_miss(
        context["prev_eval"], context["move"], context["best_moves"][0],
        mover, mover_curr_wr, context["opportunity"]
    ):
        context["opportunity"]["available_chance"] = False
        context["opportunity"]["chance_for"] = None
        return "Miss"

    # Classic
    return classic_moves(
        context["move"], mover, context["best_moves"],
        current_winrate, prev_winrate, context["opportunity"]
    )