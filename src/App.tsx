import React, { useState, useEffect, useCallback, useRef } from 'react';
import JsonViewer from './components/JsonViewer';
import ErrorMessage from './components/ErrorMessage';
import CoupangAd from './components/CoupangAd';
import { LuBraces, LuFileText } from 'react-icons/lu';

const calculateErrorRange = (text: string, errorMessage: string): { start: number; end: number } | null => {
  const positionMatch = errorMessage.match(/at position (\d+)/);
  if (!positionMatch || !positionMatch[1]) return null;

  const position = parseInt(positionMatch[1], 10);
  if (position < 0 || position > text.length) return null;

  if (errorMessage.includes("Unexpected end of JSON input")) {
    // For unclosed structures, highlight the last line for context.
    const lastNewLine = text.lastIndexOf('\n');
    return { start: lastNewLine > -1 ? lastNewLine + 1 : 0, end: text.length };
  }

  const delimiters = /[\s\{\}\[\]\(\),:"]/;

  // If error is on a delimiter, just highlight that character
  if (position < text.length && delimiters.test(text[position])) {
    return { start: position, end: position + 1 };
  }
  
  let start = position;
  while (start > 0 && !delimiters.test(text[start - 1])) {
    start--;
  }

  let end = position;
  while (end < text.length && !delimiters.test(text[end])) {
    end++;
  }

  if (start === end && end < text.length) {
    // Fallback for cases where the loop doesn't move, just highlight the single character.
    return { start: position, end: position + 1 };
  }
  
  return { start, end };
};


const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lineCount, setLineCount] = useState(1);
  const [errorRange, setErrorRange] = useState<{ start: number; end: number } | null>(null);

  const [inputPanelWidth, setInputPanelWidth] = useState<number | undefined>(undefined);
  const isResizing = useRef(false);
  const mainRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlighterRef = useRef<HTMLDivElement>(null);

  const placeholderJson = JSON.stringify(
    {
      "hello": "world",
      "number": 123,
      "isCool": true,
      "nested": {
        "array": [1, null, "item"]
      }
    },
    null,
    2
  );

  useEffect(() => {
    if (mainRef.current) {
        const { offsetWidth } = mainRef.current;
        const padding = 8; // p-1 on main element (0.25rem * 2) -> px-1 is 4px * 2
        const gap = 4; // gap-1 on main element (0.25rem)
        setInputPanelWidth((offsetWidth - padding - gap) / 2);
    }
  }, []);

  useEffect(() => {
    if (inputText.trim() === '') {
      setParsedJson(null);
      setError(null);
      setErrorRange(null);
      return;
    }

    try {
      const json = JSON.parse(inputText);
      setParsedJson(json);
      setError(null);
      setErrorRange(null);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
        setErrorRange(calculateErrorRange(inputText, e.message));
      } else {
        setError('An unknown error occurred.');
        setErrorRange(null);
      }
      setParsedJson(null);
    }
  }, [inputText]);

  useEffect(() => {
    const count = inputText.split('\n').length;
    setLineCount(count);
  }, [inputText]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  }, []);

  const handleScroll = useCallback(() => {
    if (lineNumbersRef.current && textareaRef.current && highlighterRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      const scrollLeft = textareaRef.current.scrollLeft;
      lineNumbersRef.current.scrollTop = scrollTop;
      highlighterRef.current.scrollTop = scrollTop;
      highlighterRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing.current && mainRef.current) {
      const rect = mainRef.current.getBoundingClientRect();
      const padding = 4; // px-1
      const gap = 4; // gap-1
      let newWidth = e.clientX - rect.left - padding;

      const minWidth = 200; // min panel width in pixels
      const totalWidth = rect.width - padding * 2 - gap;
      
      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > totalWidth - minWidth) newWidth = totalWidth - minWidth;

      setInputPanelWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);


  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="flex items-center py-1 px-2 border-b border-gray-700 bg-gray-800/50 shadow-lg shrink-0">
        <LuBraces className="text-3xl text-cyan-400" />
        <h1 className="text-xl font-bold ml-3 tracking-wider">JSON Parser & Beautifier</h1>
      </header>
      
      <CoupangAd />

      <main ref={mainRef} className="flex-grow flex flex-col md:flex-row gap-1 px-1 overflow-hidden">
        {/* Input Panel */}
        <div 
          className="flex flex-col h-1/2 md:h-full bg-gray-800 rounded-lg border border-gray-700 shadow-2xl"
          style={inputPanelWidth ? { width: `${inputPanelWidth}px` } : { flex: '1 1 50%' }}
        >
          <div className="flex items-center px-2 border-b border-gray-700 bg-gray-900/50 rounded-t-lg h-7">
            <LuFileText className="text-lg text-gray-400"/>
            <h2 className="text-md font-semibold ml-2">Input Text</h2>
          </div>
          <div className="flex flex-grow overflow-hidden">
            <div
              ref={lineNumbersRef}
              className="w-12 shrink-0 text-right pr-3 text-gray-500 font-mono text-sm select-none bg-gray-800 border-r border-gray-700 overflow-y-hidden"
              aria-hidden="true"
            >
              {Array.from({ length: lineCount || 1 }, (_, i) => (
                <div key={i + 1} style={{ lineHeight: '1.5rem' }}>
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="relative w-full h-full flex-grow">
               <div
                ref={highlighterRef}
                className="absolute top-0 left-0 w-full h-full pr-2 pl-3 text-gray-300 font-mono text-sm pointer-events-none overflow-hidden"
                style={{ lineHeight: '1.5rem', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                aria-hidden="true"
              >
                {errorRange ? (
                  <>
                    <span>{inputText.substring(0, errorRange.start)}</span>
                    <span className="bg-red-500/40 rounded-sm">{inputText.substring(errorRange.start, errorRange.end)}</span>
                    <span>{inputText.substring(errorRange.end)}</span>
                  </>
                ) : (
                  <span>{inputText}</span>
                )}
                {/* This newline ensures the highlighter's scrollHeight matches the textarea's,
                    preventing visual glitches at the bottom when scrolling. */}
                {'\n'}
              </div>
              <textarea
                ref={textareaRef}
                onScroll={handleScroll}
                value={inputText}
                onChange={handleInputChange}
                placeholder={`Paste your JSON here...\n\nFor example:\n${placeholderJson}`}
                className="absolute top-0 left-0 w-full h-full pr-2 pl-3 bg-transparent font-mono text-sm resize-none focus:outline-none placeholder-gray-500"
                spellCheck="false"
                style={{
                  lineHeight: '1.5rem',
                  color: errorRange ? 'transparent' : 'inherit',
                  caretColor: '#d1d5db',
                }}
              />
            </div>
          </div>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          className="hidden md:flex items-center justify-center w-4 cursor-col-resize group flex-shrink-0"
          aria-label="Resize panels"
          role="separator"
          aria-orientation="vertical"
        >
          <div className="w-1.5 h-24 bg-gray-700 group-hover:bg-cyan-400 transition-colors rounded-full" />
        </div>

        {/* Output Panel */}
        <div className="flex flex-col h-1/2 md:h-full bg-gray-800 rounded-lg border border-gray-700 shadow-2xl flex-1 min-w-0">
           <div className="flex items-center px-2 border-b border-gray-700 bg-gray-900/50 rounded-t-lg h-7">
            <LuBraces className="text-lg text-cyan-400"/>
            <h2 className="text-md font-semibold ml-2">Formatted JSON</h2>
          </div>
          <div className="w-full h-full px-2 overflow-auto font-mono text-sm">
            {parsedJson !== null && <JsonViewer data={parsedJson} />}
            {parsedJson === null && !error && (
              <div className="text-gray-500 h-full flex items-center justify-center">
                <p>Valid JSON will be displayed here.</p>
              </div>
            )}
            {error && (
               <div className="text-red-400 h-full flex items-center justify-center">
                <p>Invalid JSON input.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {error && (
        <footer className="border-t border-gray-700 bg-gray-800/50 shrink-0">
          <ErrorMessage message={error} inputText={inputText} />
        </footer>
      )}
    </div>
  );
};

export default App;