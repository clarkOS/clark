/**
 * Main application component - Face-centric layout, pure white theme.
 * @module ui/App
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { CompactHeader } from './components/Header.js';
import { ClarkTerminal, ClarkHologram } from './components/ClarkTerminal.js';
import { InsightPanel, ActivityLog } from './components/InsightPanel.js';
import { RadioPanel } from './components/RadioPanel.js';
import { useAgent } from './hooks/useAgent.js';
import { toggleRadio, nextStation, stopRadio } from './services/radio.js';
import type { Backend } from '../backend/types.js';

interface AppProps {
  backend: Backend;
  refreshInterval?: number;
}

// Tertiary stat display - ghosted
function GhostStat({ label, value, pulse }: { label: string; value: string | number; pulse?: boolean }) {
  return (
    <Box>
      <Text color="white" dimColor>{label}: </Text>
      <Text color="white" dimColor={!pulse} bold={pulse}>{value}</Text>
    </Box>
  );
}

// Animated data flow indicator
function DataPulse({ frame }: { frame: number }) {
  const chars = '·∙•●•∙· ';
  const pulse = Array(16).fill(null).map((_, i) => {
    return chars[(frame + i) % chars.length];
  }).join('');

  return <Text color="white" dimColor>{pulse}</Text>;
}

// Latest artwork display (ASCII frame)
function ArtworkDisplay({ painting, frame }: { painting?: { title?: string; prompt?: string; mood?: string }; frame: number }) {
  if (!painting) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1}>
        <Text color="white" dimColor bold>LATEST ART</Text>
        <Text color="white" dimColor>No artwork yet</Text>
      </Box>
    );
  }

  const shimmer = frame % 20 < 10;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={shimmer ? 'white' : 'gray'} padding={1}>
      <Box justifyContent="space-between">
        <Text color="white" bold>LATEST ART</Text>
        <Text color="white" dimColor={!shimmer} bold={shimmer}>◈</Text>
      </Box>
      <Box marginTop={1} flexDirection="column" alignItems="center">
        <Text color="white" dimColor>╔══════════════╗</Text>
        <Text color="white" dimColor>║</Text>
        <Text color="white" bold={shimmer}> ░▒▓ ARTWORK ▓▒░ </Text>
        <Text color="white" dimColor>║</Text>
        <Text color="white" dimColor>╚══════════════╝</Text>
      </Box>
      {painting.title && (
        <Text color="white" bold>{painting.title.slice(0, 20)}</Text>
      )}
      {painting.prompt && (
        <Text color="white" dimColor italic>{painting.prompt.slice(0, 30)}...</Text>
      )}
      {painting.mood && (
        <Text color="white" dimColor>[{painting.mood}]</Text>
      )}
    </Box>
  );
}

// Vertical pulse bar
function VerticalPulse({ frame, height = 5 }: { frame: number; height?: number }) {
  const bars = Array(height).fill(null).map((_, i) => {
    const intensity = Math.sin((frame * 0.3) + i * 0.5);
    if (intensity > 0.5) return '█';
    if (intensity > 0) return '▓';
    if (intensity > -0.5) return '▒';
    return '░';
  });

  return (
    <Box flexDirection="column">
      {bars.map((bar, i) => (
        <Text key={i} color="white" dimColor>{bar}</Text>
      ))}
    </Box>
  );
}

export function App({ backend, refreshInterval = 3000 }: AppProps) {
  const { exit } = useApp();
  const { state, logs, memories, knowledge, paintings, loading, error, refresh } = useAgent({
    backend,
    refreshInterval,
  });

  const [viewMode, setViewMode] = useState<'terminal' | 'hologram'>('terminal');
  const [frame, setFrame] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioMessage, setAudioMessage] = useState('');
  const [showRadio, setShowRadio] = useState(false);

  const prevLogsCount = useRef(logs.length);
  const [newEvent, setNewEvent] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setFrame((f) => f + 1), 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logs.length > prevLogsCount.current) {
      setNewEvent(true);
      setTimeout(() => setNewEvent(false), 1000);
    }
    prevLogsCount.current = logs.length;
  }, [logs.length]);

  useEffect(() => {
    return () => stopRadio();
  }, []);

  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
    }
    if (input === 'r') {
      refresh();
    }
    if (input === 'm') {
      setShowRadio((s) => !s);
    }
    if (input === 'v') {
      setViewMode((v) => v === 'terminal' ? 'hologram' : 'terminal');
    }
    if (input === 'p') {
      toggleRadio().then((result) => {
        setAudioPlaying(result.playing);
        setAudioMessage(result.message);
        setTimeout(() => setAudioMessage(''), 3000);
      });
    }
    if (input === 'n') {
      nextStation().then((result) => {
        setAudioMessage(result.message);
        setTimeout(() => setAudioMessage(''), 3000);
      });
    }
  });

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <CompactHeader frame={frame} />
        <Box marginTop={2} flexDirection="column" alignItems="center">
          <Text color="white" bold inverse> CONNECTION ERROR </Text>
          <Text color="white" dimColor>{error}</Text>
        </Box>
        <Box marginTop={1} justifyContent="center">
          <Text color="white" dimColor>Press 'r' to retry, 'q' to quit</Text>
        </Box>
      </Box>
    );
  }

  const volatility = (state?.volatility || 50) / 100;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Compact Header */}
      <CompactHeader frame={frame} />

      {/* Top Stats Row - Tertiary (ghosted) */}
      <Box marginTop={1} justifyContent="space-between" paddingX={2}>
        <GhostStat label="TICKS" value={state?.counters?.ticks?.toLocaleString() || '0'} />
        <DataPulse frame={frame} />
        <GhostStat label="FEEDS" value={state?.counters?.feeds || 0} />
        <DataPulse frame={frame + 8} />
        <GhostStat
          label="STATUS"
          value={state?.cryo ? 'CRYO' : 'ACTIVE'}
          pulse={!state?.cryo}
        />
      </Box>

      {/* Main Content - Face Centric Layout */}
      <Box marginTop={1} flexDirection="row" justifyContent="center">
        {/* Left Column - Activity (Tertiary) */}
        <Box flexDirection="column" width="25%" paddingRight={1}>
          <Box flexDirection="column" padding={1}>
            <ActivityLog logs={logs} maxItems={10} />
          </Box>

          {showRadio && (
            <Box marginTop={1}>
              <RadioPanel playing={audioPlaying} />
            </Box>
          )}

          {paintings.length > 0 && (
            <Box marginTop={1}>
              <ArtworkDisplay painting={paintings[0]} frame={frame} />
            </Box>
          )}
        </Box>

        {/* Center Column - CLARK Face (Primary) */}
        <Box flexDirection="column" width="50%" alignItems="center">
          <VerticalPulse frame={frame} height={3} />

          {viewMode === 'terminal' ? (
            <ClarkTerminal
              mood={state?.mood || 'neutral'}
              health={state?.health || 100}
              animated={true}
              volatility={volatility}
              processing={loading}
              newEvent={newEvent}
              cryo={state?.cryo || false}
            />
          ) : (
            <ClarkHologram mood={state?.mood || 'neutral'} animated={true} />
          )}

          <VerticalPulse frame={frame + 10} height={3} />

          {audioMessage && (
            <Box marginTop={1}>
              <Text color="white" bold>♪ {audioMessage}</Text>
            </Box>
          )}
        </Box>

        {/* Right Column - Intelligence (Secondary) */}
        <Box flexDirection="column" width="25%" paddingLeft={1}>
          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="white"
            padding={1}
          >
            <InsightPanel logs={logs} maxItems={3} frame={frame} />
          </Box>
        </Box>
      </Box>

      {/* Bottom Row - Memory & Knowledge (Tertiary) */}
      <Box marginTop={1} justifyContent="center">
        <Box width="40%" marginRight={1}>
          <Box
            flexDirection="column"
            borderStyle="single"
            borderColor="gray"
            padding={1}
            width="100%"
          >
            <Box justifyContent="space-between">
              <Text color="white" dimColor bold>MEMORY</Text>
              <Text color="white" dimColor>{memories.length}</Text>
            </Box>
            {memories.slice(0, 3).map((mem, i) => {
              const isNewest = i === 0;
              return (
                <Box key={i}>
                  <Text color="white" dimColor={!isNewest} bold={isNewest}>
                    {isNewest ? '◉' : '●'}
                  </Text>
                  <Text color="white" dimColor={!isNewest} bold={isNewest}>
                    {' '}{(mem.content || '').slice(0, 40)}
                  </Text>
                </Box>
              );
            })}
            {memories.length === 0 && (
              <Text color="white" dimColor>No memories yet</Text>
            )}
          </Box>
        </Box>

        <Box width="40%">
          <Box
            flexDirection="column"
            borderStyle="single"
            borderColor="gray"
            padding={1}
            width="100%"
          >
            <Box justifyContent="space-between">
              <Text color="white" dimColor bold>KNOWLEDGE</Text>
              <Text color="white" dimColor>{knowledge.length}</Text>
            </Box>
            {knowledge.slice(0, 3).map((k, i) => {
              const isNewest = i === 0;
              return (
                <Box key={i}>
                  <Text color="white" dimColor={!isNewest} bold={isNewest}>
                    {isNewest ? '◆' : '◇'}
                  </Text>
                  <Text color="white" dimColor={!isNewest} bold={isNewest}>
                    {' '}{(k.textExcerpt || '').slice(0, 40)}
                  </Text>
                </Box>
              );
            })}
            {knowledge.length === 0 && (
              <Text color="white" dimColor>No knowledge yet</Text>
            )}
          </Box>
        </Box>
      </Box>

      {/* Footer - Controls (Ghosted) */}
      <Box marginTop={1} justifyContent="center">
        <Text color="white" dimColor>
          [r] Refresh  [v] View  [m] Radio  [p] {audioPlaying ? 'Stop' : 'Play'}  [n] Next  [q] Quit
        </Text>
        <Text color="white" dimColor> │ </Text>
        <Text color="white" bold={frame % 20 < 10} dimColor={frame % 20 >= 10}>
          ⟳ {refreshInterval / 1000}s
        </Text>
      </Box>
    </Box>
  );
}
