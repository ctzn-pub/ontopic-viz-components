'use client'

import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { AnalysisResults } from '../types';

interface CopyResultsButtonProps {
    results: AnalysisResults;
    title?: string;
    subtitle?: string;
}

export const CopyResultsButton: React.FC<CopyResultsButtonProps> = ({ results, title, subtitle }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        let markdown = '';
        
        // Add title and subtitle if provided
        if (title) {
            markdown += `# ${title}\n`;
            if (subtitle && subtitle !== title) {
                markdown += `*${subtitle}*\n\n`;
            }
        }

        // Add the pre-generated markdown from results
        if (Array.isArray(results.markdown)) {
            markdown += results.markdown.join('\n');
        } else if (results.markdown) {
            markdown += results.markdown;
        }

        await navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleCopy}
        >
            {copied ? (
                <>
                    <Check className="h-4 w-4" />
                    Copied!
                </>
            ) : (
                <>
                    <Copy className="h-4 w-4" />
                    Copy as Markdown
                </>
            )}
        </Button>
    );
};

export default CopyResultsButton;
