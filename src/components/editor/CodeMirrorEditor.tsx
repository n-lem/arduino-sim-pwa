/**
 * @file CodeMirrorEditor.tsx
 * @description Editor de código C++ para Arduino con resaltado de sintaxis, autocompletado y descarga .ino.
 */

import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { useCodeStore } from '../../stores/useCodeStore';
import { Copy, Check, Download, FileCode } from 'lucide-react';

export const CodeMirrorEditor: React.FC = () => {
  const { code, setCode, isSyncedWithBlocks } = useCodeStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadIno = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sketch.ino';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col font-mono text-xs overflow-hidden">
      {/* Barra superior de herramientas del editor */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 md:px-4 text-slate-400 select-none shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-arduino-teal" />
          <span className="text-white font-medium">sketch.ino</span>
          <span className="text-[10px] text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded font-mono">
            {isSyncedWithBlocks ? 'Sincronizado con Bloques' : 'Modo Manual'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownloadIno}
            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
            title="Descargar sketch.ino"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Descargar .ino</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
            title="Copiar código C++"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* Editor CodeMirror */}
      <div className="flex-1 w-full overflow-auto bg-[#282c34]">
        <CodeMirror
          value={code}
          height="100%"
          theme={oneDark}
          extensions={[cpp()]}
          onChange={(value) => setCode(value)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          className="text-xs h-full"
        />
      </div>
    </div>
  );
};
