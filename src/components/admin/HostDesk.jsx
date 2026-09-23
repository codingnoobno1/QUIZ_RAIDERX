'use client';

/**
 * Prepare an event before it goes on air.
 *
 * One selected event, its rounds, and the question set inside the round that
 * is open. Importing, deleting and editing stay on that set until Save, and
 * Save is refused while a choice question would grade every attempt wrong.
 * Resetting the event removes entrants. It does not touch rounds or questions.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { brokenQuestions, parseQuestionPack } from '@/lib/questionPack.mjs';

const QUIZ_TYPES = [
  ['rapid_fire', 'Rapid fire'],
  ['preloaded', 'Preloaded paper'],
  ['custom_live', 'Host-paced'],
  ['kbc', 'KBC'],
  ['buzzer', 'Electric Answers'],
];

const SETS = ['easy', 'medium', 'hard', 'impossible'];

export default function HostDesk({ event, events = [], onSelectEvent }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const load = useCallback(async () => {
    if (!event?._id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/activities?eventId=${encodeURIComponent(event._id)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not load rounds.');
      const list = data.data ?? [];
      setActivities(list);
      setError(null);
      setSelectedId((current) => (list.some((a) => a._id === current) ? current : list.find((a) => a.type === 'quiz')?._id ?? list[0]?._id ?? null));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [event?._id]);

  useEffect(() => { load(); }, [load]);

  const selected = activities.find((a) => a._id === selectedId) ?? null;

  useEffect(() => {
    setDraft(selected?.type === 'quiz' ? draftFrom(selected) : null);
    setDirty(false);
  }, [selected]);

  const choose = (id) => {
    if (dirty && !window.confirm('This round has unsaved edits. Leave them?')) return;
    setSelectedId(id);
  };

  const patchDraft = (partial, questions) => {
    setDraft((current) => ({ ...current, ...partial, ...(questions ? { questions } : {}) }));
    setDirty(true);
  };

  const save = async (nextDraft = draft) => {
    if (!selected || !nextDraft) return false;
    const broken = brokenQuestions(nextDraft.questions);
    if (broken.length) {
      toast.error(`${broken.length} question${broken.length === 1 ? '' : 's'} would grade wrong. Fix them before saving.`);
      return false;
    }
    if (selected.status === 'active' && !window.confirm('This round is live. Saving changes what the room is using. Continue?')) {
      return false;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/events/activities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveBody(selected._id, nextDraft)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save was refused.');
      toast.success('Round saved');
      setDirty(false);
      await load();
      return true;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const applyImport = async ({ text, mode, set, shuffle, title, asNew }) => {
    const stamped = mode === 'replace-set' ? (set || 'medium') : (set || null);
    const parsed = parseQuestionPack(text, { shuffle, set: stamped });
    if (!parsed.questions.length) {
      return parsed;
    }
    if (asNew) {
      if (!title.trim()) return { ...parsed, errors: ['Name the new round.', ...parsed.errors] };
      const broken = brokenQuestions(parsed.questions);
      if (broken.length) return { ...parsed, errors: [`${broken.length} imported questions would grade wrong.`, ...parsed.errors] };
      setSaving(true);
      try {
        const res = await fetch('/api/admin/events/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event._id,
            type: 'quiz',
            title: title.trim(),
            quiz: { quizType: 'preloaded', questions: parsed.questions, timePerQuestion: 30, scope: 'team' },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Could not create the round.');
        toast.success(`Round created with ${parsed.questions.length} questions`);
        setImportOpen(false);
        await load();
        if (data.data?._id) setSelectedId(data.data._id);
      } catch (err) {
        toast.error(err.message);
        return { ...parsed, errors: [err.message, ...parsed.errors] };
      } finally {
        setSaving(false);
      }
      return parsed;
    }

    if (!draft) return { ...parsed, errors: ['Select a quiz round first.', ...parsed.errors] };
    let questions = draft.questions;
    if (mode === 'replace-all') questions = parsed.questions;
    else if (mode === 'replace-set') {
      questions = [...draft.questions.filter((q) => (q.difficulty || 'medium') !== stamped), ...parsed.questions];
    } else {
      questions = [...draft.questions, ...parsed.questions];
    }
    const next = { ...draft, questions };
    setDraft(next);
    setDirty(true);
    const saved = await save(next);
    if (saved) setImportOpen(false);
    return parsed;
  };

  if (!event) {
    return (
      <Box sx={panel}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.25rem' }}>Prepare an event</Typography>
        <Typography sx={{ color: '#6b7280', mt: 0.75, mb: 2 }}>
          Pick the event you are about to host. Rounds, question sets and the entrant reset all work on that one event.
        </Typography>
        <Stack spacing={1} sx={{ maxWidth: 420 }}>
          {events.map((item) => (
            <Button key={item._id} onClick={() => onSelectEvent?.(item._id)} sx={{ justifyContent: 'flex-start', color: '#111827', border: '1px solid #e5e7eb' }}>
              {item.title}
            </Button>
          ))}
          {events.length === 0 && <Typography sx={{ color: '#6b7280' }}>No events yet.</Typography>}
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.35rem', letterSpacing: '-0.02em' }}>{event.title}</Typography>
          <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Set each round, then put questions in by set. Reset clears entrants only.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setImportOpen(true)} sx={quietBtn}>Import JSON</Button>
          {selected?.quiz?.quizType === 'buzzer' && (
            <Button variant="outlined" onClick={() => window.open(`/coding-club/rock?activityId=${encodeURIComponent(selected._id)}`, '_blank', 'noopener,noreferrer')} sx={quietBtn}>
              Rock the show
            </Button>
          )}
          <Button variant="outlined" color="error" onClick={() => setResetOpen(true)}>Reset entrants</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, gap: 2, alignItems: 'start' }}>
        <Box sx={panel}>
          <Typography sx={kicker}>Rounds</Typography>
          {loading && <Typography sx={{ color: '#6b7280', fontSize: '0.85rem' }}>Loading…</Typography>}
          {!loading && activities.length === 0 && (
            <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>No rounds yet. Import a JSON pack to create the first one.</Typography>
          )}
          <Stack spacing={0.75} sx={{ mt: 1 }}>
            {activities.map((activity) => (
              <Box
                key={activity._id}
                onClick={() => choose(activity._id)}
                sx={{
                  p: 1.25, borderRadius: 1.5, cursor: 'pointer',
                  border: `1px solid ${activity._id === selectedId ? '#111827' : '#e5e7eb'}`,
                  bgcolor: activity._id === selectedId ? '#f9fafb' : '#fff',
                }}
              >
                <Typography sx={{ fontWeight: 650, fontSize: '0.92rem' }}>{activity.title}</Typography>
                <Typography sx={{ color: '#6b7280', fontSize: '0.75rem', mt: 0.25 }}>
                  {activity.type === 'quiz'
                    ? `${activity.quiz?.questions?.length ?? 0} questions · ${labelType(activity.quiz?.quizType)}`
                    : activity.type}
                  {' · '}{activity.status}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={panel}>
          {!selected && <Typography sx={{ color: '#6b7280' }}>Select a round.</Typography>}
          {selected && selected.type !== 'quiz' && (
            <Typography sx={{ color: '#6b7280' }}>{selected.title} is a {selected.type}. Question sets belong on a quiz round.</Typography>
          )}
          {draft && (
            <RoundEditor
              draft={draft}
              live={selected.status === 'active'}
              dirty={dirty}
              saving={saving}
              onChange={patchDraft}
              onSave={() => save()}
              onImport={() => setImportOpen(true)}
            />
          )}
        </Box>
      </Box>

      <ImportDialog
        open={importOpen}
        saving={saving}
        hasRound={Boolean(draft)}
        onClose={() => setImportOpen(false)}
        onApply={applyImport}
      />
      <ResetDialog
        open={resetOpen}
        event={event}
        onClose={() => setResetOpen(false)}
      />
    </Box>
  );
}

function RoundEditor({ draft, live, dirty, saving, onChange, onSave, onImport }) {
  const [openId, setOpenId] = useState(null);
  const [setFilter, setSetFilter] = useState('all');
  const broken = brokenQuestions(draft.questions);
  const visible = draft.questions.filter((q) => setFilter === 'all' || (q.difficulty || 'medium') === setFilter);

  const setQuestion = (index, partial) => {
    const questions = draft.questions.map((q, i) => (i === index ? { ...q, ...partial } : q));
    onChange({}, questions);
  };

  const removeAt = (index) => {
    onChange({}, draft.questions.filter((_, i) => i !== index));
  };

  const clearSet = (set) => {
    if (!window.confirm(`Remove every ${set} question from this round?`)) return;
    onChange({}, draft.questions.filter((q) => (q.difficulty || 'medium') !== set));
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
        <Box>
          <Typography sx={kicker}>Round</Typography>
          {live && <Chip size="small" label="Live" sx={{ mt: 0.75, bgcolor: '#ecfdf3', color: '#166534' }} />}
        </Box>
        <Button variant="contained" disabled={!dirty || saving} onClick={onSave} sx={{ bgcolor: '#111827', alignSelf: 'flex-start' }}>
          {saving ? 'Saving…' : 'Save round'}
        </Button>
      </Stack>

      {broken.length > 0 && (
        <Alert severity="warning">
          {broken.length} question{broken.length === 1 ? '' : 's'} have a correct answer that is not among their options, or no answer at all. Save stays off until those are fixed.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        <TextField label="Title" value={draft.title} onChange={(e) => onChange({ title: e.target.value })} />
        <TextField select label="Format" value={draft.quizType} onChange={(e) => onChange({ quizType: e.target.value })}>
          {QUIZ_TYPES.map(([id, label]) => <MenuItem key={id} value={id}>{label}</MenuItem>)}
        </TextField>
        <TextField label="Seconds per question" type="number" value={draft.timePerQuestion} onChange={(e) => onChange({ timePerQuestion: Number(e.target.value) })} />
        <TextField select label="Scoring" value={draft.scoring} onChange={(e) => onChange({ scoring: e.target.value })}>
          <MenuItem value="correct_only">Correct only</MenuItem>
          <MenuItem value="speed_bonus">Speed bonus</MenuItem>
          <MenuItem value="partial">Partial</MenuItem>
        </TextField>
        <TextField select label="Who plays" value={draft.scope} onChange={(e) => onChange({ scope: e.target.value })}>
          <MenuItem value="individual">Individuals</MenuItem>
          <MenuItem value="team">Teams</MenuItem>
        </TextField>
        <Stack direction="row" alignItems="center" spacing={2}>
          <FormControlLabel control={<Checkbox checked={draft.shuffle} onChange={(e) => onChange({ shuffle: e.target.checked })} />} label="Shuffle" />
          <FormControlLabel control={<Checkbox checked={draft.autoAdvance} onChange={(e) => onChange({ autoAdvance: e.target.checked })} />} label="Auto-advance" />
          <FormControlLabel control={<Checkbox checked={draft.allowRetake} onChange={(e) => onChange({ allowRetake: e.target.checked })} />} label="Allow retake" />
        </Stack>
      </Box>

      {draft.quizType === 'buzzer' && (
        <Box>
          <Typography sx={kicker}>Electric Answers</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mt: 1 }}>
            <TextField select label="Answers" value={draft.buzzer.answerMode} onChange={(e) => onChange({ buzzer: { ...draft.buzzer, answerMode: e.target.value } })}>
              <MenuItem value="in_app">In the app</MenuItem>
              <MenuItem value="spoken">Spoken</MenuItem>
            </TextField>
            <Num label="Countdown" value={draft.buzzer.countdownSeconds} onChange={(n) => onChange({ buzzer: { ...draft.buzzer, countdownSeconds: n } })} />
            <Num label="Buzz window" value={draft.buzzer.buzzWindowSeconds} onChange={(n) => onChange({ buzzer: { ...draft.buzzer, buzzWindowSeconds: n } })} />
            <Num label="Answer seconds" value={draft.buzzer.answerSeconds} onChange={(n) => onChange({ buzzer: { ...draft.buzzer, answerSeconds: n } })} />
            <Num label="Wrong penalty" value={draft.buzzer.wrongPenalty} onChange={(n) => onChange({ buzzer: { ...draft.buzzer, wrongPenalty: n } })} />
            <TextField select label="Tie-break" value={draft.buzzer.tieScope} onChange={(e) => onChange({ buzzer: { ...draft.buzzer, tieScope: e.target.value } })}>
              <MenuItem value="first">First place</MenuItem>
              <MenuItem value="podium">Podium</MenuItem>
            </TextField>
          </Box>
        </Box>
      )}

      {(draft.quizType === 'preloaded' || draft.paper.enabled) && (
        <Box>
          <Typography sx={kicker}>Paper draw</Typography>
          <FormControlLabel
            control={<Checkbox checked={draft.paper.enabled} onChange={(e) => onChange({ paper: { ...draft.paper, enabled: e.target.checked } })} />}
            label="Deal a paper from this bank"
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, mt: 1 }}>
            <Num label="Minutes" value={draft.paper.durationMinutes} onChange={(n) => onChange({ paper: { ...draft.paper, durationMinutes: n } })} />
            {SETS.slice(0, 3).map((set) => (
              <Num
                key={set}
                label={`${set} count`}
                value={draft.paper.counts[set]}
                onChange={(n) => onChange({ paper: { ...draft.paper, counts: { ...draft.paper.counts, [set]: n } } })}
              />
            ))}
          </Box>
        </Box>
      )}

      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
          <Typography sx={kicker}>Questions · {draft.questions.length}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {['all', ...SETS].map((set) => (
              <Chip key={set} label={set} size="small" onClick={() => setSetFilter(set)} variant={setFilter === set ? 'filled' : 'outlined'} sx={{ textTransform: 'capitalize' }} />
            ))}
            <Button size="small" onClick={onImport}>Import into this round</Button>
            {setFilter !== 'all' && (
              <Button size="small" color="error" onClick={() => clearSet(setFilter)}>Clear {setFilter}</Button>
            )}
          </Stack>
        </Stack>

        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {visible.length === 0 && <Typography sx={{ color: '#6b7280' }}>No questions in this set.</Typography>}
          {visible.map((q) => {
            const index = draft.questions.indexOf(q);
            const open = openId === (q._id || index);
            const bad = broken.includes(q);
            return (
              <Box key={q._id || index} sx={{ border: `1px solid ${bad ? '#fecaca' : '#e5e7eb'}`, borderRadius: 1.5, p: 1.25 }}>
                <Stack direction="row" alignItems="flex-start" spacing={1} onClick={() => setOpenId(open ? null : (q._id || index))} sx={{ cursor: 'pointer' }}>
                  <Typography sx={{ color: '#9ca3af', width: 28, fontVariantNumeric: 'tabular-nums' }}>{index + 1}</Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>{q.text || 'Untitled question'}</Typography>
                    <Typography sx={{ color: '#6b7280', fontSize: '0.78rem' }}>{q.difficulty || 'medium'} · {q.points} pts{q.correctAnswer ? ` · ${q.correctAnswer}` : ''}</Typography>
                  </Box>
                  <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); removeAt(index); }}>Delete</Button>
                </Stack>
                {open && (
                  <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                    <TextField label="Question" multiline minRows={2} value={q.text} onChange={(e) => setQuestion(index, { text: e.target.value })} />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                      <TextField select label="Type" value={q.type || 'choice'} onChange={(e) => setQuestion(index, { type: e.target.value })} sx={{ minWidth: 140 }}>
                        {['choice', 'mcq', 'truefalse', 'fillup', 'text'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </TextField>
                      <TextField select label="Set" value={SETS.includes(q.difficulty) ? q.difficulty : 'medium'} onChange={(e) => setQuestion(index, { difficulty: e.target.value })} sx={{ minWidth: 140 }}>
                        {SETS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </TextField>
                      <TextField label="Points" type="number" value={q.points} onChange={(e) => setQuestion(index, { points: Number(e.target.value) })} sx={{ width: 120 }} />
                    </Stack>
                    <TextField
                      label="Options, one per line"
                      multiline
                      minRows={3}
                      value={(q.options ?? []).join('\n')}
                      onChange={(e) => setQuestion(index, { options: e.target.value.split('\n') })}
                    />
                    <TextField label="Correct answer" value={q.correctAnswer || ''} onChange={(e) => setQuestion(index, { correctAnswer: e.target.value })} />
                  </Stack>
                )}
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}

function ImportDialog({ open, saving, hasRound, onClose, onApply }) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState(hasRound ? 'append' : 'new');
  const [set, setSet] = useState('');
  const [shuffle, setShuffle] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (open) {
      setMode(hasRound ? 'append' : 'new');
      setReport(null);
    }
  }, [open, hasRound]);

  const preview = useMemo(() => (text.trim() ? parseQuestionPack(text, { shuffle, set: set || null }) : null), [text, shuffle, set]);

  const readFile = async (file) => {
    if (!file) return;
    setText(await file.text());
    if (!title) setTitle(file.name.replace(/\.json$/i, ''));
  };

  const run = async () => {
    const result = await onApply({ text, mode: mode === 'new' ? 'replace-all' : mode, set, shuffle, title, asNew: mode === 'new' });
    setReport(result);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>Import questions</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          <TextField select label="Where they go" value={mode} onChange={(e) => setMode(e.target.value)}>
            <MenuItem value="new">New round</MenuItem>
            <MenuItem value="append" disabled={!hasRound}>Add to this round</MenuItem>
            <MenuItem value="replace-set" disabled={!hasRound}>Replace one set</MenuItem>
            <MenuItem value="replace-all" disabled={!hasRound}>Replace every question in this round</MenuItem>
          </TextField>
          {mode === 'new' && <TextField label="Round name" value={title} onChange={(e) => setTitle(e.target.value)} />}
          {mode === 'replace-set' && (
            <TextField select label="Set to replace" value={set || 'medium'} onChange={(e) => setSet(e.target.value)}>
              {SETS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          )}
          {mode !== 'replace-set' && (
            <TextField select label="Difficulty" value={set} onChange={(e) => setSet(e.target.value)} helperText="Leave as written to keep the difficulty already in the file.">
              <MenuItem value="">As written in the file</MenuItem>
              {SETS.map((s) => <MenuItem key={s} value={s}>Put all of them in {s}</MenuItem>)}
            </TextField>
          )}
          <FormControlLabel control={<Checkbox checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />} label="Shuffle into a random order" />
          <Button component="label" variant="outlined" sx={quietBtn}>
            Choose a JSON file
            <input hidden type="file" accept="application/json,.json" onChange={(e) => readFile(e.target.files?.[0])} />
          </Button>
          <TextField
            multiline
            minRows={8}
            placeholder='[{ "text": "Question", "options": ["A", "B"], "correctAnswer": "A", "difficulty": "easy" }]'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {preview && (
            <Alert severity={preview.questions.length ? 'info' : 'warning'}>
              {preview.questions.length} ready. {preview.errors.length} skipped. {preview.warnings.length} need a look.
              {preview.errors.slice(0, 4).map((line) => <div key={line}>{line}</div>)}
            </Alert>
          )}
          {report?.errors?.length > 0 && report.questions.length === 0 && (
            <Alert severity="error">{report.errors[0]}</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={saving || !preview?.questions.length} onClick={run} sx={{ bgcolor: '#111827' }}>
          {saving ? 'Importing…' : 'Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ResetDialog({ open, event, onClose }) {
  const [preview, setPreview] = useState(null);
  const [includePlay, setIncludePlay] = useState(true);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !event?._id) return undefined;
    let stop = false;
    setTyped('');
    setError(null);
    setIncludePlay(true);
    fetch(`/api/admin/events/registrations?eventId=${encodeURIComponent(event._id)}`, { cache: 'no-store' })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (stop) return;
        if (!ok) setError(data?.error || 'Could not preview the reset.');
        else setPreview(data.data ?? data);
      })
      .catch((err) => { if (!stop) setError(err.message); });
    return () => { stop = true; };
  }, [open, event?._id]);

  const matches = typed.trim().toLowerCase() === (event?.title ?? '').trim().toLowerCase();

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        eventId: event._id,
        confirm: event._id,
        includePlay: includePlay ? 'true' : 'false',
        force: includePlay ? 'true' : 'false',
      });
      const res = await fetch(`/api/admin/events/registrations?${params}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Reset was refused.');
      await fetch('/api/admin/leaderboard/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event._id }),
      });
      toast.success(`Removed ${data.data?.deleted ?? 0} registrations`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const play = preview?.play ?? {};

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Reset {event?.title}</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: '#4b5563', mb: 1.5 }}>
          This removes everyone registered for this event. Rounds and their questions stay.
        </Typography>
        {preview && (
          <Typography sx={{ mb: 1.5 }}>
            {preview.registrations ?? 0} registrations
            {preview.playTotal ? ` · ${preview.playTotal} play records (${play.submissions ?? 0} submissions, ${play.papers ?? 0} papers, ${play.answers ?? 0} answers)` : ''}
          </Typography>
        )}
        <FormControlLabel
          control={<Checkbox checked={includePlay} onChange={(e) => setIncludePlay(e.target.checked)} />}
          label="Also clear scores, papers, votes and hunt progress"
        />
        <TextField
          fullWidth
          sx={{ mt: 1.5 }}
          label="Type the event title to confirm"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
        {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" disabled={!matches || busy} onClick={run}>
          {busy ? 'Resetting…' : 'Remove entrants'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Num({ label, value, onChange }) {
  return <TextField label={label} type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />;
}

function draftFrom(activity) {
  const quiz = activity.quiz ?? {};
  const paper = quiz.paper ?? {};
  const buzzer = quiz.buzzer ?? {};
  return {
    title: activity.title ?? '',
    description: activity.description ?? '',
    quizType: quiz.quizType ?? 'rapid_fire',
    timePerQuestion: quiz.timePerQuestion ?? 10,
    scoring: quiz.scoring ?? 'correct_only',
    shuffle: quiz.shuffle !== false,
    autoAdvance: quiz.autoAdvance !== false,
    scope: quiz.scope ?? 'individual',
    allowRetake: Boolean(quiz.allowRetake),
    paper: {
      enabled: Boolean(paper.enabled),
      durationMinutes: paper.durationMinutes ?? 30,
      shuffleQuestions: paper.shuffleQuestions !== false,
      shuffleOptions: paper.shuffleOptions !== false,
      counts: { easy: paper.counts?.easy ?? 8, medium: paper.counts?.medium ?? 10, hard: paper.counts?.hard ?? 5 },
      points: { easy: paper.points?.easy ?? 5, medium: paper.points?.medium ?? 11, hard: paper.points?.hard ?? 20 },
      power: paper.power ?? { enabled: false, count: 2, points: 25 },
    },
    buzzer: {
      answerMode: buzzer.answerMode ?? 'in_app',
      countdownSeconds: buzzer.countdownSeconds ?? 3,
      buzzWindowSeconds: buzzer.buzzWindowSeconds ?? 10,
      answerSeconds: buzzer.answerSeconds ?? 15,
      wrongPenalty: buzzer.wrongPenalty ?? 0,
      falseStartLockout: buzzer.falseStartLockout !== false,
      tieScope: buzzer.tieScope ?? 'first',
    },
    questions: (quiz.questions ?? []).map((q) => ({ ...q, options: [...(q.options ?? [])], acceptedAnswers: [...(q.acceptedAnswers ?? [])] })),
  };
}

function saveBody(id, draft) {
  const quiz = {
    quizType: draft.quizType,
    timePerQuestion: draft.timePerQuestion,
    scoring: draft.scoring,
    shuffle: draft.shuffle,
    autoAdvance: draft.autoAdvance,
    scope: draft.scope,
    allowRetake: draft.allowRetake,
    questions: draft.questions.map((q) => ({
      ...(q._id ? { _id: q._id } : {}),
      text: q.text,
      type: q.type || 'choice',
      options: (q.options ?? []).map((option) => String(option).trim()).filter(Boolean),
      correctAnswer: q.correctAnswer ?? '',
      acceptedAnswers: q.acceptedAnswers ?? [],
      source: q.source === 'spot' ? 'spot' : 'pack',
      difficulty: q.difficulty || 'medium',
      points: Number(q.points) || 0,
      ...(q.pool ? { pool: q.pool } : {}),
      ...(q.slot ? { slot: q.slot } : {}),
      ...(q.imageUrl ? { imageUrl: q.imageUrl } : {}),
    })),
  };
  if (draft.quizType === 'preloaded' || draft.paper.enabled) quiz.paper = draft.paper;
  if (draft.quizType === 'buzzer') quiz.buzzer = draft.buzzer;
  return { id, action: 'update', title: draft.title, description: draft.description, quiz };
}

function labelType(type) {
  return QUIZ_TYPES.find(([id]) => id === type)?.[1] ?? type ?? 'quiz';
}

const panel = { bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, p: 2 };
const kicker = { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280' };
const quietBtn = { borderColor: '#d1d5db', color: '#111827' };
