'use client';

import React, { useState, useEffect, useRef } from 'react';
import ZoomVideo from '@zoom/videosdk';
import axios from 'axios';

interface VideoCallProps {
  consultationId: string;
  userRole: 'patient' | 'nurse' | 'doctor';
  userName: string;
  onEndCall: () => void;
  className?: string;
}

const VideoCall: React.FC<VideoCallProps> = ({
  consultationId,
  userRole,
  userName,
  onEndCall,
  className = ''
}) => {
  const [session, setSession] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);

  // Initialize Zoom SDK
  useEffect(() => {
    const initZoom = async () => {
      try {
        setIsLoading(true);
        
        // Get session token from backend
        const response = await axios.post('/api/zoom/get-session', {
          consultationId,
          userRole,
          userName
        });
        
        const { signature, sessionName, password } = response.data;

        // Initialize Zoom client with correct SDK v2.3.5 syntax
        const client = ZoomVideo.createClient();

        // Initialize the client
        await client.init('en-US');

        // Set up event listeners before joining
        client.on('connection-change', (payload: any) => {
          setConnectionState(payload.state);
          if (payload.state === 'connected') {
            setIsConnected(true);
          }
        });

        client.on('user-added', (payload: any) => {
          setParticipants(prev => [...prev, payload.payload]);
        });

        client.on('user-removed', (payload: any) => {
          setParticipants(prev => prev.filter(p => p.userId !== payload.payload.userId));
        });

        client.on('peer-video-state-change', (payload: any) => {
          // Handle video state changes
          console.log('Video state changed:', payload);
        });

        client.on('peer-audio-state-change', (payload: any) => {
          // Handle audio state changes
          console.log('Audio state changed:', payload);
        });

        // Join the session
        await client.join(signature, sessionName, userName, password);

        // Get media stream after joining
        const stream = client.getMediaStream();
        
        // Start with audio muted and video off
        await stream.muteAudio();
        await stream.stopVideo();

        setSession(client);
        setIsLoading(false);

      } catch (err) {
        console.error('Error initializing Zoom:', err);
        setError('Erro ao conectar à videochamada');
        setIsLoading(false);
      }
    };

    initZoom();

    return () => {
      if (session) {
        session.leave();
      }
    };
  }, [consultationId, userRole, userName]);

  // Toggle audio
  const toggleAudio = async () => {
    if (!session) return;
    
    try {
      const stream = session.getMediaStream();
      if (isAudioOn) {
        await stream.muteAudio();
        setIsAudioOn(false);
      } else {
        await stream.unmuteAudio();
        setIsAudioOn(true);
      }
    } catch (err) {
      console.error('Error toggling audio:', err);
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (!session) return;
    
    try {
      const stream = session.getMediaStream();
      if (isVideoOn) {
        await stream.stopVideo();
        setIsVideoOn(false);
      } else {
        await stream.startVideo();
        setIsVideoOn(true);
      }
    } catch (err) {
      console.error('Error toggling video:', err);
    }
  };

  // End call
  const handleEndCall = async () => {
    if (session) {
      try {
        await session.leave();
        
        // Update consultation status
        await axios.post(`/api/consultas/${consultationId}/encerrar`, {
          role: userRole
        });
        
        onEndCall();
      } catch (err) {
        console.error('Error ending call:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Conectando à videochamada...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xl mb-2">Erro na Conexão</p>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={onEndCall}
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-white text-lg font-semibold">
            {userRole === 'patient' ? 'Consulta Médica' : 'Atendimento'}
          </h2>
          <span className="text-gray-400 text-sm">
            {connectionState === 'connected' ? 'Conectado' : 'Conectando...'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">
            Participantes: {participants.length + 1}
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative" ref={videoContainerRef}>
        {/* Local Video */}
        <div
          ref={localVideoRef}
          className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg shadow-lg z-10"
        >
          <div className="w-full h-full flex items-center justify-center">
            {!isVideoOn && (
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">{userName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Remote Videos */}
        <div className="w-full h-full flex items-center justify-center">
          {participants.length === 0 ? (
            <div className="text-center text-gray-400">
              <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p>Aguardando outros participantes...</p>
            </div>
          ) : (
            <div className="w-full h-full">
              {/* Remote video participant */}
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-lg">{participants[0]?.displayName || 'Participante'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-colors ${
              isAudioOn 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioOn ? 'Desativar áudio' : 'Ativar áudio'}
          >
            {isAudioOn ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              isVideoOn 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoOn ? 'Desativar vídeo' : 'Ativar vídeo'}
          >
            {isVideoOn ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
            title="Encerrar chamada"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;