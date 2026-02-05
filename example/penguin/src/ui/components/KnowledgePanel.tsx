/**
 * Knowledge panel component - displays knowledge base.
 * @module ui/components/KnowledgePanel
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { Knowledge } from '../../core/types.js';

interface KnowledgePanelProps {
  knowledge: Knowledge[];
  maxItems?: number;
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    bbc: 'red',
    techcrunch: 'green',
    coindesk: 'yellow',
    hackernews: 'cyan',
    note: 'blue',
  };

  // Find matching color
  const lowerSource = source.toLowerCase();
  let color = 'gray';
  for (const [key, value] of Object.entries(colors)) {
    if (lowerSource.includes(key)) {
      color = value;
      break;
    }
  }

  const label = source.slice(0, 6).toUpperCase();
  return <Text color={color}>[{label}]</Text>;
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

export function KnowledgePanel({ knowledge, maxItems = 6 }: KnowledgePanelProps) {
  const displayItems = knowledge.slice(0, maxItems);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      padding={1}
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">
          KNOWLEDGE ({knowledge.length})
        </Text>
      </Box>

      {displayItems.length === 0 ? (
        <Text color="gray">No knowledge items</Text>
      ) : (
        displayItems.map((item, i) => (
          <Box key={item.id ?? i}>
            <SourceBadge source={item.source} />
            <Text color="gray"> {formatTime(item.ts)} </Text>
            <Text>{truncate(item.textExcerpt, 40)}</Text>
          </Box>
        ))
      )}
    </Box>
  );
}
