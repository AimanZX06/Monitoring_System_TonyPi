import { useState, useEffect, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { MqttMessage } from '../types';

interface UseMqttOptions {
  brokerUrl?: string;
  options?: mqtt.IClientOptions;
  topics?: string[];
}

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