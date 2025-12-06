import { DocumentTextIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';

interface SourceTooltipProps {
    content: string;
    isLink?: boolean;
    link?: string;
    number?: number;
}

export function SourceTooltip({ content, isLink, link, number }: SourceTooltipProps) {
    return (
        <span className="group relative inline-flex items-center justify-center align-middle ml-1">
            {number ? (
                isLink && link ? (
                    <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 font-medium hover:text-blue-300 transition-colors no-underline"
                    >
                        <sup className="cursor-pointer">[{number}]</sup>
                    </a>
                ) : (
                    <sup className="text-blue-400 cursor-pointer hover:text-blue-300 transition-colors font-medium">
                        [{number}]
                    </sup>
                )
            ) : (
                <DocumentTextIcon
                    className="h-4 w-4 text-blue-400 cursor-pointer hover:text-blue-300 transition-colors"
                    aria-hidden="true"
                />
            )}

            <span className="absolute bottom-full left-1/2 mb-2 w-max max-w-xs -translate-x-1/2 scale-0 rounded bg-slate-800 p-2 text-xs text-slate-200 opacity-0 shadow-lg transition-all duration-300 delay-300 ease-in-out group-hover:scale-100 group-hover:opacity-100 group-hover:duration-75 group-hover:delay-0 ring-1 ring-slate-700/50 z-50 whitespace-normal text-center">
                <a href={link} target="_blank" rel="noopener noreferrer">
                    {content}
                    {isLink && <ArrowTopRightOnSquareIcon className="h-3 w-3 inline-block ml-1 text-blue-400" />}
                    {/* Tooltip arrow */}
                    <span className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800 ring-r-1 ring-b-1 ring-slate-700/50"></span>
                </a>
            </span>
        </span>
    );
}
