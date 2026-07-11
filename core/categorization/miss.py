from core.categorization.winrate import winrate_pov
from core.config import (
    MISS_LOSS_THRESHOLD, WINNING_OPPORTUNITY,
    SAVING_OPPORTUNITY, NOT_COLLAPSED_FLOOR
)

def is_miss(prev_eval, played_move, best_move, mover, current_winrate, opportunity):
    if not opportunity['available_chance']:
        return False
    if mover != opportunity['chance_for']:
        return False
    if played_move == best_move:
        return False

    wr_best = winrate_pov(prev_eval, mover)
    wr_played = current_winrate
    loss = wr_best - wr_played

    opportunity_existed = wr_best >= SAVING_OPPORTUNITY  # 40 покрывает и 55 автоматически
    gave_up_enough = loss >= MISS_LOSS_THRESHOLD
    not_collapsed = wr_played >= NOT_COLLAPSED_FLOOR

    return opportunity_existed and gave_up_enough and not_collapsed