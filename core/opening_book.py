import csv
import chess.polyglot
from core.config import BOOK_PATH, OPENINGS_TSV_PATH

class OpeningBook:
    def __init__(self, book_path=BOOK_PATH, tsv_path=OPENINGS_TSV_PATH):
        self._reader = chess.polyglot.open_reader(book_path)
        self._names = self._load_names(tsv_path)

    def _load_names(self, path):
        names = {}
        with open(path, newline='', encoding='utf-8') as f:
            for row in csv.DictReader(f, delimiter='\t'):
                names[row['epd']] = row['name']
        return names

    def is_book_move(self, board, move):
        """
        Проверяет, входит ли `move` в теорию дебютов для текущей позиции `board`.
        `board` должна быть в состоянии ДО хода.
        """
        continuations = [c.move for c in self._reader.find_all(board)]
        return move in continuations

    def get_name(self, board):
        """Возвращает название дебюта для позиции или None, если не найдено."""
        return self._names.get(board.epd())

    def close(self):
        self._reader.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()