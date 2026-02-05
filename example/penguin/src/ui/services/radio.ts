/**
 * Radio streaming service - plays lofi audio streams.
 * @module ui/services/radio
 */

import { spawn, ChildProcess } from 'child_process';

// Lofi radio stream URLs (CORS-friendly, no auth required)
export const RADIO_STATIONS = [
  {
    name: 'Lofi Girl',
    url: 'https://play.streamafrica.net/lofiradio',
    freq: '98.7',
  },
  {
    name: 'Chillhop',
    url: 'http://stream.zeno.fm/fyn8eh3h5f8uv',
    freq: '101.3',
  },
  {
    name: 'Box Lofi',
    url: 'http://stream.zeno.fm/f3wvbbqmdg8uv',
    freq: '104.9',
  },
  {
    name: 'Nightride FM',
    url: 'https://stream.nightride.fm/nightride.ogg',
    freq: '107.1',
  },
  {
    name: 'SomaFM Groove',
    url: 'https://somafm.com/groovesalad.pls',
    freq: '90.3',
  },
];

type PlayerType = 'mpv' | 'ffplay' | 'vlc' | 'none';

let currentProcess: ChildProcess | null = null;
let currentStation = 0;
let isPlaying = false;
let detectedPlayer: PlayerType | null = null;

/**
 * Detect available audio player on the system.
 */
async function detectPlayer(): Promise<PlayerType> {
  if (detectedPlayer !== null) return detectedPlayer;

  const players: { name: PlayerType; cmd: string }[] = [
    { name: 'mpv', cmd: 'mpv' },
    { name: 'ffplay', cmd: 'ffplay' },
    { name: 'vlc', cmd: 'vlc' },
  ];

  for (const player of players) {
    try {
      const proc = spawn(player.cmd, ['--version'], {
        stdio: 'ignore',
        shell: true,
      });

      const found = await new Promise<boolean>((resolve) => {
        proc.on('error', () => resolve(false));
        proc.on('close', (code) => resolve(code === 0));
        setTimeout(() => {
          proc.kill();
          resolve(false);
        }, 1000);
      });

      if (found) {
        detectedPlayer = player.name;
        return player.name;
      }
    } catch {
      continue;
    }
  }

  detectedPlayer = 'none';
  return 'none';
}

/**
 * Start playing the current radio station.
 */
export async function startRadio(): Promise<{ success: boolean; message: string }> {
  if (isPlaying) {
    return { success: true, message: 'Already playing' };
  }

  const player = await detectPlayer();

  if (player === 'none') {
    return {
      success: false,
      message: 'No audio player found. Install mpv, ffplay, or vlc.',
    };
  }

  const station = RADIO_STATIONS[currentStation];
  let args: string[] = [];

  switch (player) {
    case 'mpv':
      args = ['--no-video', '--really-quiet', station.url];
      break;
    case 'ffplay':
      args = ['-nodisp', '-autoexit', '-loglevel', 'quiet', station.url];
      break;
    case 'vlc':
      args = ['--intf', 'dummy', '--no-video', station.url];
      break;
  }

  try {
    currentProcess = spawn(player, args, {
      stdio: 'ignore',
      detached: false,
      shell: true,
    });

    currentProcess.on('error', () => {
      isPlaying = false;
      currentProcess = null;
    });

    currentProcess.on('close', () => {
      isPlaying = false;
      currentProcess = null;
    });

    isPlaying = true;
    return { success: true, message: `Playing ${station.name} via ${player}` };
  } catch (err) {
    return { success: false, message: `Failed to start: ${err}` };
  }
}

/**
 * Stop the currently playing radio.
 */
export function stopRadio(): void {
  if (currentProcess) {
    currentProcess.kill();
    currentProcess = null;
  }
  isPlaying = false;
}

/**
 * Toggle radio playback.
 */
export async function toggleRadio(): Promise<{ success: boolean; message: string; playing: boolean }> {
  if (isPlaying) {
    stopRadio();
    return { success: true, message: 'Radio stopped', playing: false };
  } else {
    const result = await startRadio();
    return { ...result, playing: result.success };
  }
}

/**
 * Switch to the next radio station.
 */
export async function nextStation(): Promise<{ success: boolean; message: string }> {
  const wasPlaying = isPlaying;
  stopRadio();

  currentStation = (currentStation + 1) % RADIO_STATIONS.length;

  if (wasPlaying) {
    return startRadio();
  }

  return { success: true, message: `Switched to ${RADIO_STATIONS[currentStation].name}` };
}

/**
 * Get current radio state.
 */
export function getRadioState() {
  return {
    playing: isPlaying,
    station: RADIO_STATIONS[currentStation],
    stationIndex: currentStation,
  };
}

/**
 * Check if an audio player is available.
 */
export async function checkAudioSupport(): Promise<boolean> {
  const player = await detectPlayer();
  return player !== 'none';
}
