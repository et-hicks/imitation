'use client';

import { useEffect, useRef } from 'react';
import { Viewer } from 'molstar/lib/mol-plugin-ui/viewer';
import 'molstar/build/viewer/molstar.css';

const STRUCTURE_ID = '2O8B';
const STRUCTURE_URL = `https://files.rcsb.org/download/${STRUCTURE_ID}.cif`;

export function MolstarViewer() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let viewer: Viewer | null = null;
    let mounted = true;

    Viewer.create(containerRef.current, {
      layoutShowControls: true,
      layoutShowRemoteState: false,
      layoutShowSequence: true,
      layoutShowLog: false,
      layoutShowLeftPanel: true,
      layoutIsExpanded: false,
    })
      .then(async (instance) => {
        if (!mounted) {
          instance.plugin.destroy();
          return;
        }

        viewer = instance;
        try {
          await instance.loadStructureFromUrl(STRUCTURE_URL, 'mmcif', {
            representationParams: {
              theme: { globalName: 'operator-name' },
            },
          });
        } catch (error) {
          console.error('Failed to load structure into Mol* viewer.', error);
        }
      })
      .catch((error) => {
        console.error('Failed to initialize Mol* viewer.', error);
      });

    return () => {
      mounted = false;
      if (viewer) {
        viewer.plugin.destroy();
        viewer = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[480px] rounded-lg overflow-hidden bg-slate-900/60 border border-slate-800">
      <div className="w-full h-full" ref={containerRef} />
    </div>
  );
}
