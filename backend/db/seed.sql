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
