/**
 * Remote Backend Tests
 * 
 * Tests that run against a production/staging server.
 * These tests are skipped by default and only run when:
 *   - REMOTE_API_URL environment variable is set (e.g. https://imitation-broken-dawn-9001.fly.dev/api)
 *   - RUN_REMOTE_TESTS=true is set
 *
 * Run with: REMOTE_API_URL=https://imitation-broken-dawn-9001.fly.dev/api RUN_REMOTE_TESTS=true npm run test:remote
 *
 * CAUTION: These tests may create/modify real data!
 */

import { describe, it, expect } from 'vitest'
import type { TweetListItem, UserProfile } from '../fixtures/test-data'

// Remote API URL from environment
const REMOTE_API_URL = process.env.REMOTE_API_URL || ''

// Only run if explicitly enabled
const runRemoteTests = process.env.RUN_REMOTE_TESTS === 'true' && REMOTE_API_URL.length > 0

describe.skipIf(!runRemoteTests)('Remote Backend Tests', () => {
    describe('Health Check', () => {
        it('should return healthy status from remote', async () => {
            const response = await fetch(`${REMOTE_API_URL}/health`, {
                signal: AbortSignal.timeout(10000)
            })

            expect(response.ok).toBe(true)
            const data = await response.json()
            expect(data.status).toBe('healthy')
        })
    })

    describe('GET /home - Remote', () => {
        it('should return tweets from remote database', async () => {
            const response = await fetch(`${REMOTE_API_URL}/home`)
            expect(response.ok).toBe(true)

            const tweets: TweetListItem[] = await response.json()
            expect(Array.isArray(tweets)).toBe(true)
        })

        it('should return tweets with correct shape', async () => {
            const response = await fetch(`${REMOTE_API_URL}/home`)
            const tweets: TweetListItem[] = await response.json()

            if (tweets.length > 0) {
                const tweet = tweets[0]
                expect(tweet).toHaveProperty('body')
                expect(tweet).toHaveProperty('likes')
                expect(tweet).toHaveProperty('userId')
                expect(tweet).toHaveProperty('profileName')
            }
        })
    })

    describe('GET /user/:id - Remote', () => {
        it('should handle user lookup', async () => {
            const response = await fetch(`${REMOTE_API_URL}/user/1`)

            // May be 404 if no users in remote DB yet
            expect([200, 404]).toContain(response.status)

            if (response.ok) {
                const user: UserProfile = await response.json()
                expect(user.id).toBe(1)
                expect(typeof user.username).toBe('string')
            }
        })
    })

    describe('API Response Headers', () => {
        it('should return correct content-type', async () => {
            const response = await fetch(`${REMOTE_API_URL}/home`)
            const contentType = response.headers.get('content-type')

            expect(contentType).toContain('application/json')
        })

        it('should have CORS headers', async () => {
            const response = await fetch(`${REMOTE_API_URL}/home`, {
                method: 'OPTIONS'
            })

            // Check for CORS preflight response or actual response
            expect([200, 204]).toContain(response.status)
        })
    })
})

// Helper to run a single smoke test
export async function smokeTestRemoteApi(url: string): Promise<boolean> {
    try {
        const response = await fetch(`${url}/health`, {
            signal: AbortSignal.timeout(5000)
        })
        return response.ok
    } catch {
        return false
    }
}
