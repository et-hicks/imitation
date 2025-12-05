import { DocumentTextIcon } from '@heroicons/react/20/solid';

interface SourceTooltipProps {
    content: string;
}

export function SourceTooltip({ content }: SourceTooltipProps) {
    return (
        <span className="group relative inline-flex items-center justify-center align-middle ml-1">
            <DocumentTextIcon
                className="h-4 w-4 text-blue-400 cursor-pointer hover:text-blue-300 transition-colors"
                aria-hidden="true"
            />

            <span className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 scale-0 rounded bg-slate-800 p-2 text-xs text-slate-200 opacity-0 shadow-lg transition-all duration-300 delay-300 ease-in-out group-hover:scale-100 group-hover:opacity-100 group-hover:duration-75 group-hover:delay-0 ring-1 ring-slate-700/50 z-50">
                {content}
                {/* Tooltip arrow */}
                <span className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800 ring-r-1 ring-b-1 ring-slate-700/50"></span>
            </span>
        </span>
    );
}
