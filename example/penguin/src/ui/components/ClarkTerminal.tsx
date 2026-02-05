/**
 * Advanced CLARK terminal visualization with 3D face and living animations.
 * Pure white gradient with interactive highlights.
 * @module ui/components/ClarkTerminal
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface ClarkTerminalProps {
  mood?: string;
  health?: number;
  animated?: boolean;
  volatility?: number;
  processing?: boolean;
  newEvent?: boolean;
  cryo?: boolean;
}

// Simpler but still 3D looking face - pure white
function generateCompact3DFace(
  leftEye: string,
  rightEye: string,
  mouth: string,
  stateLabel: string
): string[] {
  return [
    '          ░░▒▒▓▓██████████▓▓▒▒░░          ',
    '       ░▒▓██████████████████████▓▒░       ',
    '     ░▓████████████████████████████▓░     ',
    '    ▒██████▓▒░░        ░░▒▓██████▒    ',
    '   ▓█████▒                  ▒█████▓   ',
    `   ████▒   ┌────┐    ┌────┐   ▒████   `,
    `  ▓███▒    │ ${leftEye}  │    │ ${rightEye}  │    ▒███▓  `,
    `  ████░    └────┘    └────┘    ░████  `,
    '  ████░                          ░████  ',
    `  ████▒      ══${mouth}══      ▒████  `,
    '  ▓███▓                          ▓███▓  ',
    `   ████▒   ${stateLabel}   ▒████   `,
    '   ▓█████▒░░                ░░▒█████▓   ',
    '    ▒███████▓▓▒▒░░    ░░▒▒▓▓███████▒    ',
    '     ░▓████████████████████████▓░     ',
    '       ░▒▓██████████████████▓▒░       ',
    '          ░░▒▒▓▓██████▓▓▒▒░░          ',
  ];
}

// State label based on actual agent state
function getStateLabel(processing: boolean, cryo: boolean, mood: string): string {
  if (cryo) return '  I D L E  ';
  if (processing) return 'ANALYZING';
  if (mood === 'curious') return 'LEARNING ';
  if (mood === 'concerned') return ' A L E R T ';
  if (mood === 'excited') return ' EXCITED ';
  if (mood === 'expressive') return 'EXPRESSIVE';
  return 'CONSCIOUS';
}

// Thought halo - white with animation
function ThoughtHalo({ frame, active }: { frame: number; active: boolean }) {
  const speed = active ? 0.6 : 0.15;
  const width = 44;

  const chars = active
    ? '·∙•◦○◎●◉●◎○◦•∙·'
    : '·  ∙  •  ∙  ·  ';

  const halo = Array(width).fill(null).map((_, i) => {
    const pos = (frame * speed + i * 0.3) % chars.length;
    return chars[Math.floor(pos)];
  }).join('');

  return <Text color="white" dimColor={!active} bold={active}>{halo}</Text>;
}

// Vertical energy bars - white gradient
function EnergyBar({ frame, side, active }: { frame: number; side: 'left' | 'right'; active: boolean }) {
  const height = 10;
  const offset = side === 'left' ? 0 : 4;

  const bars = Array(height).fill(null).map((_, i) => {
    const wave = Math.sin((frame * 0.2) + i * 0.5 + offset);
    if (!active) return { char: '░', bold: false };
    const char = wave > 0.6 ? '█' : wave > 0.2 ? '▓' : wave > -0.2 ? '▒' : '░';
    const bold = wave > 0.4; // Interactive highlight - bold when high
    return { char, bold };
  });

  return (
    <Box flexDirection="column" alignItems="center">
      {bars.map((bar, i) => (
        <Text key={i} color="white" dimColor={!active} bold={bar.bold}>{bar.char}</Text>
      ))}
    </Box>
  );
}

export function ClarkTerminal({
  mood = 'neutral',
  health = 100,
  animated = true,
  volatility = 0,
  processing = false,
  newEvent = false,
  cryo = false,
}: ClarkTerminalProps) {
  const [frame, setFrame] = useState(0);
  const [blinkState, setBlinkState] = useState(0);
  const [eyeLook, setEyeLook] = useState<'center' | 'left' | 'right'>('center');

  // Main animation loop
  useEffect(() => {
    if (!animated) return;
    const interval = setInterval(() => setFrame((f) => f + 1), 100);
    return () => clearInterval(interval);
  }, [animated]);

  // Blink every 5-8 seconds
  useEffect(() => {
    if (!animated || cryo) return;
    const blinkInterval = setInterval(() => {
      if (Math.random() < 0.12) {
        setBlinkState(1);
        setTimeout(() => setBlinkState(2), 60);
        setTimeout(() => setBlinkState(3), 180);
        setTimeout(() => setBlinkState(0), 240);
      }
    }, 600);
    return () => clearInterval(blinkInterval);
  }, [animated, cryo]);

  // Eye movement on new events
  useEffect(() => {
    if (newEvent && animated) {
      const dir = Math.random() > 0.5 ? 'left' : 'right';
      setEyeLook(dir);
      setTimeout(() => setEyeLook('center'), 800);
    }
  }, [newEvent, animated]);

  // Random idle eye movement
  useEffect(() => {
    if (!animated || cryo) return;
    const lookInterval = setInterval(() => {
      if (Math.random() < 0.08) {
        const dirs: Array<'left' | 'right' | 'center'> = ['left', 'right', 'center'];
        setEyeLook(dirs[Math.floor(Math.random() * dirs.length)]);
        setTimeout(() => setEyeLook('center'), 500);
      }
    }, 2500);
    return () => clearInterval(lookInterval);
  }, [animated, cryo]);

  // Eye character based on state
  const getEyeChar = () => {
    if (cryo) return '──';
    if (blinkState === 2) return '──';
    if (blinkState === 1 || blinkState === 3) return '▬▬';
    if (volatility > 0.7) return '◎◎';
    if (eyeLook === 'left') return '◐◐';
    if (eyeLook === 'right') return '◑◑';
    if (mood === 'curious') return '◉?';
    return '◉◉';
  };

  // Mouth based on mood
  const getMouth = () => {
    if (cryo) return '════';
    if (processing) return '≡≡≡≡';
    switch (mood) {
      case 'expressive':
      case 'excited':
        return '╰──╯';
      case 'concerned':
        return '╭──╮';
      case 'curious':
        return '────';
      default:
        return '════';
    }
  };

  const stateLabel = getStateLabel(processing, cryo, mood);
  const face = generateCompact3DFace(getEyeChar(), getEyeChar(), getMouth(), stateLabel);

  const isActive = processing || newEvent || volatility > 0.5;
  const dimmed = health < 50 || cryo;

  // Line brightness based on position - center is brightest
  const getLineBold = (index: number, total: number): boolean => {
    const center = total / 2;
    const distFromCenter = Math.abs(index - center);
    return distFromCenter < 4 && isActive; // Bold center lines when active
  };

  return (
    <Box flexDirection="column" alignItems="center">
      {/* Top halo */}
      <ThoughtHalo frame={frame} active={isActive} />

      {/* Main face area with side energy bars */}
      <Box flexDirection="row" alignItems="center">
        {/* Left energy bar */}
        <Box marginRight={1}>
          <EnergyBar frame={frame} side="left" active={isActive && !cryo} />
        </Box>

        {/* The Face - pure white with brightness variation */}
        <Box flexDirection="column" alignItems="center">
          {face.map((line, i) => (
            <Text
              key={i}
              color="white"
              dimColor={dimmed || i < 2 || i > face.length - 3}
              bold={getLineBold(i, face.length)}
            >
              {line}
            </Text>
          ))}
        </Box>

        {/* Right energy bar */}
        <Box marginLeft={1}>
          <EnergyBar frame={frame} side="right" active={isActive && !cryo} />
        </Box>
      </Box>

      {/* Bottom halo */}
      <ThoughtHalo frame={frame + 22} active={isActive} />

      {/* Status indicators - white with interactive highlights */}
      <Box marginTop={1} justifyContent="center">
        <Text color="white" dimColor={cryo} bold={frame % 10 < 5 && !cryo}>●</Text>
        <Text color="white" dimColor> SYN </Text>
        <Text color="white" dimColor={cryo} bold={processing} inverse={processing}>
          {processing ? '◆' : '●'}
        </Text>
        <Text color="white" dimColor> CPU </Text>
        <Text color="white" dimColor={cryo} bold={frame % 6 < 3 && !cryo}>●</Text>
        <Text color="white" dimColor> NET</Text>
      </Box>
    </Box>
  );
}

// Holographic version - white
export function ClarkHologram({ mood = 'neutral', animated = true }: { mood?: string; animated?: boolean }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const interval = setInterval(() => setFrame((f) => f + 1), 120);
    return () => clearInterval(interval);
  }, [animated]);

  const scanPos = frame % 15;
  const glitch = frame % 25 < 2;

  const lines = [
    '      ░░▒▒▓▓████████████▓▓▒▒░░      ',
    '    ░▒▓████████████████████████▓▒░    ',
    '   ▒████▓▒░              ░▒▓████▒   ',
    '  ▓███▒    ╔══╗    ╔══╗    ▒███▓  ',
    '  ████░    ║◉◉║    ║◉◉║    ░████  ',
    '  ████▒    ╚══╝    ╚══╝    ▒████  ',
    '  ████▒                    ▒████  ',
    '  ▓███▓     ══════════     ▓███▓  ',
    '   ▒████▓░░            ░░▓████▒   ',
    '    ░▒▓████████████████████▓▒░    ',
    '      ░░▒▒▓▓████████▓▓▒▒░░      ',
  ];

  return (
    <Box flexDirection="column" alignItems="center">
      <Text color="white" bold>◢◤ HOLOGRAM ◥◣</Text>
      {lines.map((line, i) => (
        <Text
          key={i}
          color="white"
          dimColor={Math.abs(i - scanPos) < 2}
          bold={i >= 3 && i <= 7}
          inverse={glitch && i === Math.floor(frame / 4) % lines.length}
        >
          {line}
        </Text>
      ))}
      <Text color="white" bold>◣◥ PROJECTION ◤◢</Text>
    </Box>
  );
}

// Compact orb - white
export function ClarkOrbDisplay({ mood = 'neutral', frame = 0 }: { mood?: string; frame?: number }) {
  const pulse = frame % 20 < 10;

  return (
    <Box flexDirection="column" alignItems="center">
      <Text color="white" dimColor={!pulse}>  ░▒▓███▓▒░  </Text>
      <Text color="white" bold={pulse}> ▓██ ◉ ◉ ██▓ </Text>
      <Text color="white" bold={pulse}> ███ ─── ███ </Text>
      <Text color="white" dimColor={!pulse}>  ░▒▓███▓▒░  </Text>
    </Box>
  );
}
