/**
 * Mock Backend Tests for Flashcard API
 * Tests the flashcard endpoints using MSW mocked responses
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { mockDecks, mockCards, DeckListItem, CardItem, StudyCardItem } from '../fixtures/test-data'

const API_BASE = process.env.TEST_API_URL || 'https://go-example-bitter-cherry-6166.fly.dev'
const AUTH_HEADER = { Authorization: 'Bearer test-token' }

describe('Flashcard API Tests', () => {
    describe('GET /decks', () => {
        it('should require authorization', async () => {
            const res = await fetch(`${API_BASE}/decks`)
            expect(res.status).toBe(401)
        })

        it('should return list of decks with auth', async () => {
            const res = await fetch(`${API_BASE}/decks`, { headers: AUTH_HEADER })
            expect(res.ok).toBe(true)
            const data: DeckListItem[] = await res.json()
            expect(Array.isArray(data)).toBe(true)
            expect(data.length).toBeGreaterThan(0)
        })

        it('should return decks with correct shape', async () => {
            const res = await fetch(`${API_BASE}/decks`, { headers: AUTH_HEADER })
            const data: DeckListItem[] = await res.json()
            const deck = data[0]

            expect(deck).toHaveProperty('id')
            expect(deck).toHaveProperty('name')
            expect(deck).toHaveProperty('card_count')
            expect(deck).toHaveProperty('new_count')
            expect(deck).toHaveProperty('learning_count')
            expect(deck).toHaveProperty('reviewed_count')
        })
    })

    describe('POST /decks', () => {
        it('should require authorization', async () => {
            const res = await fetch(`${API_BASE}/decks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test Deck', description: 'Test' })
            })
            expect(res.status).toBe(401)
        })

        it('should create deck with auth', async () => {
            const res = await fetch(`${API_BASE}/decks`, {
                method: 'POST',
                headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'New Deck', description: 'A new deck' })
            })
            expect(res.status).toBe(201)
            const deck = await res.json()
            expect(deck.name).toBe('New Deck')
            expect(deck.card_count).toBe(0)
        })
    })

    describe('GET /decks/:id', () => {
        it('should return 404 for non-existent deck', async () => {
            const res = await fetch(`${API_BASE}/decks/9999`, { headers: AUTH_HEADER })
            expect(res.status).toBe(404)
        })

        it('should return deck details', async () => {
            const res = await fetch(`${API_BASE}/decks/1`, { headers: AUTH_HEADER })
            expect(res.ok).toBe(true)
            const deck = await res.json()
            expect(deck.id).toBe(1)
            expect(deck.name).toBe('JavaScript Basics')
        })
    })

    describe('GET /decks/:id/cards', () => {
        it('should return cards for deck', async () => {
            const res = await fetch(`${API_BASE}/decks/1/cards`, { headers: AUTH_HEADER })
            expect(res.ok).toBe(true)
            const cards: CardItem[] = await res.json()
            expect(Array.isArray(cards)).toBe(true)
            expect(cards.length).toBeGreaterThan(0)
        })

        it('should return cards with correct shape', async () => {
            const res = await fetch(`${API_BASE}/decks/1/cards`, { headers: AUTH_HEADER })
            const cards: CardItem[] = await res.json()
            const card = cards[0]

            expect(card).toHaveProperty('id')
            expect(card).toHaveProperty('deck_id')
            expect(card).toHaveProperty('front')
            expect(card).toHaveProperty('back')
            expect(card).toHaveProperty('status')
        })
    })

    describe('POST /decks/:id/cards', () => {
        it('should create card in deck', async () => {
            const res = await fetch(`${API_BASE}/decks/1/cards`, {
                method: 'POST',
                headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
                body: JSON.stringify({ front: 'Question?', back: 'Answer!' })
            })
            expect(res.status).toBe(201)
            const card = await res.json()
            expect(card.front).toBe('Question?')
            expect(card.back).toBe('Answer!')
            expect(card.status).toBe('new')
        })
    })

    describe('GET /decks/:id/study', () => {
        it('should return study cards', async () => {
            const res = await fetch(`${API_BASE}/decks/1/study`, { headers: AUTH_HEADER })
            expect(res.ok).toBe(true)
            const cards: StudyCardItem[] = await res.json()
            expect(Array.isArray(cards)).toBe(true)
        })

        it('should return cards with study fields', async () => {
            const res = await fetch(`${API_BASE}/decks/1/study`, { headers: AUTH_HEADER })
            const cards: StudyCardItem[] = await res.json()
            if (cards.length > 0) {
                const card = cards[0]
                expect(card).toHaveProperty('id')
                expect(card).toHaveProperty('front')
                expect(card).toHaveProperty('back')
                expect(card).toHaveProperty('status')
                expect(card).toHaveProperty('review_count')
            }
        })
    })

    describe('POST /cards/:id/review', () => {
        it('should schedule card review', async () => {
            const res = await fetch(`${API_BASE}/cards/1/review`, {
                method: 'POST',
                headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
                body: JSON.stringify({ remind_value: 1, remind_unit: 'day' })
            })
            expect(res.ok).toBe(true)
            const result = await res.json()
            expect(result).toHaveProperty('card_id')
            expect(result).toHaveProperty('status')
            expect(result).toHaveProperty('next_review_at')
            expect(result).toHaveProperty('review_count')
        })

        it('should accept different time units', async () => {
            // Test minutes
            let res = await fetch(`${API_BASE}/cards/1/review`, {
                method: 'POST',
                headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
                body: JSON.stringify({ remind_value: 30, remind_unit: 'min' })
            })
            expect(res.ok).toBe(true)

            // Test hours
            res = await fetch(`${API_BASE}/cards/1/review`, {
                method: 'POST',
                headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
                body: JSON.stringify({ remind_value: 2, remind_unit: 'hr' })
            })
            expect(res.ok).toBe(true)
        })
    })
})
