import React from 'react';
import { FaTimesCircle } from 'react-icons/fa';

interface ErrorMessageProps {
  message: string;
  inputText: string;
}

const getLineAndColumn = (text: string, position: number): { line: number; column: number } | null => {
  if (position > text.length) return null;
  let line = 1;
  let lastLineStart = 0;
  for (let i = 0; i < position; i++) {
    if (text[i] === '\n') {
      line++;
      lastLineStart = i + 1;
    }
  }
  const column = position - lastLineStart + 1;
  return { line, column };
};


const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, inputText }) => {
  const positionMatch = message.match(/at position (\d+)/);
  let locationInfo: string | null = null;
  
  if (positionMatch && positionMatch[1]) {
    const position = parseInt(positionMatch[1], 10);
    const location = getLineAndColumn(inputText, position);
    if (location) {
      locationInfo = `Error found at Line: ${location.line}, Column: ${location.column}`;
    }
  }

  return (
    <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-2 rounded-lg flex items-start">
      <FaTimesCircle className="text-2xl text-red-400 mr-3 flex-shrink-0 mt-1" />
      <div>
        <p className="font-bold text-red-200">Parsing Failed</p>
        <p className="text-sm">{message}</p>
        {locationInfo && <p className="text-sm font-semibold mt-1 text-red-200">{locationInfo}</p>}
      </div>
    </div>
  );
};

export default ErrorMessage;