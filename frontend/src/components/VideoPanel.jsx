/**
 * Video Panel Component
 * 
 * Displays the Azure Avatar video stream via WebRTC
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff } from 'lucide-react';

/**
 * VideoPanel Component
 * 
 * @param {Object} props
 * @param {React.RefObject} props.videoRef - Reference to the video element
 * @param {boolean} props.isConnected - Whether video stream is connected
 * @param {string} props.avatarName - Name of the avatar (for display)
 */
export function VideoPanel({ videoRef, isConnected = false, avatarName = 'Avatar' }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isConnected ? (
              <>
                <Video className="h-5 w-5 text-primary" />
                Live Video
              </>
            ) : (
              <>
                <VideoOff className="h-5 w-5 text-muted-foreground" />
                Video
              </>
            )}
          </CardTitle>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Verbunden' : 'Nicht verbunden'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative w-full aspect-[3/4] bg-secondary rounded-b-lg overflow-hidden">
          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={false}
          />
          
          {/* Overlay when not connected */}
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/80">
              <div className="text-center">
                <VideoOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Video wird geladen...
                </p>
              </div>
            </div>
          )}
          
          {/* Avatar Name Badge (when connected) */}
          {isConnected && avatarName && (
            <div className="absolute bottom-4 left-4">
              <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-sm">
                {avatarName}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default VideoPanel;

