'use client';

import dynamic from 'next/dynamic';

const PongGame = dynamic(() => import('@/components/PongGame'), {
    ssr: false,
    loading: () => <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">Loading Game...</div>
});

export default function PongPage() {
    return (
        <main className="min-h-screen bg-black">
            <PongGame />
        </main>
    );
}
