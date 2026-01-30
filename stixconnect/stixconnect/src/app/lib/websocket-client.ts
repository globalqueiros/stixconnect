/**
 * Cliente WebSocket para comunicação em tempo real durante consultas
 */

import { tokenStorage } from './api-client';

export type WebSocketMessageType = 
  | 'message'
  | 'status_update'
  | 'typing'
  | 'participants_list'
  | 'user_joined'
  | 'user_left'
  | 'ping'
  | 'pong'
  | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  sender?: {
    id: number;
    nome: string;
    role: string;
  };
  user?: {
    id: number;
    nome: string;
    role: string;
  };
  content?: string;
  status?: string;
  participants?: Array<{
    id: number;
    nome: string;
    role: string;
  }>;
  is_typing?: boolean;
  timestamp?: string;
  message?: string;
}

export type MessageHandler = (message: WebSocketMessage) => void;

export class ConsultationWebSocket {
  private ws: WebSocket | null = null;
  private consultaId: number;
  private apiBaseUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private handlers: Map<WebSocketMessageType, MessageHandler[]> = new Map();
  private isIntentionalClose = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(consultaId: number) {
    this.consultaId = consultaId;
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  /**
   * Conecta ao WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Já conectado
    }

    return new Promise((resolve, reject) => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        reject(new Error('Token de autenticação não encontrado'));
        return;
      }

      // Converter http:// para ws:// e https:// para wss://
      const wsUrl = this.apiBaseUrl
        .replace(/^http:/, 'ws:')
        .replace(/^https:/, 'wss:');
      
      const url = `${wsUrl}/ws/consultations/${this.consultaId}?token=${encodeURIComponent(token)}`;

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log(`WebSocket conectado para consulta ${this.consultaId}`);
          this.reconnectAttempts = 0;
          this.startPingInterval();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Erro ao processar mensagem WebSocket:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Erro no WebSocket:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket fechado:', event.code, event.reason);
          this.stopPingInterval();

          // Reconectar se não foi fechamento intencional
          if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Reconectando em ${delay}ms... (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect().catch(console.error), delay);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Envia uma mensagem
   */
  send(type: WebSocketMessageType, data?: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket não está conectado');
      return;
    }

    const message = {
      type,
      ...data,
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Envia mensagem de chat
   */
  sendMessage(content: string): void {
    this.send('message', { content });
  }

  /**
   * Envia indicador de digitação
   */
  sendTyping(isTyping: boolean): void {
    this.send('typing', { is_typing: isTyping });
  }

  /**
   * Registra um handler para um tipo de mensagem
   */
  on(type: WebSocketMessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);

    // Retorna função para remover handler
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Remove todos os handlers de um tipo
   */
  off(type: WebSocketMessageType): void {
    this.handlers.delete(type);
  }

  /**
   * Processa mensagem recebida
   */
  private handleMessage(message: WebSocketMessage): void {
    // Chamar handlers específicos do tipo
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Erro ao executar handler:', error);
        }
      });
    }

    // Chamar handlers genéricos ('*')
    const allHandlers = this.handlers.get('*' as WebSocketMessageType);
    if (allHandlers) {
      allHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Erro ao executar handler genérico:', error);
        }
      });
    }
  }

  /**
   * Inicia intervalo de ping para manter conexão ativa
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping');
      }
    }, 30000); // Ping a cada 30 segundos
  }

  /**
   * Para intervalo de ping
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Retorna estado da conexão
   */
  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }
}

/**
 * Hook React para usar WebSocket em componentes
 * NOTA: Este hook requer React. Importe-o onde necessário:
 * 
 * import { useEffect, useState } from 'react';
 * import { ConsultationWebSocket } from '@/app/lib/websocket-client';
 * 
 * function MyComponent({ consultaId }: { consultaId: number }) {
 *   const [ws, setWs] = useState<ConsultationWebSocket | null>(null);
 *   const [isConnected, setIsConnected] = useState(false);
 * 
 *   useEffect(() => {
 *     if (!consultaId) return;
 * 
 *     const websocket = new ConsultationWebSocket(consultaId);
 *     setWs(websocket);
 * 
 *     websocket.connect()
 *       .then(() => setIsConnected(true))
 *       .catch(error => {
 *         console.error('Erro ao conectar WebSocket:', error);
 *         setIsConnected(false);
 *       });
 * 
 *     return () => {
 *       websocket.disconnect();
 *     };
 *   }, [consultaId]);
 * 
 *   return { ws, isConnected };
 * }
 */
