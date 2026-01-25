/**
 * SSH Terminal Modal Component
 * =============================
 * 
 * A modal dialog that displays the SSH terminal component.
 * This provides a full-screen overlay terminal experience.
 */

import React, { useState } from 'react';
import SSHTerminal from './SSHTerminal';

interface SSHTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  robotId: string;
  robotName?: string;
}

/**
 * SSH Terminal Modal
 * 
 * Shows an SSH terminal in a modal overlay for connecting to a robot.
 * Prompts for SSH credentials if not provided.
 * 
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback to close the modal
 * @param robotId - ID of the robot to connect to
 * @param robotName - Optional display name of the robot
 */
const SSHTerminalModal: React.FC<SSHTerminalModalProps> = ({
  isOpen,
  onClose,
  robotId,
  robotName
}) => {
  const [sshUsername, setSshUsername] = useState('pi');
  const [sshPassword, setSshPassword] = useState('');
  const [showCredentials, setShowCredentials] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleConnect = () => {
    if (!sshUsername || !sshPassword) {
      alert('Please enter both username and password');
      return;
    }
    setShowCredentials(false);
    setIsConnecting(true);
  };

  const handleClose = () => {
    setSshUsername('pi');
    setSshPassword('');
    setShowCredentials(true);
    setIsConnecting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={handleClose}
      />
      
      {/* Modal content */}
      <div className="relative z-10 w-full max-w-6xl h-5/6 mx-4 bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
        {showCredentials ? (
          // Credentials form
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-full max-w-md bg-gray-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-2">
                Connect to {robotName || robotId}
              </h2>
              <p className="text-gray-400 mb-6">
                Enter SSH credentials to establish a terminal session
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="ssh-username" className="block text-sm font-medium text-gray-300 mb-2">
                    SSH Username
                  </label>
                  <input
                    id="ssh-username"
                    type="text"
                    value={sshUsername}
                    onChange={(e) => setSshUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="pi"
                  />
                </div>
                
                <div>
                  <label htmlFor="ssh-password" className="block text-sm font-medium text-gray-300 mb-2">
                    SSH Password
                  </label>
                  <input
                    id="ssh-password"
                    type="password"
                    value={sshPassword}
                    onChange={(e) => setSshPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleConnect}
                  disabled={!sshUsername || !sshPassword}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Connect
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <div className="mt-6 p-4 bg-gray-900 rounded-md">
                <p className="text-xs text-gray-400">
                  <strong className="text-gray-300">Default Credentials:</strong><br />
                  Username: pi<br />
                  Password: raspberry (or your custom password)
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Terminal view
          <SSHTerminal
            robotId={robotId}
            sshUsername={sshUsername}
            sshPassword={sshPassword}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
};

export default SSHTerminalModal;
