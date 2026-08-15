'use client';

import { useMemo } from 'react';
import { GraduationCap, Layers, BookOpen, FileQuestion } from 'lucide-react';

/**
 * FacultyCard — premium dark mentor tile for the Quiz Hub.
 *
 * Styling is SELF-CONTAINED: the CSS ships inside the component via a React 19
 * hoisted <style href precedence> tag. React dedupes by `href`, so rendering a
 * whole grid of cards injects the stylesheet exactly once. This guarantees the
 * card looks identical everywhere it's reused (quiz hub, /quizzes, QuizSection)
 * and never depends on globals.css being loaded/HMR-fresh.
 *
 * Props: { faculty, onClick }
 */

const FACULTY_CARD_CSS = `
.qz-fac{position:relative;display:block;width:100%;height:100%;padding:1px;border-radius:20px;border:0;text-align:left;cursor:pointer;background:linear-gradient(160deg,rgba(34,211,238,.35),rgba(168,85,247,.22) 45%,rgba(255,255,255,.05));transition:transform .22s cubic-bezier(.4,0,.2,1),box-shadow .22s ease;}
.qz-fac-inner{display:flex;flex-direction:column;height:100%;padding:22px 20px 20px;border-radius:19px;background:linear-gradient(180deg,#14141d 0%,#0c0c12 100%);overflow:hidden;}
@media (hover:hover) and (pointer:fine){.qz-fac:hover{transform:translateY(-6px);box-shadow:0 24px 60px rgba(34,211,238,.18),0 8px 24px rgba(0,0,0,.5);}}
.qz-fac:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(34,211,238,.45);}
.qz-fac-avwrap{position:relative;width:86px;height:86px;margin:0 auto 14px;flex-shrink:0;}
.qz-fac-avring{position:absolute;inset:-3px;border-radius:50%;background:conic-gradient(from 140deg,#22d3ee,#a855f7,#6366f1,#22d3ee);opacity:.9;}
.qz-fac:hover .qz-fac-avring{animation:qzspin 4s linear infinite;}
@keyframes qzspin{to{transform:rotate(360deg);}}
.qz-fac-av{position:relative;width:100%;height:100%;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#0e0e15;border:3px solid #0c0c12;font-weight:800;font-size:1.5rem;color:#fff;}
.qz-fac-av img{width:100%;height:100%;object-fit:cover;}
.qz-fac-av-grad{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#22d3ee,#a855f7);}
.qz-fac-name{display:block;text-align:center;font-size:1.06rem;font-weight:800;color:#fff;line-height:1.25;}
.qz-fac-pos{display:block;text-align:center;font-size:.68rem;letter-spacing:.13em;text-transform:uppercase;color:#22d3ee;font-weight:700;margin-top:5px;}
.qz-fac-dept{display:block;text-align:center;font-size:.78rem;color:rgba(255,255,255,.5);margin-top:6px;min-height:1.1em;}
.qz-fac-stats{display:flex;gap:8px;margin-top:16px;}
.qz-fac-stat{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 4px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);}
.qz-fac-stat b{font-size:1.05rem;font-weight:800;color:#fff;}
.qz-fac-stat span{font-size:.62rem;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.45);}
.qz-fac-cta{margin-top:auto;padding-top:16px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:.88rem;color:#22d3ee;transition:gap .2s ease;}
.qz-fac:hover .qz-fac-cta{gap:12px;}
`;

const FacultyCard = ({ faculty = {}, onClick }) => {
  const assignments = faculty.classAssignments || [];

  const subjectCount = useMemo(() => {
    const set = new Set();
    assignments.forEach((a) =>
      (a.subjects || []).forEach((s) => set.add(typeof s === 'object' ? s.name : s))
    );
    return set.size;
  }, [assignments]);

  const batchCount = assignments.length;
  const quizCount = faculty.quizCount ?? faculty.quizzes?.length ?? 0;

  const initials = (() => {
    const n = faculty.name || '';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.substring(0, 2).toUpperCase() || '??';
  })();

  return (
    <>
      <style href="qz-faculty-card-v1" precedence="high">
        {FACULTY_CARD_CSS}
      </style>

      <button type="button" className="qz-fac" onClick={onClick}>
        <span className="qz-fac-inner">
          <span className="qz-fac-avwrap">
            <span className="qz-fac-avring" />
            <span className="qz-fac-av">
              {faculty.imageUrl ? (
                <img src={faculty.imageUrl} alt={faculty.name} />
              ) : (
                <span className="qz-fac-av-grad">{initials}</span>
              )}
            </span>
          </span>

          <span className="qz-fac-name">{faculty.name || 'Mentor'}</span>
          <span className="qz-fac-pos">{faculty.position || faculty.Position || 'Mentor'}</span>
          <span className="qz-fac-dept">
            <GraduationCap size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />
            {faculty.department || 'Department'}
          </span>

          <span className="qz-fac-stats">
            <span className="qz-fac-stat">
              <b><Layers size={13} style={{ verticalAlign: '-2px', marginRight: 3, opacity: 0.7 }} />{batchCount}</b>
              <span>Batches</span>
            </span>
            <span className="qz-fac-stat">
              <b><BookOpen size={13} style={{ verticalAlign: '-2px', marginRight: 3, opacity: 0.7 }} />{subjectCount}</b>
              <span>Subjects</span>
            </span>
            <span className="qz-fac-stat">
              <b><FileQuestion size={13} style={{ verticalAlign: '-2px', marginRight: 3, opacity: 0.7 }} />{quizCount}</b>
              <span>Quizzes</span>
            </span>
          </span>

          <span className="qz-fac-cta">View Quizzes &rarr;</span>
        </span>
      </button>
    </>
  );
};

export default FacultyCard;
