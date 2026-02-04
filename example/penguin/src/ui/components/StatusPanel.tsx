/**
 * Status panel component - displays agent vital signs.
 * @module ui/components/StatusPanel
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { AgentState } from '../../core/types.js';

interface StatusPanelProps {
  state: AgentState | null;
  loading?: boolean;
}

function HealthBar({ health }: { health: number }) {
  const filled = Math.round(health / 10);
  const empty = 10 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  let color: string;
  if (health >= 70) color = 'green';
  else if (health >= 40) color = 'yellow';
  else color = 'red';

  return (
    <Text>
      <Text color={color}>{bar}</Text>
      <Text> {health.toFixed(0)}%</Text>
    </Text>
  );
}

function MoodBadge({ mood }: { mood: string }) {
  const colors: Record<string, string> = {
    neutral: 'gray',
    expressive: 'cyan',
    curious: 'cyan',
    excited: 'yellow',
    reflective: 'blue',
    concerned: 'red',
  };

  return <Text color={colors[mood] ?? 'white'}>{mood.toUpperCase()}</Text>;
}

function RoutineIndicator({ routine }: { routine: string }) {
  const icons: Record<string, string> = {
    morning: '☀',
    day: '○',
    evening: '◐',
    overnight: '●',
  };

  return (
    <Text>
      {icons[routine] ?? '?'} {routine}
    </Text>
  );
}

export function StatusPanel({ state, loading }: StatusPanelProps) {
  if (loading) {
    return (
      <Box borderStyle="round" borderColor="gray" padding={1}>
        <Text color="gray">Loading...</Text>
      </Box>
    );
  }

  if (!state) {
    return (
      <Box borderStyle="round" borderColor="red" padding={1}>
        <Text color="red">No state available</Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="green"
      padding={1}
    >
      <Box marginBottom={1}>
        <Text bold color="green">
          AGENT STATUS
        </Text>
      </Box>

      <Box>
        <Text>Mood:    </Text>
        <MoodBadge mood={state.mood} />
      </Box>

      <Box>
        <Text>Health:  </Text>
        <HealthBar health={state.health} />
      </Box>

      <Box>
        <Text>Routine: </Text>
        <RoutineIndicator routine={state.routine} />
      </Box>

      <Box>
        <Text>Ticks:   </Text>
        <Text color="cyan">{state.counters.ticks}</Text>
      </Box>

      <Box>
        <Text>Vol:     </Text>
        <Text color="yellow">{(state.volatility * 100).toFixed(1)}%</Text>
      </Box>

      {state.lastTick && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Last: {new Date(state.lastTick).toLocaleTimeString()}
          </Text>
        </Box>
      )}
    </Box>
  );
}
