import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HelperGuideProps {
    title: string;
    purpose: string;
    usage: string;
}

export const HelperGuide = ({ title, purpose, usage }: HelperGuideProps) => {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="p-1 rounded-full hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary shrink-0"
                        aria-label={`Guide for ${title}`}
                    >
                        <Info className="h-3.5 w-3.5" />
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    align="end"
                    className="max-w-[260px] p-4 bg-white border-primary/20 shadow-2xl rounded-2xl z-[100] animate-in fade-in zoom-in-95 duration-200"
                >
                    <div className="space-y-3">
                        <div className="pb-2 border-b border-primary/10">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{title} Module</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-foreground">Core Purpose</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed italic line-clamp-3">{purpose}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-foreground">Admin Usage</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{usage}</p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
