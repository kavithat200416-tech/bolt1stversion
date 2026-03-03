import React, { useState } from 'react';
import { Music } from 'lucide-react';

interface SongCardProps {
  song: any;
  onClick?: () => void;
  badge?: string;
  badgeColor?: string;
}

const SongCard = React.memo(function SongCard({ song, onClick, badge, badgeColor = 'accent-primary' }: SongCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="group text-left transition-all transform hover:scale-105"
    >
      <div className="relative mb-3 rounded-t-lg overflow-hidden bg-bg-card aspect-square">
        {imageError || !song.cover_image ? (
          <div className="w-full h-full bg-bg-card flex items-center justify-center">
            <Music className="w-8 h-8 text-text-muted" />
          </div>
        ) : (
          <img
            src={song.cover_image}
            alt={song.title}
            loading="lazy"
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform ${isHovering ? 'scale-105' : ''}`}
          />
        )}

        {badge && (
          <div className={`absolute top-2 right-2 bg-${badgeColor} text-text-primary text-xs font-semibold px-2 py-1 rounded-full`}>
            {badge}
          </div>
        )}

        {isHovering && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <button className="bg-accent-primary text-text-primary rounded-full p-3 hover:bg-accent-hover transition-all">
              <Music className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      <div className="px-2 space-y-1">
        <h3 className="font-heading text-[13px] text-text-primary truncate">
          {song.title}
        </h3>
        <p className="font-body text-[11px] text-text-muted truncate">
          {song.artist_name}
        </p>
        <p className="font-body text-[10px] text-text-very">
          {song.year} · {song.language}
        </p>
      </div>
    </button>
  );
});

export default SongCard;
