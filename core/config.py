from pathlib import Path


# Пороги категоризации (в единицах win-rate, 0..100)
MISS_LOSS_THRESHOLD = 12
WINNING_OPPORTUNITY = 55
SAVING_OPPORTUNITY = 40
NOT_COLLAPSED_FLOOR = 45

# Пороги классической категоризации
BEST_WINRATE_MAX_LOSS = 0
EXCELLENT_WINRATE_MAX_LOSS = 2
GOOD_WINRATE_MAX_LOSS = 5
INACCURACY_WINRATE_MAX_LOSS = 10
MISTAKE_WINRATE_MAX_LOSS = 20

# Настройки движка
ENGINE_DEPTH = 16


# Path(__file__) — путь к самому config.py
# .parent — папка, где он лежит (core/)
# .parent ещё раз — корень проекта (chess-review-bot/)
PROJECT_ROOT = Path(__file__).parent.parent

# Теперь все пути строятся АБСОЛЮТНО, от корня проекта
STOCKFISH_PATH = "/opt/homebrew/Cellar/stockfish/18/bin/stockfish"  # системный, не проектный
BOOK_PATH = PROJECT_ROOT / "material" / "rodent.bin"
OPENINGS_TSV_PATH = PROJECT_ROOT / "material" / "all.tsv"