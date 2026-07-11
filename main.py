from core.engine import ChessEngine
from core.opening_book import OpeningBook
from core.analyzer import analyse_game
from core.config import STOCKFISH_PATH
from core.config import PROJECT_ROOT
import json

def main():
    pgn_path = PROJECT_ROOT / "material" / "konteyni_vs_Snowstormme_2026.06.19.pgn"

    with open(pgn_path) as f:
        pgn_text = f.read()

    with ChessEngine(STOCKFISH_PATH) as engine, OpeningBook() as book:
        report = analyse_game(pgn_text, engine, book, game_id="abc123")

    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()