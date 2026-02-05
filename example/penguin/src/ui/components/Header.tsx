/**
 * Header component - minimal branding, pure white.
 * @module ui/components/Header
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  title?: string;
  version?: string;
  frame?: number;
}

const LOGO_MINIMAL = `
 ╔═══╗ ╔═╗   ╔═══╗ ╔═══╗ ╦ ╔═
 ║     ║ ║   ╠═══╣ ╠═╦═╝ ╠═╩╗
 ╚═══╝ ╩═╝   ╩   ╩ ╩ ╚═  ╩  ╩
`;

export function Header({ title, version = '2.0', frame = 0 }: HeaderProps) {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => !p);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={pulse ? 'white' : 'gray'}
      paddingX={2}
      alignItems="center"
    >
      {/* Logo */}
      <Text color="white" bold>
        {LOGO_MINIMAL}
      </Text>

      {/* Subtitle */}
      <Box>
        <Text color="white" dimColor>
          {'─'.repeat(10)}
        </Text>
        <Text color="white" bold> AUTONOMOUS AGENT </Text>
        <Text color="white" dimColor>
          {'─'.repeat(10)}
        </Text>
      </Box>

      {/* Status bar */}
      <Box marginTop={1}>
        <Text color="white" bold={pulse} dimColor={!pulse}>●</Text>
        <Text color="white" dimColor> LIVE </Text>
        <Text color="white" dimColor>│ </Text>
        <Text color="white" dimColor>Convex Powered</Text>
        <Text color="white" dimColor> │ </Text>
        <Text color="white" dimColor>v{version}</Text>
        <Text color="white" dimColor> │ </Text>
        <Text color="white">{new Date().toLocaleTimeString()}</Text>
      </Box>
    </Box>
  );
}

// Compact header
export function CompactHeader({ frame = 0 }: { frame?: number }) {
  return (
    <Box justifyContent="space-between" paddingX={1}>
      <Box>
        <Text color="white" bold>CLARK</Text>
        <Text color="white" dimColor> │ Autonomous Agent</Text>
      </Box>
      <Box>
        <Text color="white" bold={frame % 10 < 5} dimColor={frame % 10 >= 5}>●</Text>
        <Text color="white" dimColor> {new Date().toLocaleTimeString()}</Text>
      </Box>
    </Box>
  );
}
