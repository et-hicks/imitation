'use client';

import dynamic from 'next/dynamic';

const AsteroidsGame = dynamic(() => import('../../components/AsteroidsGame'), {
    ssr: false,
});

export default function AsteroidPage() {
    return (
        <main className="min-h-screen bg-black flex items-center justify-center">
            <AsteroidsGame />
        </main>
    );
}
