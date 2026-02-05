/**
 * React hooks for agent state management.
 * @module ui/hooks/useAgent
 */

import { useState, useEffect, useCallback } from 'react';
import type { AgentState, Log, Memory, Knowledge, Painting } from '../../core/types.js';
import type { Backend } from '../../backend/types.js';

export interface AgentData {
  state: AgentState | null;
  logs: Log[];
  memories: Memory[];
  knowledge: Knowledge[];
  paintings: Painting[];
  loading: boolean;
  error: string | null;
}

export interface UseAgentOptions {
  backend: Backend;
  refreshInterval?: number;
}

/**
 * Hook for managing agent data with auto-refresh.
 */
export function useAgent(options: UseAgentOptions): AgentData & {
  refresh: () => Promise<void>;
} {
  const { backend, refreshInterval = 5000 } = options;

  const [state, setState] = useState<AgentState | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [newState, newLogs, newMemories, newKnowledge, newPaintings] = await Promise.all([
        backend.getState(),
        backend.getLogs({ limit: 10 }),
        backend.getMemories({ limit: 10 }),
        backend.getKnowledge({ limit: 10 }),
        backend.getPaintings?.({ limit: 5 }) ?? Promise.resolve([]),
      ]);

      setState(newState);
      setLogs(newLogs);
      setMemories(newMemories);
      setKnowledge(newKnowledge);
      setPaintings(newPaintings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [backend]);

  useEffect(() => {
    refresh();

    if (refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return {
    state,
    logs,
    memories,
    knowledge,
    paintings,
    loading,
    error,
    refresh,
  };
}
