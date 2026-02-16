-- Sevodal game results
CREATE TABLE IF NOT EXISTS sevodal_games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    word_length INTEGER NOT NULL,
    solution VARCHAR(10) NOT NULL,
    guesses JSONB NOT NULL,
    statuses JSONB NOT NULL,
    did_win BOOLEAN NOT NULL,
    num_guesses INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sevodal_user_id ON sevodal_games(user_id);
CREATE INDEX IF NOT EXISTS idx_sevodal_word_length ON sevodal_games(word_length);

-- Asteroid high scores
CREATE TABLE IF NOT EXISTS asteroid_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    player_name VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asteroid_scores_score ON asteroid_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_asteroid_scores_user_id ON asteroid_scores(user_id);
