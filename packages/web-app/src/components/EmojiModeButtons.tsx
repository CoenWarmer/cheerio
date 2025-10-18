import { Button } from '@mantine/core';
import { ConfettiIcon } from './icons/ConfettiIcon';
import { HeartIcon } from './icons/HeartIcon';
import { useMap, useMapEvents } from 'react-leaflet';
import confetti from 'canvas-confetti';

export type EmojiMode = 'confetti' | 'heart' | null;

interface EmojiModeButtonsProps {
  emojiMode: EmojiMode;
  onEmojiModeChange: (mode: EmojiMode) => void;
}

interface MapClickHandlerProps {
  emojiMode: EmojiMode;
  eventSlug: string;
  onMessageSent: (lat: number, lng: number) => void;
}

export function EmojiModeButtons({
  emojiMode,
  onEmojiModeChange,
}: EmojiModeButtonsProps) {
  return (
    <>
      {/* Confetti Button */}
      <Button
        variant="filled"
        onClick={() =>
          onEmojiModeChange(emojiMode === 'confetti' ? null : 'confetti')
        }
        style={{
          position: 'absolute',
          borderRadius: 100,
          height: 60,
          width: 60,
          top: '35%',
          left: 10,
          zIndex: 500,
          boxShadow: '2px 2px 2px rgba(0,0,0,0.2)',
          backgroundColor: emojiMode === 'confetti' ? '#ff6b6b' : '#228be6',
          opacity: emojiMode === 'confetti' ? 1 : 0.9,
          transform: emojiMode === 'confetti' ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.3s ease',
        }}
        title={
          emojiMode === 'confetti'
            ? 'Confetti mode active - click map to celebrate!'
            : 'Click to enable confetti mode'
        }
      >
        <ConfettiIcon size={60} />
      </Button>

      {/* Heart Button */}
      <Button
        variant="filled"
        onClick={() =>
          onEmojiModeChange(emojiMode === 'heart' ? null : 'heart')
        }
        style={{
          position: 'absolute',
          borderRadius: 100,
          height: 60,
          width: 60,
          top: 'calc(35% + 70px)',
          left: 10,
          zIndex: 500,
          boxShadow: '2px 2px 2px rgba(0,0,0,0.2)',
          backgroundColor: emojiMode === 'heart' ? '#ff6b6b' : '#fa5252',
          opacity: emojiMode === 'heart' ? 1 : 0.9,
          transform: emojiMode === 'heart' ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.3s ease',
        }}
        title={
          emojiMode === 'heart'
            ? 'Heart mode active - click map to send love!'
            : 'Click to enable heart mode'
        }
      >
        <HeartIcon size={60} />
      </Button>
    </>
  );
}

// MapClickHandler must be rendered inside MapContainer
export function EmojiModeMapClickHandler({
  emojiMode,
  eventSlug,
  onMessageSent,
}: MapClickHandlerProps) {
  const map = useMap();

  useMapEvents({
    click: e => {
      if (emojiMode && eventSlug) {
        const { lat, lng } = e.latlng;

        // Get the container point (pixel coordinates) from the lat/lng
        const point = map.latLngToContainerPoint(e.latlng);

        // Get the map container's bounding rect to calculate position relative to viewport
        const mapContainer = map.getContainer();
        const rect = mapContainer.getBoundingClientRect();

        // Calculate normalized coordinates (0 to 1) for confetti
        const x = (rect.left + point.x) / window.innerWidth;
        const y = (rect.top + point.y) / window.innerHeight;

        // Trigger visual effect based on emoji mode
        if (emojiMode === 'confetti') {
          // Regular confetti explosion
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { x, y },
            colors: ['#228be6', '#ff6b6b', '#51cf66', '#ffd43b', '#ff8787'],
            ticks: 200,
          });
        } else if (emojiMode === 'heart') {
          // Heart emoji confetti
          const scalar = 2;
          const heart = confetti.shapeFromText({ text: '❤️', scalar });

          confetti({
            particleCount: 30,
            spread: 60,
            startVelocity: 30,
            origin: { x, y },
            shapes: [heart],
            scalar,
            ticks: 150,
          });
        }

        onMessageSent(lat, lng);
      }
    },
  });

  return null;
}
