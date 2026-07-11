import chess
import chess.engine
from core.config import ENGINE_DEPTH

class ChessEngine:
    def __init__(self, path, depth=ENGINE_DEPTH):
        self._engine = chess.engine.SimpleEngine.popen_uci(path)
        self.depth = depth

    def analyse(self, board):
        return self._engine.analyse(board, chess.engine.Limit(depth=self.depth))

    def close(self):
        self._engine.quit()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()