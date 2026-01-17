/**
 * Mock Backend Tests
 * 
 * Tests that use MSW (Mock Service Worker) to intercept HTTP requests.
 * These tests are fast, require no external dependencies, and validate 
 * that API response shapes match frontend expectations.
 * 
 * Run with: npm run test:mock
 */

import { describe, it, expect } from 'vitest'
import { mockUsers, mockTweets, mockComments } from '../fixtures/test-data'
import type { TweetListItem, TweetDetail, CommentItem, UserProfile } from '../fixtures/test-data'

// Use the same API URL as the MSW handlers
const API_BASE = 'https://go-example-bitter-cherry-6166.fly.dev'

describe('Mock Backend API Tests', () => {
    describe('GET /home', () => {
        it('should return an array of tweets', async () => {
            const response = await fetch(`${API_BASE}/home`)
            expect(response.ok).toBe(true)

            const tweets: TweetListItem[] = await response.json()
            expect(Array.isArray(tweets)).toBe(true)
            expect(tweets.length).toBeGreaterThan(0)
        })

        it('should return tweets with correct shape', async () => {
            const response = await fetch(`${API_BASE}/home`)
            const tweets: TweetListItem[] = await response.json()

            // Validate first tweet has all required fields
            const tweet = tweets[0]
            expect(tweet).toHaveProperty('body')
            expect(tweet).toHaveProperty('likes')
            expect(tweet).toHaveProperty('replies')
            expect(tweet).toHaveProperty('restacks')
            expect(tweet).toHaveProperty('saves')
            expect(tweet).toHaveProperty('userId')
            expect(tweet).toHaveProperty('profileName')

            // Type validation
            expect(typeof tweet.body).toBe('string')
            expect(typeof tweet.likes).toBe('number')
            expect(typeof tweet.replies).toBe('number')
            expect(typeof tweet.userId).toBe('string')
        })

        it('should not include comments in home feed', async () => {
            const response = await fetch(`${API_BASE}/home`)
            const tweets: TweetListItem[] = await response.json()

            // Home feed should only have main tweets, not comments
            const expectedCount = mockTweets.filter(t => !t.is_comment).length
            expect(tweets.length).toBe(expectedCount)
        })
    })

    describe('GET /tweet/:id', () => {
        it('should return a single tweet by ID', async () => {
            const response = await fetch(`${API_BASE}/tweet/1`)
            expect(response.ok).toBe(true)

            const tweet: TweetDetail = await response.json()
            expect(tweet.id).toBe(1)
            expect(tweet.body).toBeDefined()
        })

        it('should return 404 for non-existent tweet', async () => {
            const response = await fetch(`${API_BASE}/tweet/9999`)
            expect(response.status).toBe(404)
        })

        it('should return tweet with detail fields', async () => {
            const response = await fetch(`${API_BASE}/tweet/1`)
            const tweet: TweetDetail = await response.json()

            expect(tweet).toHaveProperty('id')
            expect(tweet).toHaveProperty('is_comment')
            expect(tweet).toHaveProperty('parent_tweet_id')
            expect(tweet.is_comment).toBe(false)
            expect(tweet.parent_tweet_id).toBeNull()
        })
    })

    describe('GET /tweet/:id/comments', () => {
        it('should return comments for a tweet', async () => {
            const response = await fetch(`${API_BASE}/tweet/1/comments`)
            expect(response.ok).toBe(true)

            const comments: CommentItem[] = await response.json()
            expect(Array.isArray(comments)).toBe(true)
        })

        it('should return correct number of comments', async () => {
            const response = await fetch(`${API_BASE}/tweet/1/comments`)
            const comments: CommentItem[] = await response.json()

            const expectedCount = mockComments.filter(c => c.parent_tweet_id === 1).length
            expect(comments.length).toBe(expectedCount)
        })

        it('should return 404 for non-existent parent tweet', async () => {
            const response = await fetch(`${API_BASE}/tweet/9999/comments`)
            expect(response.status).toBe(404)
        })

        it('should return comments with correct shape', async () => {
            const response = await fetch(`${API_BASE}/tweet/1/comments`)
            const comments: CommentItem[] = await response.json()

            if (comments.length > 0) {
                const comment = comments[0]
                expect(comment).toHaveProperty('userId')
                expect(comment).toHaveProperty('profileName')
                expect(comment).toHaveProperty('body')
                expect(comment).toHaveProperty('likes')
            }
        })
    })

    describe('POST /create-tweet/user/:userId', () => {
        it('should require authorization header', async () => {
            const response = await fetch(`${API_BASE}/create-tweet/user/1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: 'Test tweet', is_comment: false, parent_tweet_id: null })
            })

            expect(response.status).toBe(401)
        })

        it('should create tweet with valid auth', async () => {
            const response = await fetch(`${API_BASE}/create-tweet/user/1`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer fake-token-for-testing',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    body: 'Test tweet from mock test',
                    is_comment: false,
                    parent_tweet_id: null
                })
            })

            expect(response.status).toBe(201)

            const tweet: TweetDetail = await response.json()
            expect(tweet.body).toBe('Test tweet from mock test')
            expect(tweet.is_comment).toBe(false)
            expect(tweet.likes).toBe(0)
        })

        it('should create comment with valid auth', async () => {
            const response = await fetch(`${API_BASE}/create-tweet/user/1`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer fake-token-for-testing',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    body: 'Test comment',
                    is_comment: true,
                    parent_tweet_id: 1
                })
            })

            expect(response.status).toBe(201)

            const tweet: TweetDetail = await response.json()
            expect(tweet.is_comment).toBe(true)
            expect(tweet.parent_tweet_id).toBe(1)
        })
    })

    describe('GET /user/:id', () => {
        it('should return user profile', async () => {
            const response = await fetch(`${API_BASE}/user/1`)
            expect(response.ok).toBe(true)

            const user: UserProfile = await response.json()
            expect(user.id).toBe(1)
            expect(user.username).toBe('janedoe')
        })

        it('should return 404 for non-existent user', async () => {
            const response = await fetch(`${API_BASE}/user/9999`)
            expect(response.status).toBe(404)
        })

        it('should return user with correct shape', async () => {
            const response = await fetch(`${API_BASE}/user/1`)
            const user: UserProfile = await response.json()

            expect(user).toHaveProperty('id')
            expect(user).toHaveProperty('username')
            expect(user).toHaveProperty('bio')

            expect(typeof user.id).toBe('number')
            expect(typeof user.username).toBe('string')
        })
    })
})
