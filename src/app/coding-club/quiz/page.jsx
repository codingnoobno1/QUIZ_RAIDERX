'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Sparkles, Search, X, Layers, BookOpen, FileQuestion,
  Check, ChevronRight, GraduationCap, Inbox,
} from 'lucide-react';
import FacultyCard from '@/components/ui/profilecard';
import QuizCard from '@/components/ui/QuizCard';

export default function QuizHubPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [facultyData, setFacultyData] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // ── Faculty list ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/quizcardfetch');
        if (res.ok) setFacultyData(await res.json());
        else setError('Failed to fetch faculty data');
      } catch {
        setError('Error connecting to the server');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Quizzes when batch + subject chosen ───────────────────────────────────
  useEffect(() => {
    if (selectedFaculty && selectedBatch && selectedSubject) fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFaculty, selectedBatch, selectedSubject]);

  const fetchQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const assignment = selectedFaculty.classAssignments?.find((a) => a.batch === selectedBatch);
      const semester = assignment?.semester || 5;
      const res = await fetch(
        `/api/fetchquizzes?batch=${encodeURIComponent(selectedBatch)}&subject=${encodeURIComponent(selectedSubject)}&semester=${semester}`
      );
      const data = res.ok ? await res.json() : {};
      setQuizzes(data.quizzes || []);
    } catch {
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const closeModal = () => {
    setSelectedFaculty(null);
    setSelectedBatch('');
    setSelectedSubject('');
    setQuizzes([]);
  };

  const openFaculty = (faculty) => {
    setSelectedFaculty(faculty);
    setSelectedBatch('');
    setSelectedSubject('');
    setQuizzes([]);
  };

  const availableBatches =
    selectedFaculty?.classAssignments?.map((a) => a.batch).filter(Boolean) || [];

  const availableSubjects = (() => {
    if (!selectedFaculty || !selectedBatch) return [];
    const a = selectedFaculty.classAssignments?.find((x) => x.batch === selectedBatch);
    return (a?.subjects || []).map((s) => (typeof s === 'object' ? s.name : s));
  })();

  // Stepper state
  const steps = [
    { id: 1, label: 'Batch',   icon: Layers,       done: !!selectedBatch,   active: !selectedBatch },
    { id: 2, label: 'Subject', icon: BookOpen,     done: !!selectedSubject, active: !!selectedBatch && !selectedSubject },
    { id: 3, label: 'Quiz',    icon: FileQuestion, done: false,             active: !!selectedBatch && !!selectedSubject },
  ];

  const facInitials = (n = '') => {
    const p = n.trim().split(/\s+/);
    return (p.length >= 2 ? `${p[0][0]}${p[1][0]}` : n.slice(0, 2)).toUpperCase() || '??';
  };

  // Live client-side mentor filter (name / subject / department / position)
  const filteredFaculty = (() => {
    const q = search.trim().toLowerCase();
    if (!q) return facultyData;
    return facultyData.filter((f) => {
      const subjects = (f.classAssignments || [])
        .flatMap((a) => a.subjects || [])
        .map((s) => (typeof s === 'object' ? s.name : s));
      return [f.name, f.department, f.position, f.Position, ...subjects]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  })();

  return (
    <div className="qz-page">
      <QuizHubStyles />
      <div className="qz-bg" aria-hidden="true" />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <motion.header
        className="qz-hero"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="qz-hero-glow" />
        <span className="qz-hero-eyebrow"><Sparkles size={13} /> Knowledge Arena</span>
        <h1 className="qz-hero-title">Quiz Hub</h1>
        <p className="qz-hero-sub">
          Pick a mentor to explore their batches, subjects and live quizzes.
        </p>
        {!isLoading && !error && facultyData.length > 0 && (
          <div className="qz-hero-tools">
            <label className="qz-search">
              <Search size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mentors by name, subject or department…"
              />
              {search && (
                <button
                  type="button"
                  className="qz-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </label>
            <span className="qz-hero-count">
              <GraduationCap size={14} /> {filteredFaculty.length}
              {search ? ` / ${facultyData.length}` : ''} mentor{facultyData.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </motion.header>

      {/* ── Faculty grid ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="qz-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="qz-skel" key={i}>
              <span className="qz-skel-av" />
              <span className="qz-skel-line qz-skel-line--lg" />
              <span className="qz-skel-line qz-skel-line--sm" />
              <span className="qz-skel-line qz-skel-line--md" />
              <span className="qz-skel-stats" />
              <span className="qz-skel-cta" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="qz-state qz-state--err"><p>{error}</p></div>
      ) : facultyData.length === 0 ? (
        <div className="qz-state"><Inbox size={34} /><p>No mentors found.</p></div>
      ) : filteredFaculty.length === 0 ? (
        <div className="qz-state">
          <Search size={34} />
          <p>No mentors match &ldquo;{search}&rdquo;.</p>
          <button type="button" className="qz-state-btn" onClick={() => setSearch('')}>
            Clear search
          </button>
        </div>
      ) : (
        <div className="qz-grid">
          {filteredFaculty.map((faculty, i) => (
            <motion.div
              key={faculty.uuid || faculty.name}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.32 }}
            >
              <FacultyCard faculty={faculty} onClick={() => openFaculty(faculty)} />
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Premium selection modal (Radix) ────────────────────────────── */}
      <Dialog.Root open={!!selectedFaculty} onOpenChange={(o) => !o && closeModal()}>
        <Dialog.Portal>
          <Dialog.Overlay className="qz-overlay" />
          <Dialog.Content className="qz-modal" aria-describedby={undefined}>
            {selectedFaculty && (
              <>
                {/* Header */}
                <div className="qz-modal-head">
                  <div className="qz-modal-id">
                    <span className="qz-modal-av">
                      {selectedFaculty.imageUrl
                        ? <img src={selectedFaculty.imageUrl} alt={selectedFaculty.name} />
                        : facInitials(selectedFaculty.name)}
                    </span>
                    <div>
                      <Dialog.Title className="qz-modal-name">{selectedFaculty.name}</Dialog.Title>
                      <p className="qz-modal-dept">
                        {selectedFaculty.position ? `${selectedFaculty.position} · ` : ''}
                        {selectedFaculty.department}
                      </p>
                    </div>
                  </div>
                  <Dialog.Close className="qz-modal-close" aria-label="Close"><X size={18} /></Dialog.Close>
                </div>

                {/* Stepper */}
                <div className="qz-steps">
                  {steps.map((s, idx) => (
                    <div className="qz-step-wrap" key={s.id}>
                      <div className={`qz-step ${s.active ? 'qz-step--active' : ''} ${s.done ? 'qz-step--done' : ''}`}>
                        <span className="qz-step-num">
                          {s.done ? <Check size={14} /> : <s.icon size={14} />}
                        </span>
                        <span className="qz-step-label">{s.label}</span>
                      </div>
                      {idx < steps.length - 1 && <span className="qz-step-line" />}
                    </div>
                  ))}
                </div>

                {/* Body */}
                <div className="qz-modal-body">
                  {/* Batch */}
                  <div className="qz-sel">
                    <span className="qz-sel-label"><Layers size={13} /> Select Batch</span>
                    <div className="qz-pills">
                      {availableBatches.length === 0 && <span className="qz-pill-empty">No batches assigned</span>}
                      {availableBatches.map((b) => (
                        <button
                          key={b}
                          className={`qz-pill ${selectedBatch === b ? 'qz-pill--active' : ''}`}
                          onClick={() => { setSelectedBatch(b); setSelectedSubject(''); setQuizzes([]); }}
                        >
                          {b}
                          {selectedBatch === b && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <AnimatePresence>
                    {selectedBatch && (
                      <motion.div
                        className="qz-sel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <span className="qz-sel-label"><BookOpen size={13} /> Select Subject</span>
                        <div className="qz-pills">
                          {availableSubjects.length === 0 && <span className="qz-pill-empty">No subjects for this batch</span>}
                          {availableSubjects.map((s) => (
                            <button
                              key={s}
                              className={`qz-pill ${selectedSubject === s ? 'qz-pill--active' : ''}`}
                              onClick={() => setSelectedSubject(s)}
                            >
                              {s}
                              {selectedSubject === s && <Check size={13} />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quizzes */}
                  <div className="qz-quizwrap">
                    {!selectedBatch || !selectedSubject ? (
                      <div className="qz-quiz-empty">
                        <Search size={30} />
                        <p>Choose a batch and subject</p>
                        <span>Available quizzes will appear here.</span>
                      </div>
                    ) : loadingQuizzes ? (
                      <div className="qz-state"><div className="qz-spin" /><p>Loading quizzes…</p></div>
                    ) : quizzes.length === 0 ? (
                      <div className="qz-quiz-empty">
                        <Inbox size={30} />
                        <p>No quizzes available</p>
                        <span>There are no published quizzes for this selection yet.</span>
                      </div>
                    ) : (
                      <>
                        <div className="qz-quiz-listhead">
                          <ChevronRight size={15} />
                          {quizzes.length} quiz{quizzes.length > 1 ? 'zes' : ''} available
                        </div>
                        <div className="qz-quiz-list">
                          <AnimatePresence>
                            {quizzes.map((quiz, i) => (
                              <motion.div
                                key={quiz._id}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <QuizCard quiz={quiz} />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Page-scoped styles (faculty/quiz CARD styles are self-contained in their   *
 *  own components via React 19 <style href precedence>)                       *
 * ─────────────────────────────────────────────────────────────────────────── */
function QuizHubStyles() {
  return (
    <style>{`
      .qz-page { position: relative; max-width: 1320px; margin: 0 auto; padding: 8px 16px 56px; color: #e7e7ea; }

      /* Ambient backdrop — layered glows + faded grid for depth */
      .qz-bg { position: fixed; inset: 0; z-index: -1; pointer-events: none;
        background:
          radial-gradient(900px 520px at 12% -8%, rgba(34,211,238,.10), transparent 60%),
          radial-gradient(820px 540px at 100% 0%, rgba(168,85,247,.10), transparent 55%),
          radial-gradient(760px 600px at 50% 118%, rgba(99,102,241,.08), transparent 60%); }
      .qz-bg::after { content: ''; position: absolute; inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px);
        background-size: 46px 46px;
        -webkit-mask-image: radial-gradient(circle at 50% -10%, #000 30%, transparent 78%);
        mask-image: radial-gradient(circle at 50% -10%, #000 30%, transparent 78%); }

      /* Hero */
      .qz-hero { position: relative; overflow: hidden; border-radius: 22px; padding: 32px 30px; margin-bottom: 28px;
        background: linear-gradient(135deg, rgba(34,211,238,.12), rgba(168,85,247,.10) 55%, rgba(17,17,24,.96));
        border: 1px solid rgba(255,255,255,.08); }
      .qz-hero-glow { position: absolute; top: -70%; right: -5%; width: 420px; height: 420px; border-radius: 50%;
        background: radial-gradient(circle, rgba(34,211,238,.22), transparent 70%); filter: blur(60px); pointer-events: none; }
      .qz-hero::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .55;
        background-image: radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px); background-size: 22px 22px;
        -webkit-mask-image: linear-gradient(180deg, #000, transparent 72%);
        mask-image: linear-gradient(180deg, #000, transparent 72%); }
      .qz-hero-eyebrow { position: relative; display: inline-flex; align-items: center; gap: 6px; font-size: .72rem;
        font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #22d3ee;
        padding: 5px 12px; border-radius: 999px; background: rgba(34,211,238,.1); border: 1px solid rgba(34,211,238,.25); }
      .qz-hero-title { position: relative; margin: 14px 0 6px; font-size: 2.4rem; font-weight: 900; line-height: 1;
        background: linear-gradient(120deg, #fff 20%, #67e8f9 60%, #a855f7); -webkit-background-clip: text;
        background-clip: text; -webkit-text-fill-color: transparent; }
      .qz-hero-sub { position: relative; margin: 0; font-size: .98rem; color: rgba(255,255,255,.6); max-width: 520px; }
      .qz-hero-count { position: relative; display: inline-flex; align-items: center; gap: 6px; margin-top: 16px;
        font-size: .8rem; font-weight: 600; color: rgba(255,255,255,.7); padding: 6px 12px; border-radius: 999px;
        background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); }

      /* Hero tools — search + count */
      .qz-hero-tools { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 20px; }
      .qz-hero-tools .qz-hero-count { margin-top: 0; }
      .qz-search { display: inline-flex; align-items: center; gap: 9px; flex: 1 1 280px; min-width: 220px; max-width: 480px;
        padding: 11px 14px; border-radius: 13px; color: rgba(255,255,255,.85);
        background: rgba(8,8,14,.55); border: 1px solid rgba(255,255,255,.12);
        transition: border-color .18s ease, box-shadow .18s ease, background .18s ease; }
      .qz-search:focus-within { border-color: rgba(34,211,238,.55); background: rgba(8,8,14,.8);
        box-shadow: 0 0 0 3px rgba(34,211,238,.16); }
      .qz-search > svg { color: rgba(255,255,255,.45); flex-shrink: 0; }
      .qz-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: #fff;
        font-size: .9rem; font-family: inherit; }
      .qz-search input::placeholder { color: rgba(255,255,255,.4); }
      .qz-search-clear { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px;
        flex-shrink: 0; border: 0; border-radius: 7px; cursor: pointer; color: rgba(255,255,255,.6);
        background: rgba(255,255,255,.08); transition: all .15s ease; }
      .qz-search-clear:hover { color: #fff; background: rgba(239,68,68,.28); }

      /* Faculty grid */
      .qz-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 18px; align-items: stretch; }
      .qz-grid > * { height: 100%; }

      /* States / spinner */
      .qz-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
        padding: 60px 20px; color: rgba(255,255,255,.45); text-align: center; }
      .qz-state p { margin: 0; font-size: .92rem; }
      .qz-state--err { color: #f87171; }
      .qz-spin { width: 34px; height: 34px; border: 3px solid rgba(34,211,238,.22); border-top-color: #22d3ee;
        border-radius: 50%; animation: qzspin2 .7s linear infinite; }
      @keyframes qzspin2 { to { transform: rotate(360deg); } }
      .qz-state-btn { margin-top: 4px; padding: 8px 18px; border-radius: 10px; cursor: pointer; border: 0;
        font-size: .82rem; font-weight: 700; color: #04121a; background: linear-gradient(135deg,#22d3ee,#67e8f9);
        transition: box-shadow .18s ease, transform .18s ease; }
      .qz-state-btn:hover { box-shadow: 0 8px 22px rgba(34,211,238,.3); transform: translateY(-1px); }

      /* Loading skeletons — mirror the faculty card silhouette */
      .qz-skel { display: flex; flex-direction: column; align-items: center; height: 100%; padding: 22px 20px 20px;
        border-radius: 20px; background: linear-gradient(180deg,#14141d,#0c0c12); border: 1px solid rgba(255,255,255,.06); }
      .qz-skel > * { display: block; border-radius: 8px; background: rgba(255,255,255,.06); position: relative; overflow: hidden; }
      .qz-skel > *::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.09), transparent); animation: qzshimmer 1.3s infinite; }
      @keyframes qzshimmer { to { transform: translateX(100%); } }
      .qz-skel-av { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 16px; }
      .qz-skel-line { height: 12px; }
      .qz-skel-line--lg { width: 68%; height: 15px; margin-bottom: 9px; }
      .qz-skel-line--sm { width: 42%; margin-bottom: 9px; }
      .qz-skel-line--md { width: 56%; margin-bottom: 18px; }
      .qz-skel-stats { width: 100%; height: 52px; border-radius: 12px; margin-bottom: 16px; }
      .qz-skel-cta { width: 100%; height: 40px; border-radius: 12px; margin-top: auto; }

      /* ── Modal (Radix Dialog) ──────────────────────────────────────────── */
      .qz-overlay { position: fixed; inset: 0; z-index: 1300; background: rgba(4,4,10,.7);
        backdrop-filter: blur(6px); animation: qzfade .2s ease; }
      @keyframes qzfade { from { opacity: 0; } to { opacity: 1; } }
      .qz-modal { position: fixed; z-index: 1301; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 92vw; max-width: 1040px; max-height: 88vh; display: flex; flex-direction: column; overflow: hidden;
        border-radius: 22px; background: #0c0c12; border: 1px solid rgba(255,255,255,.1);
        box-shadow: 0 40px 120px rgba(0,0,0,.7); animation: qzpop .26s cubic-bezier(.16,1,.3,1); }
      .qz-modal::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
        background: linear-gradient(90deg, #22d3ee, #a855f7, #6366f1); }
      @keyframes qzpop { from { opacity: 0; transform: translate(-50%, -46%) scale(.97); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }

      .qz-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 16px;
        padding: 22px 24px 18px; border-bottom: 1px solid rgba(255,255,255,.07); }
      .qz-modal-id { display: flex; align-items: center; gap: 14px; min-width: 0; }
      .qz-modal-av { width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0; overflow: hidden;
        display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; color: #fff;
        background: linear-gradient(135deg, #22d3ee, #a855f7); box-shadow: 0 6px 18px rgba(34,211,238,.3); }
      .qz-modal-av img { width: 100%; height: 100%; object-fit: cover; }
      .qz-modal-name { margin: 0; font-size: 1.25rem; font-weight: 800; color: #fff; line-height: 1.2; }
      .qz-modal-dept { margin: 3px 0 0; font-size: .82rem; color: rgba(255,255,255,.5); }
      .qz-modal-close { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; cursor: pointer; color: #fff;
        display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.05);
        border: 1px solid rgba(255,255,255,.12); transition: all .18s; }
      .qz-modal-close:hover { background: rgba(239,68,68,.14); border-color: rgba(239,68,68,.4); color: #fca5a5; }

      /* Stepper */
      .qz-steps { display: flex; align-items: center; padding: 16px 24px; gap: 4px;
        border-bottom: 1px solid rgba(255,255,255,.07); background: rgba(255,255,255,.015); }
      .qz-step-wrap { display: flex; align-items: center; flex: 1; }
      .qz-step { display: flex; align-items: center; gap: 8px; }
      .qz-step-num { width: 28px; height: 28px; border-radius: 9px; display: flex; align-items: center;
        justify-content: center; color: rgba(255,255,255,.5); background: rgba(255,255,255,.05);
        border: 1px solid rgba(255,255,255,.1); transition: all .2s; }
      .qz-step-label { font-size: .82rem; font-weight: 700; color: rgba(255,255,255,.4); transition: color .2s; }
      .qz-step--active .qz-step-num { color: #04121a; background: linear-gradient(135deg,#22d3ee,#67e8f9);
        border-color: transparent; box-shadow: 0 4px 14px rgba(34,211,238,.4); }
      .qz-step--active .qz-step-label { color: #fff; }
      .qz-step--done .qz-step-num { color: #22c55e; background: rgba(34,197,94,.14); border-color: rgba(34,197,94,.4); }
      .qz-step--done .qz-step-label { color: rgba(255,255,255,.7); }
      .qz-step-line { flex: 1; height: 1px; margin: 0 10px; background: rgba(255,255,255,.12); }

      /* Body */
      .qz-modal-body { padding: 22px 24px 26px; overflow-y: auto; }
      .qz-modal-body::-webkit-scrollbar { width: 8px; }
      .qz-modal-body::-webkit-scrollbar-track { background: transparent; }
      .qz-modal-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.14); border-radius: 8px; }
      .qz-modal-body::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.24); }
      .qz-sel { margin-bottom: 20px; overflow: hidden; }
      .qz-sel-label { display: inline-flex; align-items: center; gap: 6px; font-size: .72rem; font-weight: 700;
        text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.5); margin-bottom: 10px; }
      .qz-pills { display: flex; flex-wrap: wrap; gap: 9px; }
      .qz-pill { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 11px;
        font-size: .86rem; font-weight: 600; color: rgba(255,255,255,.75); cursor: pointer;
        background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); transition: all .16s; }
      .qz-pill:hover { color: #fff; border-color: rgba(34,211,238,.5); background: rgba(34,211,238,.08); transform: translateY(-1px); }
      .qz-pill--active { color: #04121a; background: linear-gradient(135deg,#22d3ee,#67e8f9); border-color: transparent;
        box-shadow: 0 6px 18px rgba(34,211,238,.32); }
      .qz-pill--active:hover { color: #04121a; background: linear-gradient(135deg,#22d3ee,#67e8f9); }
      .qz-pill-empty { font-size: .82rem; color: rgba(255,255,255,.35); font-style: italic; }

      /* Quiz list area */
      .qz-quizwrap { margin-top: 8px; }
      .qz-quiz-listhead { display: flex; align-items: center; gap: 4px; font-size: .76rem; font-weight: 700;
        text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.5); margin-bottom: 14px;
        padding-top: 16px; border-top: 1px solid rgba(255,255,255,.07); }
      .qz-quiz-list { display: flex; flex-direction: column; gap: 12px; }
      .qz-quiz-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
        padding: 48px 20px; text-align: center; color: rgba(255,255,255,.3);
        border: 1px dashed rgba(255,255,255,.1); border-radius: 16px; margin-top: 8px; }
      .qz-quiz-empty p { margin: 8px 0 0; font-size: .92rem; color: rgba(255,255,255,.6); font-weight: 700; }
      .qz-quiz-empty span { font-size: .78rem; }

      /* Responsive */
      @media (max-width: 640px) {
        .qz-page { padding: 6px 12px 48px; }
        .qz-hero { padding: 24px 18px; }
        .qz-hero-title { font-size: 1.9rem; }
        .qz-search { flex-basis: 100%; max-width: none; min-width: 0; }
        .qz-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
        .qz-modal { width: 96vw; max-height: 92vh; border-radius: 18px; }
        .qz-modal-head { padding: 18px 16px 14px; }
        .qz-steps { padding: 14px 16px; }
        .qz-step-label { display: none; }
        .qz-step-line { margin: 0 6px; }
        .qz-modal-body { padding: 18px 16px 22px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .qz-overlay, .qz-modal { animation: none; }
        .qz-fac:hover .qz-fac-avring { animation: none; }
      }
    `}</style>
  );
}
