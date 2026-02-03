/**
 * Radio panel component - pure white theme.
 * @module ui/components/RadioPanel
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface RadioPanelProps {
  station?: string;
  playing?: boolean;
}

const STATIONS = [
  { name: 'Lofi Girl', freq: '98.7' },
  { name: 'Chillhop', freq: '101.3' },
  { name: 'SomaFM', freq: '104.9' },
  { name: 'Nightride', freq: '107.1' },
  { name: 'Box Lofi', freq: '90.3' },
];

const VISUALIZER_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

function generateBars(count: number, frame: number): string[] {
  const bars: string[] = [];
  for (let i = 0; i < count; i++) {
    const phase = (frame * 0.15 + i * 0.7) % (Math.PI * 2);
    const wave1 = Math.sin(phase) * 0.5 + 0.5;
    const wave2 = Math.sin(phase * 1.5 + i) * 0.3 + 0.5;
    const combined = (wave1 + wave2) / 2;
    const level = Math.floor(combined * (VISUALIZER_CHARS.length - 1));
    bars.push(VISUALIZER_CHARS[Math.max(0, Math.min(level, VISUALIZER_CHARS.length - 1))]);
  }
  return bars;
}

function Visualizer({ frame, barCount = 16 }: { frame: number; barCount?: number }) {
  const bars = generateBars(barCount, frame);

  return (
    <Box>
      {bars.map((char, i) => {
        const level = VISUALIZER_CHARS.indexOf(char);
        const bold = level >= 5; // Bold for tall bars
        return <Text key={i} color="white" dimColor={level < 4} bold={bold}>{char}</Text>;
      })}
    </Box>
  );
}

function WaveformVisualizer({ frame }: { frame: number }) {
  const width = 20;
  let wave = '';
  for (let i = 0; i < width; i++) {
    const phase = (frame * 0.2 + i * 0.5) % (Math.PI * 2);
    const y = Math.sin(phase);
    if (y > 0.5) wave += '█';
    else if (y > 0) wave += '▓';
    else if (y > -0.5) wave += '▒';
    else wave += '░';
  }
  return <Text color="white" dimColor>{wave}</Text>;
}

function SpinningDisc({ frame }: { frame: number }) {
  const frames = ['◐', '◓', '◑', '◒'];
  const discFrame = frames[frame % frames.length];
  return <Text color="white" bold>{discFrame}</Text>;
}

export function RadioPanel({ station, playing = true }: RadioPanelProps) {
  const [frame, setFrame] = useState(0);
  const [stationIndex, setStationIndex] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => setFrame((f) => f + 1), 100);
    return () => clearInterval(interval);
  }, [playing]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStationIndex((i) => (i + 1) % STATIONS.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentStation = STATIONS[stationIndex];

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      padding={1}
    >
      <Box marginBottom={1} justifyContent="space-between">
        <Text color="white" dimColor bold>RADIO</Text>
        {playing && <SpinningDisc frame={frame} />}
      </Box>

      <Box justifyContent="center">
        <Text color="white" bold={playing}>FM {currentStation.freq}</Text>
      </Box>

      <Box justifyContent="center">
        <Text color="white" dimColor>{currentStation.name}</Text>
      </Box>

      <Box justifyContent="center" marginTop={1}>
        {playing ? (
          <Visualizer frame={frame} barCount={12} />
        ) : (
          <Text color="white" dimColor>{'░'.repeat(12)}</Text>
        )}
      </Box>

      <Box justifyContent="center">
        {playing ? (
          <WaveformVisualizer frame={frame} />
        ) : (
          <Text color="white" dimColor>{'─'.repeat(20)}</Text>
        )}
      </Box>

      <Box marginTop={1} justifyContent="center">
        <Text color="white" bold={playing} dimColor={!playing}>
          {playing ? '▶ LIVE' : '■ OFF'}
        </Text>
      </Box>
    </Box>
  );
}
