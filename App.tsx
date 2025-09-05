import React, { useState, useEffect, useCallback, useRef } from 'react';
import JsonViewer from './components/JsonViewer';
import ErrorMessage from './components/ErrorMessage';
import { LuBraces, LuArrowRight, LuFileText } from 'react-icons/lu';

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

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="flex items-center p-4 border-b border-gray-700 bg-gray-800/50 shadow-lg">
        <LuBraces className="text-3xl text-cyan-400" />
        <h1 className="text-xl font-bold ml-3 tracking-wider">JSON Parser & Beautifier</h1>
      </header>

      <main className="flex-grow flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        {/* Input Panel */}
        <div className="flex flex-col md:w-1/2 h-full bg-gray-800 rounded-lg border border-gray-700 shadow-2xl">
          <div className="flex items-center p-3 border-b border-gray-700 bg-gray-900/50 rounded-t-lg">
            <LuFileText className="text-lg text-gray-400"/>
            <h2 className="text-md font-semibold ml-2">Input Text</h2>
          </div>
          <div className="flex flex-grow overflow-hidden">
            <div
              ref={lineNumbersRef}
              className="w-12 shrink-0 pt-4 text-right pr-3 text-gray-500 font-mono text-sm select-none bg-gray-800 border-r border-gray-700 overflow-y-hidden"
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
                className="absolute top-0 left-0 w-full h-full pt-4 pb-4 pr-4 pl-3 text-gray-300 font-mono text-sm pointer-events-none overflow-hidden"
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
                className="absolute top-0 left-0 w-full h-full pt-4 pb-4 pr-4 pl-3 bg-transparent font-mono text-sm resize-none focus:outline-none placeholder-gray-500"
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

        {/* Separator for medium and up screens */}
        <div className="hidden md:flex items-center justify-center">
            <LuArrowRight className="text-3xl text-gray-600" />
        </div>

        {/* Output Panel */}
        <div className="flex flex-col md:w-1/2 h-full bg-gray-800 rounded-lg border border-gray-700 shadow-2xl">
           <div className="flex items-center p-3 border-b border-gray-700 bg-gray-900/50 rounded-t-lg">
            <LuBraces className="text-lg text-cyan-400"/>
            <h2 className="text-md font-semibold ml-2">Formatted JSON</h2>
          </div>
          <div className="w-full h-full p-4 overflow-auto font-mono text-sm">
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
        <footer className="p-4 border-t border-gray-700 bg-gray-800/50">
          <ErrorMessage message={error} inputText={inputText} />
        </footer>
      )}
    </div>
  );
};

export default App;