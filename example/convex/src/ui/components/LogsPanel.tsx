/**
 * Logs panel component - displays recent activity.
 * @module ui/components/LogsPanel
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { Log } from '../../core/types.js';

interface LogsPanelProps {
  logs: Log[];
  maxItems?: number;
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

function MoodIcon({ mood }: { mood: string }) {
  const icons: Record<string, string> = {
    neutral: '-',
    expressive: '*',
    curious: '?',
    excited: '!',
    reflective: '~',
    concerned: '!',
  };

  const colors: Record<string, string> = {
    neutral: 'gray',
    expressive: 'cyan',
    curious: 'cyan',
    excited: 'yellow',
    reflective: 'blue',
    concerned: 'red',
  };

  return <Text color={colors[mood] ?? 'white'}>{icons[mood] ?? '-'}</Text>;
}

export function LogsPanel({ logs, maxItems = 8 }: LogsPanelProps) {
  const displayLogs = logs.slice(0, maxItems);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="blue"
      padding={1}
    >
      <Box marginBottom={1}>
        <Text bold color="blue">
          ACTIVITY LOG
        </Text>
      </Box>

      {displayLogs.length === 0 ? (
        <Text color="gray">No activity yet</Text>
      ) : (
        displayLogs.map((log, i) => (
          <Box key={log.id ?? i}>
            <MoodIcon mood={log.mood} />
            <Text color="gray"> [{formatTime(log.ts)}] </Text>
            <Text>{truncate(log.summary, 45)}</Text>
          </Box>
        ))
      )}
    </Box>
  );
}
