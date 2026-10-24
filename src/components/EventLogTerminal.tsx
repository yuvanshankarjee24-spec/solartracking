import { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  CornerDownLeft, 
  Check, 
  Code

} from 'lucide-react';
import type { LogEntry, ConnectionStatus } from '../types';

interface EventLogTerminalProps {
  logs: LogEntry[];
  rawLines: string[];
  connectionStatus: ConnectionStatus;
  onSendCommand: (cmd: string) => void;
}

export const EventLogTerminal = ({
  logs,
  rawLines,
  connectionStatus,
  onSendCommand,
}: EventLogTerminalProps) => {
  const [inputText, setInputText] = useState<string>('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [showRawSerial, setShowRawSerial] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const rawEndRef = useRef<HTMLDivElement>(null);

  const isConnected = connectionStatus === 'connected' || connectionStatus === 'simulator';

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (showRawSerial) {
      rawEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [rawLines, showRawSerial]);

  // Handle submit command
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = inputText.trim();
    if (!cmd) return;

    onSendCommand(cmd);
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInputText('');
  };

  // Keyboard history navigation (Up / Down)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputText(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputText('');
      } else {
        setHistoryIndex(nextIdx);
        setInputText(commandHistory[nextIdx]);
      }
    }
  };

  // Copy logs to clipboard
  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="card-clean p-6 bg-white flex flex-col justify-between">
      
      {/* Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <Terminal className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Serial Event Log & Terminal</h3>
            <p className="text-xs text-slate-400">Chronological command dispatch and response monitor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Collapsible Raw Serial */}
          <button
            onClick={() => setShowRawSerial(!showRawSerial)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              showRawSerial
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw Serial Stream</span>
            {showRawSerial ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyLogs}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Copy logs to clipboard"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Raw Serial Feed */}
      {showRawSerial && (
        <div className="mb-3 bg-slate-900 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 border-b border-slate-800 pb-1">
            <span>UNPARSED RAW SERIAL BUFFER (9600 BAUD)</span>
            <span>{rawLines.length} lines</span>
          </div>
          <div className="h-32 overflow-y-auto font-mono text-xs text-emerald-400 space-y-1 select-text">
            {rawLines.length === 0 ? (
              <div className="text-slate-500 italic">No raw serial frames captured yet...</div>
            ) : (
              rawLines.map((line, i) => (
                <div key={i} className="leading-tight opacity-90">
                  <span className="text-slate-600 mr-2 select-none">{i + 1}</span>
                  {line}
                </div>
              ))
            )}
            <div ref={rawEndRef} />
          </div>
        </div>
      )}

      {/* Main Formatted Event Log Container */}
      <div className="h-48 overflow-y-auto bg-slate-50 rounded-xl p-3 border border-slate-200/90 font-mono text-xs space-y-1.5 select-text">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 italic font-sans text-xs">
            No events logged. Connect to Arduino or launch the simulator to view serial activity.
          </div>
        ) : (
          logs.map((log) => {
            let textColor = 'text-slate-700';
            let prefix = 'LOG';
            let bgPill = 'bg-slate-200/70 text-slate-700';

            if (log.type === 'command') {
              textColor = 'text-blue-700 font-bold';
              prefix = 'TX';
              bgPill = 'bg-blue-100 text-blue-800';
            } else if (log.type === 'response') {
              textColor = 'text-emerald-700 font-bold';
              prefix = 'RX';
              bgPill = 'bg-emerald-100 text-emerald-800';
            } else if (log.type === 'error') {
              textColor = 'text-rose-600 font-bold';
              prefix = 'ERR';
              bgPill = 'bg-rose-100 text-rose-800';
            } else if (log.type === 'info') {
              textColor = 'text-indigo-700';
              prefix = 'INFO';
              bgPill = 'bg-indigo-100 text-indigo-800';
            }

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-400 text-[10px] select-none flex-shrink-0 pt-0.5">
                  [{log.timestamp}]
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded select-none uppercase flex-shrink-0 ${bgPill}`}>
                  {prefix}
                </span>
                <span className={`break-all ${textColor}`}>
                  {log.text}
                </span>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Quick Command Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
        <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">Quick:</span>
        {['status', 'home', 'pause', 'resume', 'demo 20', 'demo off', 'threshold 10', 'print 1000'].map((cmd) => (
          <button
            key={cmd}
            disabled={!isConnected}
            onClick={() => onSendCommand(cmd)}
            className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Free-text Command Input Box */}
      <form onSubmit={handleSend} className="flex items-center gap-2 mt-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            disabled={!isConnected}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected 
                ? "Send command (e.g. 'status', 'angle 110', 'threshold 15'). Use ↑/↓ for history."
                : "Connect device or start simulator to send commands"
            }
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!isConnected || !inputText.trim()}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span>Send</span>
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
};
