from core.config import (
    EXCELLENT_WINRATE_MAX_LOSS, GOOD_WINRATE_MAX_LOSS,
    INACCURACY_WINRATE_MAX_LOSS, MISTAKE_WINRATE_MAX_LOSS
)

def classic_moves(move, mover, best_moves, current_winrate, prev_winrate, opportunity):
    if mover == "white":
        winrate_change = prev_winrate - current_winrate
        opponent = "black"
    else:
        winrate_change = current_winrate - prev_winrate
        opponent = "white"

    if move == best_moves[0]:
        return "Best"
    if winrate_change <= EXCELLENT_WINRATE_MAX_LOSS:
        return "Excellent"
    if winrate_change <= GOOD_WINRATE_MAX_LOSS:
        return "Good"
    if winrate_change <= INACCURACY_WINRATE_MAX_LOSS:
        return "Inaccuracy"
    if winrate_change <= MISTAKE_WINRATE_MAX_LOSS:
        opportunity["available_chance"] = True
        opportunity["chance_for"] = opponent
        return "Mistake"

    opportunity["available_chance"] = True
    opportunity["chance_for"] = opponent
    return "Blunder"