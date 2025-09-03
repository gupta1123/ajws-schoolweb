// src/components/ui/truncated-text.tsx

'use client';

import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TruncatedTextProps {
  text: string;
  maxLines?: number;
  maxLength?: number;
  className?: string;
  showTooltip?: boolean;
}

export function TruncatedText({ 
  text, 
  maxLines = 2, 
  maxLength = 100, 
  className = "",
  showTooltip = true 
}: TruncatedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if text needs truncation
  const needsTruncation = text.length > maxLength || text.split('\n').length > maxLines;
  
  if (!needsTruncation) {
    return <span className={className}>{text}</span>;
  }

  if (isExpanded) {
    return (
      <div className={className}>
        <span className="whitespace-pre-wrap">{text}</span>
        <button
          onClick={() => setIsExpanded(false)}
          className="ml-2 text-primary hover:text-primary/80 text-sm underline transition-colors"
        >
          Show less
        </button>
      </div>
    );
  }

  const truncatedText = text.length > maxLength 
    ? text.substring(0, maxLength) + '...'
    : text;

  const truncatedLines = text.split('\n').slice(0, maxLines).join('\n');
  const hasMoreLines = text.split('\n').length > maxLines;
  const finalTruncatedText = hasMoreLines ? truncatedLines + '...' : truncatedText;

  const content = (
    <span className={className}>
      <span className="whitespace-pre-wrap">{finalTruncatedText}</span>
      <button
        onClick={() => setIsExpanded(true)}
        className="ml-2 text-primary hover:text-primary/80 text-sm underline transition-colors"
      >
        Show more
      </button>
    </span>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-3 bg-black text-white border border-border text-sm shadow-lg"
        >
          <div className="whitespace-pre-wrap">{text}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Special component for table cells with better truncation
export function TruncatedTableCell({ 
  text, 
  maxLines = 2, 
  maxLength = 80,
  className = "" 
}: TruncatedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const needsTruncation = text.length > maxLength || text.split('\n').length > maxLines;
  
  if (!needsTruncation) {
    return <span className={className}>{text}</span>;
  }

  if (isExpanded) {
    return (
      <div className={className}>
        <span className="whitespace-pre-wrap">{text}</span>
        <button
          onClick={() => setIsExpanded(false)}
          className="ml-2 text-primary hover:text-primary/80 text-xs underline transition-colors"
        >
          Less
        </button>
      </div>
    );
  }

  const truncatedText = text.length > maxLength 
    ? text.substring(0, maxLength) + '...'
    : text;

  const truncatedLines = text.split('\n').slice(0, maxLines).join('\n');
  const hasMoreLines = text.split('\n').length > maxLines;
  const finalTruncatedText = hasMoreLines ? truncatedLines + '...' : truncatedText;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className}>
            <span className="whitespace-pre-wrap cursor-help">{finalTruncatedText}</span>
            <button
              onClick={() => setIsExpanded(true)}
              className="ml-2 text-primary hover:text-primary/80 text-xs underline transition-colors"
            >
              More
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-3 bg-black text-white border border-border text-sm shadow-lg"
        >
          <div className="whitespace-pre-wrap">{text}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
