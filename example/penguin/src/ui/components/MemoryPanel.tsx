/**
 * Memory panel component - displays agent memories.
 * @module ui/components/MemoryPanel
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { Memory } from '../../core/types.js';

interface MemoryPanelProps {
  memories: Memory[];
  maxItems?: number;
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    episodic: 'cyan',
    semantic: 'cyan',
    procedural: 'green',
  };

  const labels: Record<string, string> = {
    episodic: 'E',
    semantic: 'S',
    procedural: 'P',
  };

  return (
    <Text color={colors[type] ?? 'gray'}>[{labels[type] ?? '?'}]</Text>
  );
}

function ImportanceBar({ importance }: { importance: number }) {
  const level = Math.round(importance * 5);
  return (
    <Text color="yellow">
      {'★'.repeat(level)}
      {'☆'.repeat(5 - level)}
    </Text>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

export function MemoryPanel({ memories, maxItems = 6 }: MemoryPanelProps) {
  const displayMemories = memories.slice(0, maxItems);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      padding={1}
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">
          MEMORIES ({memories.length})
        </Text>
      </Box>

      {displayMemories.length === 0 ? (
        <Text color="gray">No memories stored</Text>
      ) : (
        displayMemories.map((mem, i) => (
          <Box key={mem.id ?? i} flexDirection="column">
            <Box>
              <TypeBadge type={mem.type} />
              <Text> </Text>
              <ImportanceBar importance={mem.importance} />
            </Box>
            <Box marginLeft={1}>
              <Text color="gray">{truncate(mem.content, 50)}</Text>
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}
