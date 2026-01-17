-- Seed data for local development and testing
-- Run this after init.sql to populate test data

-- Clear existing data (for repeated runs)
TRUNCATE tweets CASCADE;
TRUNCATE users CASCADE;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE tweets_id_seq RESTART WITH 1;

-- Insert test users
INSERT INTO users (username, bio, profile_url) VALUES
    ('janedoe', 'Tech enthusiast and coffee lover. Building the future one commit at a time.', '/images/profile.png'),
    ('johndoe', 'Software engineer by day, gamer by night. Love discussing tech trends.', NULL),
    ('alice_dev', 'Full-stack developer passionate about open source and clean code.', NULL),
    ('bob_builder', 'Creating things that matter. Focused on user experience and accessibility.', NULL),
    ('charlie_coder', 'Always learning, always building. Rust and TypeScript fanatic.', NULL);

-- Insert test tweets
INSERT INTO tweets (body, likes, replies, restacks, saves, user_id, is_comment, parent_tweet_id) VALUES
    ('Just shipped a new feature! The feeling when your code works on the first try 🚀', 245, 18, 42, 89, 1, FALSE, NULL),
    ('Hot take: Tailwind CSS is actually amazing once you get past the initial learning curve.', 1523, 234, 156, 423, 2, FALSE, NULL),
    ('Starting my morning with some debugging. Any tips for hunting down race conditions? 🔍', 89, 45, 12, 34, 3, FALSE, NULL),
    ('The best code is the code you don''t have to write. Embrace simplicity!', 678, 56, 89, 234, 4, FALSE, NULL),
    ('Just discovered that one of my side projects from 2019 is still running in production. No idea how! 😅', 2341, 178, 456, 890, 5, FALSE, NULL),
    ('TypeScript has completely changed how I think about JavaScript. Static types FTW!', 432, 67, 34, 156, 1, FALSE, NULL),
    ('Working on a new open source project. Can''t wait to share it with you all!', 156, 23, 18, 45, 2, FALSE, NULL),
    ('Coffee count today: ☕☕☕☕ Productivity level: 📈', 789, 34, 56, 123, 3, FALSE, NULL);

-- Insert test comments
INSERT INTO tweets (body, likes, replies, restacks, saves, user_id, is_comment, parent_tweet_id) VALUES
    ('Congrats! What framework did you use?', 12, 2, 0, 1, 2, TRUE, 1),
    ('Nothing beats that feeling! 🎉', 8, 0, 0, 0, 3, TRUE, 1),
    ('I agree 100%! The utility-first approach is so powerful.', 45, 3, 2, 8, 4, TRUE, 2),
    ('Check out the debugging section in the Rust book, great tips there!', 23, 1, 0, 5, 5, TRUE, 3),
    ('console.log is all you need 😂', 56, 4, 1, 12, 1, TRUE, 3);

-- Update reply counts to match actual comments
UPDATE tweets SET replies = (SELECT COUNT(*) FROM tweets t2 WHERE t2.parent_tweet_id = tweets.id);

-- ==================== FLASHCARD SEED DATA ====================

-- Clear existing flashcard data (for repeated runs)
TRUNCATE study_queue CASCADE;
TRUNCATE cards CASCADE;
TRUNCATE decks CASCADE;

-- Reset flashcard sequences
ALTER SEQUENCE decks_id_seq RESTART WITH 1;
ALTER SEQUENCE cards_id_seq RESTART WITH 1;
ALTER SEQUENCE study_queue_id_seq RESTART WITH 1;

-- Insert test decks for user 1 (janedoe)
INSERT INTO decks (user_id, name, description) VALUES
    (1, 'JavaScript Basics', 'Fundamental concepts of JavaScript programming'),
    (1, 'React Hooks', 'Common React hooks and their usage patterns'),
    (1, 'SQL Queries', 'Essential SQL commands and syntax');

-- Insert test cards for JavaScript Basics deck (id=1)
INSERT INTO cards (deck_id, front, back) VALUES
    (1, 'What is a closure?', 'A closure is a function that has access to its outer function''s variables even after the outer function has returned.'),
    (1, 'What is hoisting?', 'JavaScript''s default behavior of moving declarations to the top of the current scope.'),
    (1, 'What is the difference between let and var?', 'let is block-scoped while var is function-scoped. let also doesn''t hoist to undefined.'),
    (1, 'What is the event loop?', 'The event loop continuously checks if the call stack is empty and executes callbacks from the task queue.'),
    (1, 'What is a Promise?', 'An object representing the eventual completion or failure of an asynchronous operation.');

-- Insert test cards for React Hooks deck (id=2)
INSERT INTO cards (deck_id, front, back) VALUES
    (2, 'What does useState return?', 'An array with the current state value and a function to update it: [state, setState]'),
    (2, 'When does useEffect run?', 'After every render by default, or when dependencies change if a dependency array is provided.'),
    (2, 'What is useCallback used for?', 'Memoizing callback functions to prevent unnecessary re-renders in child components.'),
    (2, 'What is the difference between useMemo and useCallback?', 'useMemo memoizes a computed value, useCallback memoizes a function.');

-- Insert test cards for SQL Queries deck (id=3)
INSERT INTO cards (deck_id, front, back) VALUES
    (3, 'What does SELECT DISTINCT do?', 'Returns only unique/different values, eliminating duplicate rows from the result set.'),
    (3, 'What is a JOIN?', 'A clause used to combine rows from two or more tables based on a related column.'),
    (3, 'What is the difference between WHERE and HAVING?', 'WHERE filters rows before grouping, HAVING filters groups after GROUP BY.');

-- Insert some study progress for testing (mix of statuses)
INSERT INTO study_queue (card_id, user_id, status, next_review_at, last_reviewed_at, review_count) VALUES
    (1, 1, 'reviewed', NOW() + INTERVAL '1 day', NOW() - INTERVAL '1 hour', 3),
    (2, 1, 'learning', NOW() + INTERVAL '30 minutes', NOW() - INTERVAL '15 minutes', 1),
    (3, 1, 'learning', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '1 hour', 2);

