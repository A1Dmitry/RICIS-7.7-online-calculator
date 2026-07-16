/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface LatexProps {
  math: string;
  block?: boolean;
  className?: string;
}

declare global {
  interface Window {
    katex?: any;
  }
}

export default function Latex({ math, block = false, className = "" }: LatexProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    let interval: NodeJS.Timeout | null = null;

    const render = () => {
      if (!isMounted || !containerRef.current) return;

      if (window.katex) {
        try {
          window.katex.render(math, containerRef.current, {
            displayMode: block,
            throwOnError: false,
            trust: true,
          });
        } catch (err) {
          console.error("KaTeX rendering error:", err);
          containerRef.current.textContent = math;
        }
      } else {
        // Fallback display while waiting for script
        containerRef.current.textContent = math;

        // Poll for KaTeX initialization from CDN
        interval = setInterval(() => {
          if (window.katex) {
            if (interval) clearInterval(interval);
            if (isMounted && containerRef.current) {
              try {
                window.katex.render(math, containerRef.current, {
                  displayMode: block,
                  throwOnError: false,
                  trust: true,
                });
              } catch (err) {
                containerRef.current.textContent = math;
              }
            }
          }
        }, 100);
      }
    };

    render();

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [math, block]);

  return (
    <span 
      ref={containerRef} 
      className={`inline-block ${className}`}
      style={{ fontFamily: 'inherit' }}
    />
  );
}

interface FormattedMessageProps {
  content: string;
}

export function FormattedMessage({ content }: FormattedMessageProps) {
  // Regex to split by $$...$$ and $...$
  const parts = content.split(/(\$\$.*?\$\$|\$.*?\$)/g);

  return (
    <div className="whitespace-pre-line space-y-1">
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          return (
            <div key={index} className="my-2 p-2 bg-[#09090B] border border-cyan-500/10 rounded flex justify-center text-center">
              <Latex math={math} block={true} />
            </div>
          );
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          return (
            <span key={index}>
              <Latex math={math} block={false} className="text-cyan-300 font-bold px-0.5" />
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}
