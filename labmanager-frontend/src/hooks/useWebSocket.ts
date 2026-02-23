import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';

export const useWebSocket = (subscribeUrl?: string, onMessage?: (message: any) => void) => {
    const { user } = useAuth();
    const clientRef = useRef<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user || !user.token) return;

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: {
                Authorization: `Bearer ${user.token}`,
            },
            debug: (/*str*/) => {
                // Uncomment for debugging
                // console.log('STOMP: ' + str); 
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            setIsConnected(true);
            console.log('Connected to WebSocket Server');

            if (subscribeUrl && onMessage) {
                client.subscribe(subscribeUrl, (message) => {
                    if (message.body) {
                        try {
                            const parsed = JSON.parse(message.body);
                            onMessage(parsed);
                        } catch (e) {
                            // If it's pure text
                            onMessage(message.body);
                        }
                    }
                });
            }
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
            setIsConnected(false);
        };
    }, [user, subscribeUrl]); // Re-connect if token/user changes

    return { isConnected, client: clientRef.current };
};
