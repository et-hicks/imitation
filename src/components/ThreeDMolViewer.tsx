'use client';

import { useEffect, useRef, useState } from 'react';

const STRUCTURE_ID = '2O8B';
const PDB_URL = `https://files.rcsb.org/download/${STRUCTURE_ID}.pdb`;
const THREEDMOL_SCRIPT_SRC = 'https://3Dmol.org/build/3Dmol-min.js';

type ViewerStatus = 'loading' | 'ready' | 'error';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $3Dmol?: any;
  }
}

type ThreeDMolViewerProps = {
  className?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let threeDMolLoader: Promise<any | null> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadThreeDMol(): Promise<any | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);

  if (window.$3Dmol) return Promise.resolve(window.$3Dmol);

  if (threeDMolLoader) return threeDMolLoader;

  threeDMolLoader = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-3dmol]'
    );

    if (existingScript) {
      const handleLoad = () => resolve(window.$3Dmol ?? null);
      const handleError = () =>
        reject(new Error('Failed to load 3Dmol.js script from CDN.'));

      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.dataset.threedmol = 'true';
    script.setAttribute('data-3dmol', 'true');
    script.src = THREEDMOL_SCRIPT_SRC;
    script.async = true;

    script.addEventListener(
      'load',
      () => resolve(window.$3Dmol ?? null),
      { once: true }
    );

    script.addEventListener(
      'error',
      () => reject(new Error('Failed to load 3Dmol.js script from CDN.')),
      { once: true }
    );

    document.body.appendChild(script);
  })
    .catch(error => {
      console.error(error);
      threeDMolLoader = null;
      return null;
    })
    .then(bundle => {
      if (!bundle) threeDMolLoader = null;
      return bundle;
    });

  return threeDMolLoader;
}

export function ThreeDMolViewer({ className }: ThreeDMolViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // 3Dmol typings are not available, suppressing explicit any intentionally.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  const [status, setStatus] = useState<ViewerStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    const initViewer = async () => {
      if (mounted) {
        setStatus('loading');
        setErrorMessage(null);
      }

      const $3Dmol = await loadThreeDMol();

      if (!mounted) return;

      if (!$3Dmol || !containerRef.current) {
        if (mounted) {
          setStatus('error');
          setErrorMessage(
            '3Dmol.js assets failed to load. Please check your connection and try again.'
          );
        }
        return;
      }

      try {
        viewerRef.current = $3Dmol.createViewer(containerRef.current, {
          backgroundColor: '#0f172a',
        });

        const response = await fetch(PDB_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDB file: ${response.statusText}`);
        }

        const pdbData = await response.text();

        if (!mounted || !viewerRef.current) {
          return;
        }

        viewerRef.current.addModel(pdbData, 'pdb');
        viewerRef.current.setStyle({}, { cartoon: { color: 'spectrum' } });
        viewerRef.current.zoomTo();
        viewerRef.current.render();

        if (mounted) {
          setStatus('ready');
        }
      } catch (error) {
        console.error('Failed to initialize 3Dmol viewer.', error);
        if (viewerRef.current) {
          try {
            viewerRef.current.clear();
          } catch (clearError) {
            console.warn('Error while clearing 3Dmol viewer after failure.', clearError);
          }
          viewerRef.current = null;
        }
        if (mounted) {
          setStatus('error');
          setErrorMessage(
            'Unable to initialize the 3Dmol viewer. Refresh the page or check your network connection.'
          );
        }
      }
    };

    initViewer();

    return () => {
      mounted = false;
      const container = containerRef.current;
      if (viewerRef.current) {
        try {
          viewerRef.current.clear();
          viewerRef.current = null;
        } catch (error) {
          console.warn('Error while disposing 3Dmol viewer.', error);
        }
      }
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  const containerClasses = [
    'relative w-full min-h-[360px] rounded-lg overflow-hidden bg-slate-900/60 border border-slate-800',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      <div className="w-full h-full" ref={containerRef} />
      {status !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 px-6 text-center text-sm text-slate-200">
          {status === 'loading'
            ? 'Loading 3Dmol viewer...'
            : errorMessage ?? '3Dmol viewer failed to load.'}
        </div>
      )}
    </div>
  );
}
