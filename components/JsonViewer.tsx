import React, { useState } from 'react';
import { LuChevronRight, LuChevronDown } from 'react-icons/lu';

interface JsonViewerProps {
  data: any;
}

const JsonNode: React.FC<{ nodeData: any; indentLevel: number }> = ({ nodeData, indentLevel }) => {
  const [isCollapsed, setIsCollapsed] = useState(indentLevel > 0);
  
  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(prev => !prev);
  };

  if (nodeData === null) {
    return <span className="text-gray-500">null</span>;
  }
  
  switch (typeof nodeData) {
    case 'string':
      return <span className="text-green-400">"{nodeData}"</span>;
    case 'number':
      return <span className="text-sky-400">{nodeData}</span>;
    case 'boolean':
      return <span className="text-purple-400">{String(nodeData)}</span>;
    case 'object':
      const isArray = Array.isArray(nodeData);
      const keys = isArray ? [] : Object.keys(nodeData);
      const itemCount = isArray ? nodeData.length : keys.length;

      if (itemCount === 0) {
        return <>{isArray ? '[]' : '{}'}</>;
      }

      const opener = isArray ? '[' : '{';
      const closer = isArray ? ']' : '}';

      if (isCollapsed) {
        return (
          <span className="cursor-pointer select-none" onClick={toggleCollapse}>
            <LuChevronRight className="inline-block mr-1 h-3 w-3" />
            <span>{opener}</span>
            <span className="text-gray-500 mx-1">...</span>
            <span>{closer}</span>
            <span className="text-gray-500 text-xs ml-2">
              ({itemCount} {isArray ? 'items' : 'keys'})
            </span>
          </span>
        );
      }

      return (
        <>
          <span className="cursor-pointer select-none" onClick={toggleCollapse}>
            <LuChevronDown className="inline-block mr-1 h-3 w-3" />
            <span>{opener}</span>
          </span>
          <div className="pl-6">
            {isArray ? (
              nodeData.map((item: any, index: number) => (
                <div key={index}>
                  <JsonNode nodeData={item} indentLevel={indentLevel + 1} />
                  {index < nodeData.length - 1 && <span>,</span>}
                </div>
              ))
            ) : (
              keys.map((key: string, index: number) => (
                <div key={key}>
                  <span className="text-orange-400">"{key}"</span>
                  <span>: </span>
                  <JsonNode nodeData={nodeData[key]} indentLevel={indentLevel + 1} />
                  {index < keys.length - 1 && <span>,</span>}
                </div>
              ))
            )}
          </div>
          <span>{closer}</span>
        </>
      );
    default:
      return null;
  }
};

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  return (
    <pre className="text-left whitespace-pre-wrap break-all">
      <JsonNode nodeData={data} indentLevel={0} />
    </pre>
  );
};

export default JsonViewer;