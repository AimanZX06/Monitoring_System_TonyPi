/**
 * =============================================================================
 * useMqtt Hook - Real-Time MQTT Communication for React
 * =============================================================================
 * 
 * This custom React hook provides MQTT connectivity for the frontend,
 * enabling real-time communication with TonyPi robots via WebSocket.
 * 
 * WHY MQTT IN FRONTEND?
 *   While the backend handles most MQTT processing, the frontend can also
 *   connect directly to receive real-time updates without polling:
 *   - Instant status updates when robot connects/disconnects
 *   - Live sensor data streaming for real-time dashboards
 *   - Direct command publishing for faster robot control
 * 
 * WEBSOCKET CONNECTION:
 *   MQTT typically uses TCP port 1883, but browsers can only use WebSocket.
 *   Mosquitto broker exposes WebSocket on port 9001 (configured in mosquitto.conf).
 *   
 *   Connection: Frontend → ws://localhost:9001 → Mosquitto → Robot
 * 
 * FEATURES:
 *   - Auto-connect on component mount
 *   - Auto-reconnect on connection loss
 *   - Message history (last 100 messages)
 *   - Subscribe/unsubscribe to topics dynamically
 *   - Publish messages to any topic
 *   - Connection status tracking
 *   - Error handling
 * 
 * USAGE:
 *   const { isConnected, messages, publish, subscribe } = useMqtt({
 *     topics: ['tonypi/status/#', 'tonypi/sensors/#']
 *   });
 *   
 *   // Publish a command
 *   publish('tonypi/commands', { type: 'move', direction: 'forward' });
 *   
 *   // Messages array contains recent messages from subscribed topics
 *   messages.forEach(msg => console.log(msg.topic, msg.payload));
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React hooks
import { useState, useEffect, useCallback, useRef } from 'react';

// MQTT.js - JavaScript MQTT client library
// Supports WebSocket connections in browsers
import mqtt, { MqttClient } from 'mqtt';

// TypeScript type for MQTT messages
import { MqttMessage } from '../types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Configuration options for the useMqtt hook
 */
interface UseMqttOptions {
  /** WebSocket URL to MQTT broker (default: ws://localhost:9001) */
  brokerUrl?: string;
  /** Additional MQTT client options */
  options?: mqtt.IClientOptions;
  /** Topics to subscribe to on connect */
  topics?: string[];
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom hook for MQTT connectivity
 * 
 * @param options - Configuration options for MQTT connection
 * @returns Object with connection state, messages, and control functions
 */
export const useMqtt = ({ 
  brokerUrl = process.env.REACT_APP_MQTT_BROKER_URL || 'ws://localhost:9001',
  options = {},
  topics = []
}: UseMqttOptions = {}) => {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<MqttMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<MqttClient | null>(null);

  // Connect to MQTT broker
  const connect = useCallback(() => {
    try {
      const mqttClient = mqtt.connect(brokerUrl, {
        ...options,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        clean: true,
      });

      mqttClient.on('connect', () => {
        console.log('MQTT: Connected to broker');
        setIsConnected(true);
        setError(null);
        
        // Subscribe to initial topics
        topics.forEach(topic => {
          mqttClient.subscribe(topic, (err) => {
            if (err) {
              console.error(`MQTT: Failed to subscribe to ${topic}:`, err);
            } else {
              console.log(`MQTT: Subscribed to ${topic}`);
            }
          });
        });
      });

      mqttClient.on('error', (err) => {
        console.error('MQTT: Connection error:', err);
        setError(err.message);
        setIsConnected(false);
      });

      mqttClient.on('message', (topic, payload) => {
        try {
          const message: MqttMessage = {
            topic,
            payload: JSON.parse(payload.toString()),
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev.slice(-99), message]); // Keep last 100 messages
        } catch (parseError) {
          console.error('MQTT: Error parsing message:', parseError);
        }
      });

      mqttClient.on('close', () => {
        console.log('MQTT: Connection closed');
        setIsConnected(false);
      });

      mqttClient.on('disconnect', () => {
        console.log('MQTT: Disconnected');
        setIsConnected(false);
      });

      setClient(mqttClient);
      clientRef.current = mqttClient;

    } catch (err) {
      console.error('MQTT: Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [brokerUrl, options, topics]);

  // Disconnect from MQTT broker
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end();
      setClient(null);
      clientRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Subscribe to a topic
  const subscribe = useCallback((topic: string) => {
    if (client && isConnected) {
      client.subscribe(topic, (err) => {
        if (err) {
          console.error(`MQTT: Failed to subscribe to ${topic}:`, err);
          setError(`Failed to subscribe to ${topic}`);
        } else {
          console.log(`MQTT: Subscribed to ${topic}`);
        }
      });
    }
  }, [client, isConnected]);

  // Unsubscribe from a topic
  const unsubscribe = useCallback((topic: string) => {
    if (client && isConnected) {
      client.unsubscribe(topic, (err) => {
        if (err) {
          console.error(`MQTT: Failed to unsubscribe from ${topic}:`, err);
        } else {
          console.log(`MQTT: Unsubscribed from ${topic}`);
        }
      });
    }
  }, [client, isConnected]);

  // Publish a message
  const publish = useCallback((topic: string, message: any) => {
    if (client && isConnected) {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      client.publish(topic, payload, (err) => {
        if (err) {
          console.error(`MQTT: Failed to publish to ${topic}:`, err);
          setError(`Failed to publish to ${topic}`);
        } else {
          console.log(`MQTT: Published to ${topic}`);
        }
      });
    }
  }, [client, isConnected]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    client,
    isConnected,
    messages,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    clearMessages,
  };
};