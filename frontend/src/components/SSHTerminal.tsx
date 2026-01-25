/**
 * SSH Terminal Component
 * ======================
 * 
 * This component provides a web-based SSH terminal interface for connecting
 * to robots from the browser. It uses xterm.js for terminal emulation and
 * WebSocket for real-time communication with the SSH backend.
 * 
 * Features:
 * - Full terminal emulation with xterm.js
 * - WebSocket-based SSH connection
 * - Terminal resizing
 * - Automatic cleanup on disconnect
 * - Connection status indicators
 */

import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface SSHTerminalProps {
  robotId: string;
  sshUsername: string;
  sshPassword: string;
  onClose?: () => void;
}

/**
 * SSH Terminal Component
 * 
 * Renders a fully functional SSH terminal in the browser that connects
 * to a robot via WebSocket.
 * 
 * @param robotId - Unique identifier of the robot to connect to
 * @param sshUsername - SSH username (e.g., 'pi')
 * @param sshPassword - SSH password
 * @param onClose - Optional callback when terminal is closed
 */
const SSHTerminal: React.FC<SSHTerminalProps> = ({
  robotId,
  sshUsername,
  sshPassword,
  onClose
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      }
    });

    // Create fit addon for responsive terminal sizing
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Attach terminal to DOM
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Display connecting message
    terminal.writeln('Connecting to SSH server...');
    terminal.writeln(`Robot: ${robotId}`);
    terminal.writeln('');

    // Establish WebSocket connection to backend
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.REACT_APP_BACKEND_PORT || '8000';
    const wsUrl = `${protocol}//${host}:${port}/api/v1/ssh/connect/${robotId}?ssh_username=${encodeURIComponent(sshUsername)}&ssh_password=${encodeURIComponent(sshPassword)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    // WebSocket event handlers
    ws.onopen = () => {
      setConnectionStatus('connected');
      terminal.writeln('\x1b[32mConnected! SSH session established.\x1b[0m');
      terminal.writeln('');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'output') {
          // Write SSH output to terminal
          terminal.write(message.data);
        } else if (message.type === 'error') {
          // Display error message
          terminal.writeln(`\r\n\x1b[31mError: ${message.message}\x1b[0m\r\n`);
          setErrorMessage(message.message);
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      terminal.writeln('\r\n\x1b[31mConnection error occurred.\x1b[0m\r\n');
      setConnectionStatus('error');
      setErrorMessage('WebSocket connection error');
    };

    ws.onclose = () => {
      terminal.writeln('\r\n\x1b[33mConnection closed.\x1b[0m\r\n');
      setConnectionStatus('disconnected');
    };

    // Handle terminal input (keyboard)
    terminal.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'input',
          data: data
        }));
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddon && terminal) {
        fitAddon.fit();
        
        // Send new terminal size to backend
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'resize',
            cols: terminal.cols,
            rows: terminal.rows
          }));
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (ws) {
        ws.close();
      }
      
      if (terminal) {
        terminal.dispose();
      }
    };
  }, [robotId, sshUsername, sshPassword]);

  return (
    <div className="ssh-terminal-container flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Header with status and close button */}
      <div className="terminal-header flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              connectionStatus === 'error' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <span className="text-sm text-gray-300 font-medium">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'error' ? 'Connection Error' :
               'Disconnected'}
            </span>
          </div>
          <span className="text-sm text-gray-400">
            {robotId} @ {sshUsername}
          </span>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close terminal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error message display */}
      {errorMessage && (
        <div className="px-4 py-2 bg-red-900 bg-opacity-50 text-red-200 text-sm">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {/* Terminal display */}
      <div 
        ref={terminalRef} 
        className="terminal-body flex-1 p-2"
        style={{ height: '100%' }}
      />

      {/* Footer with instructions */}
      <div className="terminal-footer px-4 py-2 bg-gray-800 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          Type commands and press Enter. Use Ctrl+C to interrupt. Close this window to disconnect.
        </p>
      </div>
    </div>
  );
};

export default SSHTerminal;
