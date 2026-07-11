import math

def calculate_winrate(cp):
    """Конвертирует centipawn-оценку в win-rate (0-100%)."""
    return 50 + 50 * (2 / (1 + math.exp(-0.004 * cp)) - 1)

def winrate_pov(cp_white, mover):
    """Возвращает win-rate с точки зрения указанного игрока."""
    wr_white = calculate_winrate(cp_white)
    return wr_white if mover == "white" else 100 - wr_white