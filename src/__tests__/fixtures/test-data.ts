/**
 * Shared test data fixtures matching the API response shapes.
 * These are used by both MSW mocks and integration tests.
 */

export interface MockUser {
    id: number
    username: string
    bio: string | null
    profile_url: string | null
    supabase_uid?: string
}

export interface MockTweet {
    id: number
    body: string
    likes: number
    replies: number
    restacks: number
    saves: number
    user_id: number
    is_comment: boolean
    parent_tweet_id: number | null
}

// Mock users matching seed.sql
export const mockUsers: MockUser[] = [
    {
        id: 1,
        username: 'janedoe',
        bio: 'Tech enthusiast and coffee lover. Building the future one commit at a time.',
        profile_url: '/images/profile.png'
    },
    {
        id: 2,
        username: 'johndoe',
        bio: 'Software engineer by day, gamer by night. Love discussing tech trends.',
        profile_url: null
    },
    {
        id: 3,
        username: 'alice_dev',
        bio: 'Full-stack developer passionate about open source and clean code.',
        profile_url: null
    },
    {
        id: 4,
        username: 'bob_builder',
        bio: 'Creating things that matter. Focused on user experience and accessibility.',
        profile_url: null
    },
    {
        id: 5,
        username: 'charlie_coder',
        bio: 'Always learning, always building. Rust and TypeScript fanatic.',
        profile_url: null
    }
]

// Mock tweets matching seed.sql
export const mockTweets: MockTweet[] = [
    {
        id: 1,
        body: 'Just shipped a new feature! The feeling when your code works on the first try 🚀',
        likes: 245,
        replies: 2,
        restacks: 42,
        saves: 89,
        user_id: 1,
        is_comment: false,
        parent_tweet_id: null
    },
    {
        id: 2,
        body: 'Hot take: Tailwind CSS is actually amazing once you get past the initial learning curve.',
        likes: 1523,
        replies: 1,
        restacks: 156,
        saves: 423,
        user_id: 2,
        is_comment: false,
        parent_tweet_id: null
    },
    {
        id: 3,
        body: 'Starting my morning with some debugging. Any tips for hunting down race conditions? 🔍',
        likes: 89,
        replies: 2,
        restacks: 12,
        saves: 34,
        user_id: 3,
        is_comment: false,
        parent_tweet_id: null
    },
    {
        id: 4,
        body: 'The best code is the code you don\'t have to write. Embrace simplicity!',
        likes: 678,
        replies: 0,
        restacks: 89,
        saves: 234,
        user_id: 4,
        is_comment: false,
        parent_tweet_id: null
    },
    {
        id: 5,
        body: 'Just discovered that one of my side projects from 2019 is still running in production. No idea how! 😅',
        likes: 2341,
        replies: 0,
        restacks: 456,
        saves: 890,
        user_id: 5,
        is_comment: false,
        parent_tweet_id: null
    }
]

// Mock comments matching seed.sql
export const mockComments: MockTweet[] = [
    {
        id: 6,
        body: 'Congrats! What framework did you use?',
        likes: 12,
        replies: 0,
        restacks: 0,
        saves: 1,
        user_id: 2,
        is_comment: true,
        parent_tweet_id: 1
    },
    {
        id: 7,
        body: 'Nothing beats that feeling! 🎉',
        likes: 8,
        replies: 0,
        restacks: 0,
        saves: 0,
        user_id: 3,
        is_comment: true,
        parent_tweet_id: 1
    },
    {
        id: 8,
        body: 'I agree 100%! The utility-first approach is so powerful.',
        likes: 45,
        replies: 0,
        restacks: 2,
        saves: 8,
        user_id: 4,
        is_comment: true,
        parent_tweet_id: 2
    },
    {
        id: 9,
        body: 'Check out the debugging section in the Rust book, great tips there!',
        likes: 23,
        replies: 0,
        restacks: 0,
        saves: 5,
        user_id: 5,
        is_comment: true,
        parent_tweet_id: 3
    },
    {
        id: 10,
        body: 'console.log is all you need 😂',
        likes: 56,
        replies: 0,
        restacks: 1,
        saves: 12,
        user_id: 1,
        is_comment: true,
        parent_tweet_id: 3
    }
]

/**
 * Expected response shapes for frontend type checking.
 */
export interface TweetListItem {
    body: string
    likes: number
    replies: number
    restacks: number
    saves: number
    userId: string
    profileName: string
    profileUrl?: string | null
}

export interface TweetDetail extends TweetListItem {
    id: number
    is_comment: boolean
    parent_tweet_id: number | null
}

export interface CommentItem {
    userId?: string | null
    profileName?: string | null
    body?: string | null
    likes?: number | null
    replies?: number | null
    profileUrl?: string | null
}

export interface UserProfile {
    id: number
    username: string
    bio: string | null
    profile_url?: string | null
}

// ==================== FLASHCARD FIXTURES ====================

export interface MockDeck {
    id: number
    user_id: number
    name: string
    description: string | null
    card_count: number
    new_count: number
    learning_count: number
    reviewed_count: number
}

export interface MockCard {
    id: number
    deck_id: number
    front: string
    back: string
    status: 'new' | 'learning' | 'reviewed'
    review_count: number
}

export const mockDecks: MockDeck[] = [
    {
        id: 1,
        user_id: 1,
        name: 'JavaScript Basics',
        description: 'Fundamental concepts of JavaScript programming',
        card_count: 5,
        new_count: 2,
        learning_count: 2,
        reviewed_count: 1
    },
    {
        id: 2,
        user_id: 1,
        name: 'React Hooks',
        description: 'Common React hooks and their usage patterns',
        card_count: 4,
        new_count: 4,
        learning_count: 0,
        reviewed_count: 0
    },
    {
        id: 3,
        user_id: 1,
        name: 'SQL Queries',
        description: 'Essential SQL commands and syntax',
        card_count: 3,
        new_count: 3,
        learning_count: 0,
        reviewed_count: 0
    }
]

export const mockCards: MockCard[] = [
    { id: 1, deck_id: 1, front: 'What is a closure?', back: 'A function with access to outer scope variables.', status: 'reviewed', review_count: 3 },
    { id: 2, deck_id: 1, front: 'What is hoisting?', back: 'Moving declarations to the top of scope.', status: 'learning', review_count: 1 },
    { id: 3, deck_id: 1, front: 'let vs var?', back: 'let is block-scoped, var is function-scoped.', status: 'learning', review_count: 2 },
    { id: 4, deck_id: 1, front: 'What is the event loop?', back: 'Checks call stack and executes task queue callbacks.', status: 'new', review_count: 0 },
    { id: 5, deck_id: 1, front: 'What is a Promise?', back: 'Object for async operation completion.', status: 'new', review_count: 0 },
    { id: 6, deck_id: 2, front: 'useState returns?', back: '[state, setState] array', status: 'new', review_count: 0 },
    { id: 7, deck_id: 2, front: 'When does useEffect run?', back: 'After render, or when deps change.', status: 'new', review_count: 0 },
]

export interface DeckListItem {
    id: number
    name: string
    description: string | null
    card_count: number
    new_count: number
    learning_count: number
    reviewed_count: number
}

export interface CardItem {
    id: number
    deck_id: number
    front: string
    back: string
    status: string
    next_review_at: string | null
}

export interface StudyCardItem {
    id: number
    front: string
    back: string
    status: string
    review_count: number
}

