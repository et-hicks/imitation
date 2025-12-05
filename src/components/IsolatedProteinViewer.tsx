'use client';

import { ThreeDMolViewer } from './ThreeDMolViewer';

type IsolatedProteinViewerProps = {
    pdbUrl: string;
    targetChain: string;
    description?: string;
    className?: string;
};

export function IsolatedProteinViewer({
    pdbUrl,
    targetChain,
    description,
    className,
}: IsolatedProteinViewerProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleModelLoaded = (viewer: any) => {
        if (!viewer) return;

        // Hide everything first
        // Note: We use a broad selection {} to target everything
        viewer.setStyle({}, { cartoon: { hidden: true } });

        // Show only the target chain
        viewer.setStyle({ chain: targetChain }, { cartoon: { color: 'spectrum' } });

        // Zoom to focus on the isolated chain
        viewer.zoomTo({ chain: targetChain });

        viewer.render();
    };

    return (
        <div className={`space-y-4 ${className ?? ''}`}>
            {description && <p className="text-slate-300">{description}</p>}
            <ThreeDMolViewer
                modelUrl={pdbUrl}
                format="pdb"
                style={{ cartoon: { hidden: true } }} // Start hidden to avoid flash of full structure
                onModelLoaded={handleModelLoaded}
                className="h-[480px]"
            />
        </div>
    );
}
