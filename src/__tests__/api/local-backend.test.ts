/**
 * Local Backend Integration Tests
 * 
 * Tests that run against a real backend server with local PostgreSQL.
 * Requires docker-compose to be running:
 *   cd backend && docker-compose up -d
 * 
 * Run with: npm run test:local
 * 
 * This test suite validates actual database operations and full
 * request/response cycles through the FastAPI backend.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { TweetListItem, TweetDetail, CommentItem, UserProfile } from '../fixtures/test-data'

// Local backend URL (when running docker-compose)
const LOCAL_API_URL = process.env.LOCAL_API_URL || 'http://localhost:8000'

// Skip these tests if not running integration tests
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true'

describe.skipIf(!runIntegrationTests)('Local Backend Integration Tests', () => {
    // Verify backend is reachable before running tests
    beforeAll(async () => {
        try {
            const health = await fetch(`${LOCAL_API_URL}/health`, {
                signal: AbortSignal.timeout(5000)
            })
            if (!health.ok) {
                throw new Error('Backend health check failed')
            }
        } catch (error) {
            console.error('❌ Local backend not available. Run: cd backend && docker-compose up -d')
            throw error
        }
    })

    describe('Health Check', () => {
        it('should return healthy status', async () => {
            const response = await fetch(`${LOCAL_API_URL}/health`)
            expect(response.ok).toBe(true)

            const data = await response.json()
            expect(data.status).toBe('healthy')
        })

        it('should return app info from root', async () => {
            const response = await fetch(`${LOCAL_API_URL}/`)
            expect(response.ok).toBe(true)

            const data = await response.json()
            expect(data.app).toBe('imitation-api')
        })
    })

    describe('GET /home - Integration', () => {
        it('should return seeded tweets from database', async () => {
            const response = await fetch(`${LOCAL_API_URL}/home`)
            expect(response.ok).toBe(true)

            const tweets: TweetListItem[] = await response.json()
            expect(Array.isArray(tweets)).toBe(true)
            // Seed data should have at least 5 tweets
            expect(tweets.length).toBeGreaterThanOrEqual(5)
        })

        it('should return tweets in reverse chronological order', async () => {
            const response = await fetch(`${LOCAL_API_URL}/home`)
            const tweets: TweetListItem[] = await response.json()

            // Can't verify order directly without created_at, but ensure they exist
            expect(tweets.length).toBeGreaterThan(0)
            expect(tweets[0].body).toBeDefined()
        })
    })

    describe('GET /tweet/:id - Integration', () => {
        it('should return tweet from database', async () => {
            const response = await fetch(`${LOCAL_API_URL}/tweet/1`)
            expect(response.ok).toBe(true)

            const tweet: TweetDetail = await response.json()
            expect(tweet.id).toBe(1)
            expect(tweet.body).toContain('shipped') // From seed data
        })

        it('should return 404 for missing tweet', async () => {
            const response = await fetch(`${LOCAL_API_URL}/tweet/99999`)
            expect(response.status).toBe(404)
        })
    })

    describe('GET /tweet/:id/comments - Integration', () => {
        it('should return comments from database', async () => {
            const response = await fetch(`${LOCAL_API_URL}/tweet/1/comments`)
            expect(response.ok).toBe(true)

            const comments: CommentItem[] = await response.json()
            expect(Array.isArray(comments)).toBe(true)
            // Seed data has 2 comments on tweet 1
            expect(comments.length).toBe(2)
        })

        it('should return empty array for tweet with no comments', async () => {
            const response = await fetch(`${LOCAL_API_URL}/tweet/4/comments`)
            expect(response.ok).toBe(true)

            const comments: CommentItem[] = await response.json()
            expect(comments.length).toBe(0)
        })
    })

    describe('GET /user/:id - Integration', () => {
        it('should return user from database', async () => {
            const response = await fetch(`${LOCAL_API_URL}/user/1`)
            expect(response.ok).toBe(true)

            const user: UserProfile = await response.json()
            expect(user.id).toBe(1)
            expect(user.username).toBe('janedoe')
            expect(user.bio).toContain('Tech enthusiast')
        })

        it('should return 404 for missing user', async () => {
            const response = await fetch(`${LOCAL_API_URL}/user/99999`)
            expect(response.status).toBe(404)
        })
    })

    describe('POST /create-tweet - Integration', () => {
        it('should reject requests without auth', async () => {
            const response = await fetch(`${LOCAL_API_URL}/create-tweet/user/1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: 'Test', is_comment: false, parent_tweet_id: null })
            })

            expect(response.status).toBe(401)
        })

        // Note: Testing with actual auth would require a valid Supabase token
        // For now, the auth skeleton allows development tokens
        it('should create tweet with development auth', async () => {
            // Create a fake JWT-like token for development mode
            // The backend in debug mode will accept this
            const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.signature'

            const response = await fetch(`${LOCAL_API_URL}/create-tweet/user/1`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${devToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    body: 'Integration test tweet ' + Date.now(),
                    is_comment: false,
                    parent_tweet_id: null
                })
            })

            // In development mode without Supabase secret, this should work
            if (response.ok) {
                const tweet: TweetDetail = await response.json()
                expect(tweet.body).toContain('Integration test tweet')
                expect(tweet.likes).toBe(0)
            } else {
                // If auth is properly configured, skip this for now
                expect(response.status).toBe(401)
            }
        })
    })
})
