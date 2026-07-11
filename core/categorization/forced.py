def is_forced_move(board_before):
    """Проверяет, был ли ход единственно возможным."""
    return board_before.legal_moves.count() == 1