/**
 * ASCII art components for visual flair.
 * @module ui/components/AsciiArt
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface AgentFaceProps {
  mood?: string;
  animated?: boolean;
}

const FACES: Record<string, string[]> = {
  neutral: [
    '  .---.',
    ' /     \\',
    '| o   o |',
    '|   ^   |',
    '|  \\_/  |',
    ' \\_____/',
  ],
  expressive: [
    '  .---.',
    ' /     \\',
    '| *   * |',
    '|   ^   |',
    '|  \\o/  |',
    ' \\_____/',
  ],
  curious: [
    '  .---.',
    ' /     \\',
    '| o   ? |',
    '|   ^   |',
    '|  ---  |',
    ' \\_____/',
  ],
  excited: [
    '  .---.',
    ' /  !  \\',
    '| ^   ^ |',
    '|   ^   |',
    '|  \\_/  |',
    ' \\_____/',
  ],
  reflective: [
    '  .---.',
    ' /     \\',
    '| -   - |',
    '|   ^   |',
    '|  ~~~  |',
    ' \\_____/',
  ],
  concerned: [
    '  .---.',
    ' /     \\',
    '| o   o |',
    '|   ^   |',
    '|  ___  |',
    ' \\_____/',
  ],
};

const BLINK_FACE = [
  '  .---.',
  ' /     \\',
  '| -   - |',
  '|   ^   |',
  '|  \\_/  |',
  ' \\_____/',
];

export function AgentFace({ mood = 'neutral', animated = true }: AgentFaceProps) {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (!animated) return;

    // Blink every 3-5 seconds
    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 2000;
      return setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 150);
        scheduleBlink();
      }, delay);
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, [animated]);

  const face = blinking ? BLINK_FACE : (FACES[mood] || FACES.neutral);

  const moodColors: Record<string, string> = {
    neutral: 'gray',
    expressive: 'cyan',
    curious: 'cyan',
    excited: 'yellow',
    reflective: 'blue',
    concerned: 'red',
  };

  return (
    <Box flexDirection="column" alignItems="center">
      {face.map((line, i) => (
        <Text key={i} color={moodColors[mood] || 'white'}>
          {line}
        </Text>
      ))}
    </Box>
  );
}

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label }: SpinnerProps) {
  const [frame, setFrame] = useState(0);
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, 80);

    return () => clearInterval(interval);
  }, []);

  return (
    <Text color="cyan">
      {frames[frame]} {label}
    </Text>
  );
}

interface PulseTextProps {
  text: string;
  color?: string;
}

export function PulseText({ text, color = 'green' }: PulseTextProps) {
  const [bright, setBright] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setBright((b) => !b);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Text color={color} dimColor={!bright} bold={bright}>
      {text}
    </Text>
  );
}

interface MatrixRainProps {
  width?: number;
  height?: number;
}

export function MatrixRain({ width = 20, height = 5 }: MatrixRainProps) {
  const [columns, setColumns] = useState<number[]>([]);
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789';

  useEffect(() => {
    // Initialize columns with random positions
    setColumns(Array(width).fill(0).map(() => Math.floor(Math.random() * height)));

    const interval = setInterval(() => {
      setColumns((cols) =>
        cols.map((y) => (y + 1) % (height + 3))
      );
    }, 150);

    return () => clearInterval(interval);
  }, [width, height]);

  const grid: string[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(' '));

  columns.forEach((y, x) => {
    if (y < height) {
      grid[y][x] = chars[Math.floor(Math.random() * chars.length)];
    }
  });

  return (
    <Box flexDirection="column">
      {grid.map((row, i) => (
        <Text key={i} color="green">
          {row.join('')}
        </Text>
      ))}
    </Box>
  );
}
