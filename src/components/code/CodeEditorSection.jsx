'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Box, 
  Typography, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Drawer,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/system';
import { 
  PlayArrow, 
  Refresh, 
  Settings, 
  CheckCircleOutline, 
  ErrorOutline,
  Timer,
  LightMode,
  DarkMode,
  KeyboardArrowRight,
  KeyboardArrowLeft
} from '@mui/icons-material';

// Metallic styled container
const MetallicContainer = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2e2e2e 0%, #1c1c1c 100%)',
  border: '1px solid #555',
  borderRadius: '16px',
  padding: theme.spacing(4),
  boxShadow: '0 6px 15px rgba(0, 0, 0, 0.8)',
}));

const ResultPanel = styled(Paper)(({ theme, status }) => ({
  padding: theme.spacing(2),
  borderRadius: '8px',
  height: '100%',
  backgroundColor: status === 'success' ? 'rgba(76, 175, 80, 0.1)' : 
                   status === 'error' ? 'rgba(244, 67, 54, 0.1)' : 
                   'rgba(25, 25, 25, 0.8)',
  border: `1px solid ${status === 'success' ? '#4caf50' : 
                       status === 'error' ? '#f44336' : 
                       '#555'}`,
  overflow: 'auto',
}));

// Language templates
const codeTemplates = {
  javascript: `function reverseString(str) {
  // Write your code here
  
  return;
}

// Example usage
console.log(reverseString("hello"));`,
  
  python: `def reverse_string(s):
    # Write your code here
    
    return

# Example usage
if __name__ == "__main__":
    print(reverse_string("hello"))`,
  
  cpp: `#include <iostream>
#include <string>

std::string reverseString(const std::string& str) {
    // Write your code here
    
    return "";
}

int main() {
    std::cout << reverseString("hello") << std::endl;
    return 0;
}`,
  
  java: `public class Solution {
    public static String reverseString(String str) {
        // Write your code here
        
        return "";
    }
    
    public static void main(String[] args) {
        System.out.println(reverseString("hello"));
    }
}`
};

// Test cases
const testCases = [
  { input: '"hello"', expectedOutput: '"olleh"', description: "Basic string reversal" },
  { input: '"RaceCar"', expectedOutput: '"raCecaR"', description: "Case-sensitive reversal" },
  { input: '"12345"', expectedOutput: '"54321"', description: "Numeric string reversal" },
  { input: '""', expectedOutput: '""', description: "Empty string edge case" }
];

export default function CodeEditorSection({ code, setCode, language, setLanguage, onSubmit }) {
  const [question, setQuestion] = useState('Write a function to reverse a string.');
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState(null); // null, 'success', 'error'
  const [activeTab, setActiveTab] = useState(0);
  const [remainingTime, setRemainingTime] = useState(30 * 60); // 30 minutes in seconds
  const [theme, setTheme] = useState('vs-dark');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showMinimap, setShowMinimap] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Initialize code with template on language change
  useEffect(() => {
    setCode(codeTemplates[language] || '');
  }, [language, setCode]);

  // Timer countdown
  useEffect(() => {
    const timer = remainingTime > 0 && setInterval(() => {
      setRemainingTime(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [remainingTime]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput('');
    setRunStatus(null);

    // Simulate code execution with delay
    setTimeout(() => {
      try {
        // Simulate output based on language
        let simulatedOutput;
        
        if (customInput.trim()) {
          // Simple simulation of output based on input
          simulatedOutput = `Running with custom input: ${customInput}\n`;
          
          if (language === 'javascript') {
            if (code.includes('return str.split("").reverse().join("")')) {
              simulatedOutput += `Output: "${customInput.split('').reverse().join('')}"`;
              setRunStatus('success');
            } else {
              simulatedOutput += 'Error: Your implementation doesn\'t match expected output';
              setRunStatus('error');
            }
          } else {
            // Simplified simulation for other languages
            simulatedOutput += `Output: "${customInput.split('').reverse().join('')}"`;
            setRunStatus('success');
          }
        } else {
          // Default output if no custom input
          simulatedOutput = 'Running with default test case: "hello"\n';
          
          if (language === 'javascript') {
            if (code.includes('return str.split("").reverse().join("")')) {
              simulatedOutput += 'Output: "olleh"';
              setRunStatus('success');
            } else {
              simulatedOutput += 'Output: undefined\nExpected: "olleh"';
              setRunStatus('error');
            }
          } else {
            simulatedOutput += 'Output: "olleh"';
            setRunStatus('success');
          }
        }
        
        setOutput(simulatedOutput);
      } catch (error) {
        setOutput(`Runtime Error: ${error.message}`);
        setRunStatus('error');
      } finally {
        setIsRunning(false);
      }
    }, 1500);
  };

  const handleRunTests = () => {
    setIsRunning(true);
    setTestResults([]);
    
    // Simulate test execution
    setTimeout(() => {
      // Very simple simulation of test cases based on code contents
      // In a real implementation, you would use a code execution API
      const results = testCases.map(test => {
        const passed = code.includes('return str.split("").reverse().join("")') || 
                       code.includes('return s[::-1]') ||
                       code.includes('StringBuilder') && code.includes('reverse()');
        
        return {
          ...test,
          passed,
          actual: passed ? test.expectedOutput : '"incorrectOutput"'
        };
      });
      
      setTestResults(results);
      setIsRunning(false);
      
      // Set active tab to test results
      setActiveTab(2);
    }, 2000);
  };

  const resetCode = () => {
    setCode(codeTemplates[language] || '');
  };

  const toggleTheme = () => {
    setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark');
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Top Bar with Timer and Settings */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: 'deepskyblue',
              fontFamily: 'monospace',
              letterSpacing: 1,
            }}
          >
            Code Raider X
          </Typography>
        </Grid>
        <Grid item>
          <Chip
            icon={<Timer />}
            label={formatTime(remainingTime)}
            sx={{ 
              bgcolor: remainingTime < 300 ? '#f44336' : '#2e2e2e', 
              color: 'white',
              '& .MuiChip-icon': { color: remainingTime < 300 ? 'white' : 'deepskyblue' }
            }}
          />
        </Grid>
        <Grid item>
          <IconButton 
            onClick={toggleTheme} 
            sx={{ color: theme === 'vs-dark' ? 'yellow' : 'deepskyblue' }}
          >
            {theme === 'vs-dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
          <IconButton 
            onClick={() => setSettingsOpen(true)}
            sx={{ color: 'deepskyblue' }}
          >
            <Settings />
          </IconButton>
        </Grid>
      </Grid>

      {/* Coding Question Section */}
      <MetallicContainer elevation={10}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: 'deepskyblue',
            mb: 2,
            fontFamily: 'monospace',
            letterSpacing: 1,
          }}
        >
          Coding Question:
        </Typography>

        {/* Display the full question dynamically */}
        <Box
          sx={{
            color: '#ccc',
            fontSize: '1.1rem',
            lineHeight: 1.6,
            fontFamily: 'Fira Code, monospace',
            backgroundColor: '#1e1e1e',
            padding: 2,
            borderRadius: 2,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          <span style={{ color: '#CE9178' }}>{question}</span>
        </Box>
      </MetallicContainer>

      {/* Main Editor Section */}
      <Grid container spacing={2}>
        {/* Editor Column */}
        <Grid item xs={12} md={isPanelOpen ? 8 : 12}>
          {/* Language Selection */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="language-select-label" sx={{ color: 'deepskyblue' }}>
                Select Language
              </InputLabel>
              <Select
                labelId="language-select-label"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                sx={{
                  bgcolor: theme === 'vs-dark' ? '#222' : '#f5f5f5',
                  color: theme === 'vs-dark' ? 'white' : 'black',
                  borderRadius: 2,
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'deepskyblue',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00bfff',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00bfff',
                  },
                }}
              >
                <MenuItem value="javascript">JavaScript</MenuItem>
                <MenuItem value="python">Python</MenuItem>
                <MenuItem value="cpp">C++</MenuItem>
                <MenuItem value="java">Java</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={resetCode}
              sx={{ 
                borderColor: 'orange', 
                color: 'orange',
                '&:hover': {
                  borderColor: 'darkorange',
                  backgroundColor: 'rgba(255, 165, 0, 0.1)'
                }
              }}
            >
              Reset
            </Button>
          </Box>

          {/* Editor with enhanced styling */}
          <motion.div
            className="rounded-lg overflow-hidden"
            style={{
              height: '450px',
              background: theme === 'vs-dark' ? '#1a1a1a' : '#f5f5f5',
              border: theme === 'vs-dark' ? '1px solid #333' : '1px solid #ccc',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
            whileHover={{ scale: 1.01 }}
          >
            <Editor
              height="100%"
              language={language}
              value={code}
              theme={theme}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: fontSize,
                minimap: { enabled: showMinimap },
                fontFamily: 'Fira Code, monospace',
                fontLigatures: true,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: true,
              }}
            />
          </motion.div>

          {/* Control Panel */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleRunCode}
                disabled={isRunning}
                sx={{
                  bgcolor: '#4caf50',
                  '&:hover': {
                    bgcolor: '#388e3c',
                  },
                }}
              >
                {isRunning ? <CircularProgress size={24} color="inherit" /> : 'Run Code'}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                onClick={handleRunTests}
                disabled={isRunning}
                sx={{
                  bgcolor: '#2196f3',
                  '&:hover': {
                    bgcolor: '#1976d2',
                  },
                }}
              >
                {isRunning ? <CircularProgress size={24} color="inherit" /> : 'Run Tests'}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={onSubmit}
                disabled={isRunning}
                sx={{
                  bgcolor: 'deepskyblue',
                  '&:hover': {
                    bgcolor: '#0099cc',
                  },
                }}
              >
                Submit Solution
              </Button>
            </Grid>
            <Grid item>
              <IconButton 
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                sx={{ color: 'deepskyblue' }}
              >
                {isPanelOpen ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
              </IconButton>
            </Grid>
          </Grid>
        </Grid>

        {/* Output/Results Panel */}
        {isPanelOpen && (
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              bgcolor: theme === 'vs-dark' ? '#1e1e1e' : '#f5f5f5',
              borderRadius: '12px',
              border: theme === 'vs-dark' ? '1px solid #333' : '1px solid #ccc',
              overflow: 'hidden',
            }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    color: theme === 'vs-dark' ? '#aaa' : '#555',
                  },
                  '& .Mui-selected': {
                    color: 'deepskyblue !important',
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'deepskyblue',
                  }
                }}
              >
                <Tab label="Output" />
                <Tab label="Custom Input" />
                <Tab label="Test Cases" />
              </Tabs>

              <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                {activeTab === 0 && (
                  <ResultPanel status={runStatus}>
                    {isRunning ? (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress color="info" />
                      </Box>
                    ) : output ? (
                      <pre style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '14px', 
                        color: theme === 'vs-dark' ? '#ddd' : '#333',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {output}
                      </pre>
                    ) : (
                      <Typography sx={{ color: theme === 'vs-dark' ? '#777' : '#999' }}>
                        Run your code to see output here...
                      </Typography>
                    )}
                  </ResultPanel>
                )}

                {activeTab === 1 && (
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      sx={{ color: theme === 'vs-dark' ? '#bbb' : '#555' }}
                    >
                      Enter custom input to test your code:
                    </Typography>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      style={{ height: '180px', marginBottom: '16px' }}
                    >
                      <Editor
                        height="100%"
                        language="plaintext"
                        value={customInput}
                        theme={theme}
                        onChange={(value) => setCustomInput(value || '')}
                        options={{
                          fontSize: fontSize,
                          minimap: { enabled: false },
                          fontFamily: 'monospace',
                          lineNumbers: 'off',
                          folding: false,
                          scrollBeyondLastLine: false,
                          readOnly: isRunning,
                        }}
                      />
                    </motion.div>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={handleRunCode}
                      disabled={isRunning}
                      fullWidth
                      sx={{
                        bgcolor: '#4caf50',
                        '&:hover': {
                          bgcolor: '#388e3c',
                        },
                      }}
                    >
                      {isRunning ? <CircularProgress size={24} color="inherit" /> : 'Run with Custom Input'}
                    </Button>
                  </Box>
                )}

                {activeTab === 2 && (
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      sx={{ color: theme === 'vs-dark' ? '#bbb' : '#555' }}
                    >
                      Test Cases Results:
                    </Typography>
                    
                    {isRunning ? (
                      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                        <CircularProgress color="info" />
                      </Box>
                    ) : testResults.length > 0 ? (
                      <Box>
                        {testResults.map((test, index) => (
                          <Paper 
                            key={index}
                            elevation={1}
                            sx={{ 
                              p: 2, 
                              mb: 2, 
                              bgcolor: test.passed 
                                ? 'rgba(76, 175, 80, 0.1)' 
                                : 'rgba(244, 67, 54, 0.1)',
                              border: test.passed 
                                ? '1px solid rgba(76, 175, 80, 0.3)'
                                : '1px solid rgba(244, 67, 54, 0.3)',
                            }}
                          >
                            <Box display="flex" alignItems="center" mb={1}>
                              {test.passed 
                                ? <CheckCircleOutline sx={{ color: '#4caf50', mr: 1 }} /> 
                                : <ErrorOutline sx={{ color: '#f44336', mr: 1 }} />
                              }
                              <Typography variant="subtitle2">
                                {test.description}
                              </Typography>
                            </Box>
                            <Typography variant="caption" display="block" sx={{ color: theme === 'vs-dark' ? '#bbb' : '#555' }}>
                              Input: {test.input}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ color: theme === 'vs-dark' ? '#bbb' : '#555' }}>
                              Expected: {test.expectedOutput}
                            </Typography>
                            {!test.passed && (
                              <Typography variant="caption" display="block" sx={{ color: '#f44336' }}>
                                Actual: {test.actual}
                              </Typography>
                            )}
                          </Paper>
                        ))}
                        
                        <Alert 
                          severity={testResults.every(t => t.passed) ? "success" : "error"}
                          variant="outlined"
                          sx={{ mt: 2 }}
                        >
                          {testResults.every(t => t.passed) 
                            ? "All test cases passed!" 
                            : `${testResults.filter(t => t.passed).length}/${testResults.length} test cases passed.`}
                        </Alert>
                      </Box>
                    ) : (
                      <Typography sx={{ color: theme === 'vs-dark' ? '#777' : '#999' }}>
                        Run tests to see results here...
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        PaperProps={{
          sx: { 
            width: 300, 
            bgcolor: theme === 'vs-dark' ? '#222' : '#f5f5f5',
            padding: 3,
          }
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, color: theme === 'vs-dark' ? 'white' : 'black' }}>
          Editor Settings
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'vs-dark' ? '#ccc' : '#555' }}>
          Font Size: {fontSize}px
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item>12</Grid>
          <Grid item xs>
            <input 
              type="range" 
              min="12" 
              max="24" 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))} 
              style={{ width: '100%' }}
            />
          </Grid>
          <Grid item>24</Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={theme === 'light'} 
                onChange={toggleTheme}
                color="primary"
              />
            }
            label="Light Theme"
          />
        </Box>
        
        <Box sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={showMinimap} 
                onChange={() => setShowMinimap(!showMinimap)}
                color="primary"
              />
            }
            label="Show Minimap"
          />
        </Box>
        
        <Button 
          variant="contained" 
          fullWidth 
          sx={{ mt: 4 }}
          onClick={() => setSettingsOpen(false)}
        >
          Close
        </Button>
      </Drawer>
    </motion.div>
  );
}
