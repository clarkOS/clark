/**
 * Intelligence Panel - Interpreted market/news insights.
 * Pure white with interactive highlights.
 * @module ui/components/InsightPanel
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { Log } from '../../core/types.js';

interface InsightPanelProps {
  logs: Log[];
  maxItems?: number;
  frame?: number;
}

interface Insight {
  headline: string;
  synthesis: string;
  tags: string[];
  confidence: number;
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'volatile';
}

// Parse log entries into structured insights
function parseInsights(logs: Log[]): Insight[] {
  return logs.slice(0, 5).map((log) => {
    const summary = log.summary || '';
    const detail = log.detail || '';

    let sentiment: Insight['sentiment'] = 'neutral';
    const text = (summary + ' ' + detail).toLowerCase();

    if (text.includes('surge') || text.includes('rally') || text.includes('bullish') || text.includes('up ')) {
      sentiment = 'bullish';
    } else if (text.includes('crash') || text.includes('drop') || text.includes('bearish') || text.includes('down ')) {
      sentiment = 'bearish';
    } else if (text.includes('volatile') || text.includes('swing') || text.includes('uncertain')) {
      sentiment = 'volatile';
    }

    const tags: string[] = [];
    if (text.includes('bitcoin') || text.includes('btc')) tags.push('BTC');
    if (text.includes('ethereum') || text.includes('eth')) tags.push('ETH');
    if (text.includes('solana') || text.includes('sol')) tags.push('SOL');
    if (text.includes('market')) tags.push('MKT');
    if (text.includes('news')) tags.push('NEWS');
    if (text.includes('ai') || text.includes('artificial')) tags.push('AI');
    if (tags.length === 0) tags.push('SIG');

    const confidence = Math.min(95, Math.max(45, 60 + (detail.length / 10) + (log.mood === 'expressive' ? 10 : 0)));

    return {
      headline: summary.slice(0, 50) + (summary.length > 50 ? '...' : ''),
      synthesis: detail.slice(0, 80) + (detail.length > 80 ? '...' : ''),
      tags,
      confidence: Math.round(confidence),
      sentiment,
    };
  });
}

// Sentiment badge - white with symbols only
function SentimentBadge({ sentiment }: { sentiment: Insight['sentiment'] }) {
  const symbols = {
    bullish: '▲',
    bearish: '▼',
    neutral: '●',
    volatile: '◆',
  };

  return (
    <Text color="white" bold={sentiment !== 'neutral'}>
      {symbols[sentiment]}
    </Text>
  );
}

// Confidence bar - white with bold for high values
function ConfidenceBar({ value, width = 10, frame = 0 }: { value: number; width?: number; frame?: number }) {
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;

  const shouldPulse = value > 80 && frame % 10 < 5;
  const shouldFlicker = value < 40 && frame % 6 < 2;

  return (
    <Box>
      <Text color="white" dimColor={shouldFlicker} bold={shouldPulse}>
        {'█'.repeat(filled)}
      </Text>
      <Text color="white" dimColor>{'░'.repeat(empty)}</Text>
      <Text color="white" dimColor={value <= 70} bold={value > 70}> {value}%</Text>
    </Box>
  );
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <Box>
      {tags.slice(0, 3).map((tag, i) => (
        <Box key={i} marginRight={1}>
          <Text color="white" dimColor>[{tag}]</Text>
        </Box>
      ))}
    </Box>
  );
}

function InsightCard({ insight, index, frame }: { insight: Insight; index: number; frame: number }) {
  const isPrimary = index === 0;

  return (
    <Box
      flexDirection="column"
      borderStyle={isPrimary ? 'round' : 'single'}
      borderColor={isPrimary ? 'white' : 'gray'}
      paddingX={1}
      marginBottom={index < 2 ? 1 : 0}
    >
      {/* Header */}
      <Box>
        <SentimentBadge sentiment={insight.sentiment} />
        <Text color="white" bold={isPrimary} dimColor={!isPrimary}>
          {' '}{insight.headline}
        </Text>
      </Box>

      {/* Synthesis line */}
      {isPrimary && insight.synthesis && (
        <Box marginTop={0}>
          <Text color="white" dimColor italic>
            {'> '}{insight.synthesis}
          </Text>
        </Box>
      )}

      {/* Confidence */}
      <Box justifyContent="space-between" marginTop={0}>
        <TagList tags={insight.tags} />
        <Box>
          <Text color="white" dimColor>CONF </Text>
          <ConfidenceBar value={insight.confidence} width={6} frame={frame} />
        </Box>
      </Box>
    </Box>
  );
}

export function InsightPanel({ logs, maxItems = 3, frame = 0 }: InsightPanelProps) {
  const insights = parseInsights(logs);

  if (insights.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="white" bold>INTELLIGENCE</Text>
        <Text color="white" dimColor>Awaiting signals...</Text>
      </Box>
    );
  }

  const avgConfidence = insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;
  const signalBars = Math.round((avgConfidence / 100) * 5);

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box marginBottom={1} justifyContent="space-between">
        <Text color="white" bold>INTELLIGENCE</Text>
        <Text color="white" bold={frame % 10 < 5} dimColor={frame % 10 >= 5}>
          {frame % 10 < 5 ? '◉' : '○'}
        </Text>
      </Box>

      {/* Insights */}
      {insights.slice(0, maxItems).map((insight, i) => (
        <InsightCard key={i} insight={insight} index={i} frame={frame} />
      ))}

      {/* Signal strength */}
      <Box marginTop={1} justifyContent="center">
        <Text color="white" dimColor>SIGNAL </Text>
        {Array(5).fill(null).map((_, i) => (
          <Text key={i} color="white" bold={i < signalBars} dimColor={i >= signalBars}>
            {i < signalBars ? '█' : '░'}
          </Text>
        ))}
      </Box>
    </Box>
  );
}

// Activity log - raw intake, dim
export function ActivityLog({ logs, maxItems = 5 }: { logs: Log[]; maxItems?: number }) {
  return (
    <Box flexDirection="column">
      <Text color="white" dimColor>RAW INTAKE</Text>
      {logs.length === 0 ? (
        <Text color="white" dimColor>...</Text>
      ) : (
        logs.slice(0, maxItems).map((log, i) => (
          <Box key={i}>
            <Text color="white" dimColor>
              {new Date(log.ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text color="white" dimColor> · </Text>
            <Text color="white" dimColor>
              {(log.summary || '').slice(0, 30)}
            </Text>
          </Box>
        ))
      )}
    </Box>
  );
}
