import { http, HttpResponse } from 'msw'
import { mockUsers, mockTweets, mockComments } from '../fixtures/test-data'

// Base URL for API - defaults to local backend
const API_BASE = process.env.TEST_API_URL || 'https://go-example-bitter-cherry-6166.fly.dev'

export const handlers = [
    // GET /home - Get all tweets
    http.get(`${API_BASE}/home`, () => {
        const tweets = mockTweets
            .filter(t => !t.is_comment)
            .map(tweet => {
                const author = mockUsers.find(u => u.id === tweet.user_id)
                return {
                    body: tweet.body,
                    likes: tweet.likes,
                    replies: tweet.replies,
                    restacks: tweet.restacks,
                    saves: tweet.saves,
                    userId: author?.username || 'unknown',
                    profileName: author?.username || 'Unknown User',
                    profileUrl: author?.profile_url || null
                }
            })
        return HttpResponse.json(tweets)
    }),

    // GET /tweet/:id - Get single tweet
    http.get(`${API_BASE}/tweet/:tweetId`, ({ params }) => {
        const tweetId = parseInt(params.tweetId as string)
        const tweet = mockTweets.find(t => t.id === tweetId)

        if (!tweet) {
            return HttpResponse.json({ detail: 'Tweet not found' }, { status: 404 })
        }

        const author = mockUsers.find(u => u.id === tweet.user_id)
        return HttpResponse.json({
            id: tweet.id,
            body: tweet.body,
            likes: tweet.likes,
            replies: tweet.replies,
            restacks: tweet.restacks,
            saves: tweet.saves,
            userId: author?.username || 'unknown',
            profileName: author?.username || 'Unknown User',
            profileUrl: author?.profile_url || null,
            is_comment: tweet.is_comment,
            parent_tweet_id: tweet.parent_tweet_id
        })
    }),

    // GET /tweet/:id/comments - Get tweet comments
    http.get(`${API_BASE}/tweet/:tweetId/comments`, ({ params }) => {
        const tweetId = parseInt(params.tweetId as string)
        const parentExists = mockTweets.some(t => t.id === tweetId && !t.is_comment)

        if (!parentExists) {
            return HttpResponse.json({ detail: 'Tweet not found' }, { status: 404 })
        }

        const comments = mockComments
            .filter(c => c.parent_tweet_id === tweetId)
            .map(comment => {
                const author = mockUsers.find(u => u.id === comment.user_id)
                return {
                    userId: author?.username || null,
                    profileName: author?.username || null,
                    body: comment.body,
                    likes: comment.likes,
                    replies: comment.replies,
                    profileUrl: author?.profile_url || null
                }
            })

        return HttpResponse.json(comments)
    }),

    // POST /create-tweet/user/:userId - Create tweet
    http.post(`${API_BASE}/create-tweet/user/:userId`, async ({ params, request }) => {
        const authHeader = request.headers.get('Authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return HttpResponse.json(
                { detail: 'Authorization header required' },
                { status: 401 }
            )
        }

        const body = await request.json() as { body: string; is_comment: boolean; parent_tweet_id: number | null }
        const newTweet = {
            id: mockTweets.length + 1,
            body: body.body,
            likes: 0,
            replies: 0,
            restacks: 0,
            saves: 0,
            userId: 'testuser',
            profileName: 'Test User',
            profileUrl: null,
            is_comment: body.is_comment,
            parent_tweet_id: body.parent_tweet_id
        }

        return HttpResponse.json(newTweet, { status: 201 })
    }),

    // GET /user/:id - Get user profile
    http.get(`${API_BASE}/user/:userId`, ({ params }) => {
        const userId = parseInt(params.userId as string)
        const user = mockUsers.find(u => u.id === userId)

        if (!user) {
            return HttpResponse.json({ detail: 'User not found' }, { status: 404 })
        }

        return HttpResponse.json({
            id: user.id,
            username: user.username,
            bio: user.bio,
            profile_url: user.profile_url
        })
    })
]
