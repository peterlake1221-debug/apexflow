import React from 'react';
import { Volume2, VolumeX, CloudRain, Headphones, Radio } from 'lucide-react';
import { FocusAudioTrack } from '../types/app';

interface FocusAudioBarProps {
  activeTrack: FocusAudioTrack;
  muted: boolean;
  onSelectTrack: (track: FocusAudioTrack) => void;
  onToggleMute: () => void;
}

const TRACKS: Array<{
  id: Exclude<FocusAudioTrack, 'off'>;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'rain', label: 'Soft Rain', icon: <CloudRain className="w-3.5 h-3.5" /> },
  { id: 'lofi', label: 'Lo-Fi Study Hum', icon: <Headphones className="w-3.5 h-3.5" /> },
  { id: 'white-noise', label: 'White Noise', icon: <Radio className="w-3.5 h-3.5" /> },
];

export const FocusAudioBar: React.FC<FocusAudioBarProps> = ({
  activeTrack,
  muted,
  onSelectTrack,
  onToggleMute,
}) => {
  return (
    <div
      data-testid="focus-audio-bar"
      className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-950/75 border border-white/10 px-2.5 py-1.5"
    >
      <span className="text-[11px] font-medium text-slate-400 mr-1 whitespace-nowrap">
        Focus Audio:
      </span>

      {TRACKS.map((track) => {
        const selected = activeTrack === track.id;
        return (
          <button
            key={track.id}
            type="button"
            onClick={() => onSelectTrack(selected ? 'off' : track.id)}
            aria-pressed={selected}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              selected
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {track.icon}
            <span>{track.label}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute focus audio' : 'Mute focus audio'}
        title={muted ? 'Unmute Audio' : 'Mute Audio'}
        className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
          muted
            ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
        }`}
      >
        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-300" />}
        <span>{muted ? 'Muted' : 'Sound On'}</span>
      </button>
    </div>
  );
};
