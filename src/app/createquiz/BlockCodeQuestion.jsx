"use client";
import React from "react";
import { Box, Typography, TextField, MenuItem, Stack, IconButton, Tooltip, Paper, Button } from "@mui/material";
import { Add, Delete, Visibility } from "@mui/icons-material";
import useBlocks from "./useBlocks";

export default function BlockCodeQuestion({ question, setQuestion }) {
  const blockList = useBlocks();
  const handleBlockChange = (idx, field, value) => {
    const newBlocks = [...question.blocks];
    newBlocks[idx][field] = value;
    setQuestion({ ...question, blocks: newBlocks });
  };
  const addBlock = () => {
    setQuestion({ ...question, blocks: [...question.blocks, { blockId: '', order: '' }] });
  };
  const removeBlock = idx => {
    const newBlocks = question.blocks.filter((_, i) => i !== idx);
    setQuestion({ ...question, blocks: newBlocks });
  };
  const getBlockById = (id) => blockList.find(b => String(b.id) === String(id));
  return (
    <Box>
      <Typography fontWeight={700} mb={1}>Select Code Blocks and Order</Typography>
      <Stack spacing={2}>
        {question.blocks.map((block, idx) => {
          const selectedBlock = getBlockById(block.blockId);
          return (
            <Paper key={idx} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                select
                label="Block"
                value={block.blockId}
                onChange={e => handleBlockChange(idx, 'blockId', e.target.value)}
                sx={{ minWidth: 180 }}
              >
                {blockList.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.title}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Order"
                type="number"
                value={block.order}
                onChange={e => handleBlockChange(idx, 'order', e.target.value)}
                sx={{ width: 80 }}
              />
              <TextField
                label="Description (optional)"
                value={block.description || ''}
                onChange={e => handleBlockChange(idx, 'description', e.target.value)}
                sx={{ minWidth: 120 }}
              />
              {selectedBlock && (
                <Box sx={{ ml: 2, minWidth: 220, bgcolor: '#f5f5f5', borderRadius: 2, p: 1, fontFamily: 'monospace', fontSize: 14, border: '1px solid #e0e0e0', overflowX: 'auto' }}>
                  <Typography variant="caption" color="text.secondary">Code Preview:</Typography>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{selectedBlock.code}</pre>
                </Box>
              )}
              <IconButton onClick={() => removeBlock(idx)} color="error"><Delete /></IconButton>
            </Paper>
          );
        })}
      </Stack>
      <Button onClick={addBlock} startIcon={<Add />} sx={{ mt: 1 }}>Add Block</Button>
    </Box>
  );
}
