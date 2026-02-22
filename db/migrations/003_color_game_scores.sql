-- Color grid multiplayer game scores
CREATE TABLE IF NOT EXISTS color_game_scores (
    id SERIAL PRIMARY KEY,
    room_code VARCHAR(20) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('clue_maker', 'guesser')),
    points INTEGER NOT NULL DEFAULT 0,
    guess_number INTEGER,
    target_cell VARCHAR(5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_color_game_room ON color_game_scores(room_code);
