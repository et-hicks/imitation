'use client';

import { useEffect, useRef, useState } from 'react';

const STRUCTURE_ID = '2O8B';
const STRUCTURE_URL = `https://files.rcsb.org/download/${STRUCTURE_ID}.cif`;
const MOLSTAR_VERSION = '5.0.0';
const MOLSTAR_CDN_BASE = `https://cdn.jsdelivr.net/npm/molstar@${MOLSTAR_VERSION}/build/viewer`;

type MolstarViewerInstance = {
  plugin: { destroy(): void };
  loadStructureFromUrl: (
    url: string,
    format: string,
    options?: Record<string, unknown>
  ) => Promise<void>;
};

type MolstarBundle = {
  Viewer: {
    create: (
      element: HTMLElement,
      options?: Record<string, unknown>
    ) => Promise<MolstarViewerInstance>;
  };
};

declare global {
  interface Window {
    molstar?: MolstarBundle;
  }
}

let molstarLoader: Promise<MolstarBundle | null> | null = null;

function loadMolstar(): Promise<MolstarBundle | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);

  if (window.molstar) return Promise.resolve(window.molstar);

  if (molstarLoader) return molstarLoader;

  molstarLoader = new Promise((resolve, reject) => {
    const existingScript =
      document.querySelector<HTMLScriptElement>('script[data-molstar]');

    if (existingScript) {
      const handleLoad = () => resolve(window.molstar ?? null);
      const handleError = () =>
        reject(new Error('Failed to load Mol* script from CDN.'));

      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const styleId = 'molstar-stylesheet';
    if (!document.getElementById(styleId)) {
      const link = document.createElement('link');
      link.id = styleId;
      link.rel = 'stylesheet';
      link.href = `${MOLSTAR_CDN_BASE}/molstar.css`;
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.dataset.molstar = 'true';
    script.src = `${MOLSTAR_CDN_BASE}/molstar.js`;
    script.async = true;

    script.addEventListener(
      'load',
      () => resolve(window.molstar ?? null),
      { once: true }
    );
    script.addEventListener(
      'error',
      () => reject(new Error('Failed to load Mol* script from CDN.')),
      { once: true }
    );

    document.body.appendChild(script);
  })
    .catch(error => {
      console.error(error);
      molstarLoader = null;
      return null;
    })
    .then(bundle => {
      if (!bundle) molstarLoader = null;
      return bundle;
    });

  return molstarLoader;
}

type MolstarViewerProps = {
  className?: string;
};

export function MolstarViewer({ className }: MolstarViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let viewer: MolstarViewerInstance | null = null;
    let mounted = true;

    const loadViewer = async () => {
      if (mounted) {
        setStatus('loading');
        setErrorMessage(null);
      }

      const bundle = await loadMolstar();

      if (!mounted) {
        return;
      }

      if (!bundle || !containerRef.current) {
        if (mounted) {
          setStatus('error');
          setErrorMessage(
            'Mol* assets failed to load. Please check your connection and try again.'
          );
        }
        return;
      }

      try {
        const instance = await bundle.Viewer.create(containerRef.current, {
          layoutShowControls: true,
          layoutShowRemoteState: false,
          layoutShowSequence: true,
          layoutShowLog: false,
          layoutShowLeftPanel: true,
          layoutIsExpanded: false,
        });

        if (!mounted || !containerRef.current) {
          instance.plugin.destroy();
          return;
        }

        viewer = instance;
        await instance.loadStructureFromUrl(STRUCTURE_URL, 'mmcif', {
          representationParams: {
            theme: { globalName: 'operator-name' },
          },
        });

        if (mounted) {
          setStatus('ready');
        }
      } catch (error) {
        console.error('Failed to initialize Mol* viewer.', error);
        if (viewer) {
          viewer.plugin.destroy();
          viewer = null;
        }

        if (mounted) {
          setStatus('error');
          setErrorMessage(
            'Unable to initialize the Mol* viewer. Refresh the page or check your network connection.'
          );
        }
      }
    };

    loadViewer();

    return () => {
      mounted = false;
      if (viewer) {
        viewer.plugin.destroy();
        viewer = null;
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
            ? 'Loading Mol* viewer...'
            : errorMessage ?? 'Mol* viewer failed to load.'}
        </div>
      )}
    </div>
  );
}
