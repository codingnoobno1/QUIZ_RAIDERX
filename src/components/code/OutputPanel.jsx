'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Tabs,
  Tab,
  Divider,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import CodeTerminal from './CodeTerminal';

export default function OutputPanel({
  output = {
    stdout: 'olleh',
    status: 'success',
    executionTime: 23,
    error: '',
    port: 3000,
    debug: 'No issues detected.',
    testResults: [
      {
        input: 'hello',
        expected: 'olleh',
        received: 'olleh',
        passed: true,
      },
      {
        input: 'world',
        expected: 'dlrow',
        received: 'dlrow',
        passed: true,
      },
    ],
  },
}) {
  const [tab, setTab] = useState(0);
  const isSuccess = output.status === 'success';

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        📤 Output
      </Typography>

      <Paper
        elevation={2}
        sx={{
          p: 3,
          bgcolor: '#fdfdfd',
          borderRadius: 3,
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {/* Status Bar */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Chip
            label={isSuccess ? '✅ Success' : '❌ Failed'}
            color={isSuccess ? 'success' : 'error'}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            ⏱ Execution Time: {output.executionTime}ms
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(e, newVal) => setTab(newVal)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab label="Terminal Output" />
          <Tab label="Test Cases" />
          <Tab label="Debug Console" />
          <Tab label="Port Info" />
        </Tabs>

        <Divider sx={{ mb: 2 }} />

        {/* Terminal Output */}
        {tab === 0 && (
          <Box
            sx={{
              bgcolor: '#1e1e1e',
              color: '#d4d4d4',
              p: 2,
              borderRadius: 2,
              fontSize: 14,
              whiteSpace: 'pre-wrap',
              minHeight: '140px',
              maxHeight: '240px',
              overflowY: 'auto',
              boxShadow: 'inset 0 0 10px #00000044',
            }}
          >
            <Typography sx={{ color: '#6a9955' }}>
              PS D:\pixel\QUIZ&gt;&nbsp;
              <span style={{ color: '#dcdcaa' }}>{output.command || 'echo Running...'}</span>
            </Typography>
            <Box sx={{ mt: 1 }}>{output.stdout || 'No Output.'}</Box>

            {output.error && (
              <Box mt={2} sx={{ color: '#ff8a80' }}>
                🔴 Error: {output.error}
              </Box>
            )}
          </Box>
        )}

        {/* Test Cases */}
        {tab === 1 && (
          <Box>
            {output.testResults?.length > 0 ? (
              <Table size="small" sx={{ fontSize: 13 }}>
                <TableBody>
                  {output.testResults.map((test, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography fontWeight={500} color="text.secondary">
                          {test.passed ? '✅' : '❌'} Test {index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <strong>Input:</strong> <code>{test.input}</code>
                      </TableCell>
                      <TableCell>
                        <strong>Expected:</strong> <code>{test.expected}</code>
                      </TableCell>
                      <TableCell>
                        <strong>Received:</strong>{' '}
                        <code
                          style={{
                            color: test.passed ? '#4caf50' : '#f44336',
                            fontWeight: 500,
                          }}
                        >
                          {test.received}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No test cases executed.
              </Typography>
            )}
          </Box>
        )}

        {/* Debug Console */}
        {tab === 2 && (
          <Box
            sx={{
              bgcolor: '#222',
              color: '#90caf9',
              fontSize: 13,
              p: 2,
              borderRadius: 2,
              fontFamily: 'JetBrains Mono, monospace',
              whiteSpace: 'pre-wrap',
              minHeight: '120px',
            }}
          >
            🐞 {output.debug || 'Debug info not available.'}
          </Box>
        )}

        {/* Port Info */}
        {tab === 3 && (
          <Box
            sx={{
              bgcolor: '#0c1f32',
              color: '#81d4fa',
              p: 2,
              borderRadius: 2,
              fontSize: 13,
              whiteSpace: 'pre-wrap',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            🌐 Listening on: <strong>http://localhost:{output.port || 3000}</strong>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
