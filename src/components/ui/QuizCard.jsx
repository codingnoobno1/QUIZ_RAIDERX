'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BookOpen, Clock, Award, FileQuestion, Play, Lock } from 'lucide-react';

/**
 * QuizCard — premium horizontal quiz row with a status-coloured accent strip.
 *
 * Styling is SELF-CONTAINED via a React 19 hoisted <style href precedence> tag
 * (deduped by `href`, injected once for the whole list). This guarantees the
 * card renders correctly everywhere it's reused and never depends on globals.css
 * being loaded/HMR-fresh.
 *
 * Props: { quiz }
 */

const QUIZ_CARD_CSS = `
.qz-quiz{--accent:#22c55e;position:relative;display:flex;gap:16px;width:100%;padding:14px 16px 14px 18px;border-radius:18px;background:#111118;border:1px solid rgba(255,255,255,.08);overflow:hidden;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease;}
.qz-quiz::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--accent);}
@media (hover:hover) and (pointer:fine){.qz-quiz:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--accent) 45%,transparent);box-shadow:0 16px 40px color-mix(in srgb,var(--accent) 16%,transparent);}}
.qz-quiz-icon{width:50px;height:50px;min-width:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;align-self:flex-start;color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);}
.qz-quiz-art{position:relative;width:112px;min-width:112px;align-self:stretch;min-height:132px;border-radius:14px;overflow:hidden;background:#eef2ff;}
.qz-quiz-art img{object-fit:cover;}
.qz-quiz-art-badge{position:absolute;left:8px;top:8px;z-index:1;width:30px;height:30px;border-radius:10px;display:grid;place-items:center;color:#fff;background:rgba(42,31,82,.76);backdrop-filter:blur(8px);}
.qz-quiz-body{display:flex;flex-direction:column;flex:1;min-width:0;}
.qz-quiz-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.qz-quiz-title{margin:0;font-size:1.05rem;font-weight:800;color:#fff;line-height:1.25;}
.qz-quiz-status{display:inline-flex;align-items:center;gap:5px;flex-shrink:0;padding:4px 10px;border-radius:999px;font-size:.66rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);background:color-mix(in srgb,var(--accent) 14%,transparent);border:1px solid color-mix(in srgb,var(--accent) 32%,transparent);}
.qz-quiz-dot{width:7px;height:7px;border-radius:50%;background:var(--accent);}
.qz-quiz-status--live .qz-quiz-dot{animation:qzpulse 1.4s ease-in-out infinite;}
@keyframes qzpulse{0%,100%{opacity:1;}50%{opacity:.5;}}
.qz-quiz-sub{margin:5px 0 0;font-size:.8rem;color:#22d3ee;font-weight:600;}
.qz-quiz-desc{margin:8px 0 0;font-size:.84rem;color:rgba(255,255,255,.5);line-height:1.5;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;}
.qz-quiz-foot{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:14px;flex-wrap:wrap;}
.qz-quiz-meta{display:flex;gap:8px;flex-wrap:wrap;}
.qz-quiz-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:9px;font-size:.74rem;font-weight:600;color:rgba(255,255,255,.7);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);}
.qz-quiz-cta{display:inline-flex;align-items:center;gap:7px;padding:10px 20px;border-radius:11px;font-weight:800;font-size:.85rem;border:0;cursor:pointer;color:#04121a;background:linear-gradient(135deg,#22d3ee,#67e8f9);transition:gap .2s ease,box-shadow .2s ease,opacity .2s ease;}
.qz-quiz-cta:hover{gap:11px;box-shadow:0 8px 22px rgba(34,211,238,.35);}
.qz-quiz-cta:disabled{cursor:not-allowed;color:rgba(255,255,255,.4);background:rgba(255,255,255,.06);box-shadow:none;gap:7px;}
html[data-quiz-theme='bright'] .qz-quiz{background:#fff;border-color:#e6e1f0;box-shadow:0 12px 32px rgba(61,48,108,.09);}
html[data-quiz-theme='bright'] .qz-quiz-title{color:#28243f;}
html[data-quiz-theme='bright'] .qz-quiz-desc{color:#777287;}
html[data-quiz-theme='bright'] .qz-quiz-pill{color:#5c576c;background:#f8f6fc;border-color:#eae5f2;}
html[data-quiz-theme='bright'] .qz-quiz-cta{color:#fff;background:linear-gradient(135deg,#7c3aed,#2563eb);}
html[data-quiz-theme='bright'] .qz-quiz-cta:disabled{color:#918c9d;background:#efedf3;}
@media (max-width:560px){.qz-quiz{flex-wrap:wrap;}.qz-quiz-art{width:100%;height:150px;min-height:0;}.qz-quiz-foot{flex-direction:column;align-items:stretch;}.qz-quiz-cta{justify-content:center;}}
`;

const QuizCard = ({ quiz = {} }) => {
  const router = useRouter();

  const status = quiz.availabilityStatus;
  const isLive = status === 'on';
  const isScheduled = status === 'scheduled';

  const accent = isLive ? '#22c55e' : isScheduled ? '#f59e0b' : '#6b7280';
  const statusLabel = isLive ? 'Live' : isScheduled ? 'Scheduled' : 'Closed';

  const subject = quiz.subjectId?.name || 'General';
  const normalizedSubject = subject.toLowerCase();
  const artwork = /science|physics|chem|bio|environment|math/.test(normalizedSubject)
    ? '/quiz-assets/science-discovery.png'
    : '/quiz-assets/coding-logic.png';
  const qCount = quiz.questions?.length || 0;
  const description =
    quiz.description && quiz.description.length > 110
      ? `${quiz.description.slice(0, 110)}…`
      : quiz.description;

  return (
    <>
      <style href="qz-quiz-card-v1" precedence="high">
        {QUIZ_CARD_CSS}
      </style>

      <div className="qz-quiz" style={{ '--accent': accent }}>
        <div className="qz-quiz-art">
          <span className="qz-quiz-art-badge"><BookOpen size={16} /></span>
          <Image src={artwork} alt="" fill sizes="(max-width: 560px) 100vw, 112px" />
        </div>

        <div className="qz-quiz-body">
          <div className="qz-quiz-top">
            <h3 className="qz-quiz-title">{quiz.title || 'Untitled Quiz'}</h3>
            <span className={`qz-quiz-status ${isLive ? 'qz-quiz-status--live' : ''}`}>
              <span className="qz-quiz-dot" />
              {statusLabel}
            </span>
          </div>

          <p className="qz-quiz-sub">
            {subject} · Semester {quiz.semester ?? '—'}
            {quiz.createdBy?.name ? ` · ${quiz.createdBy.name}` : ''}
          </p>

          {description && <p className="qz-quiz-desc">{description}</p>}

          <div className="qz-quiz-foot">
            <div className="qz-quiz-meta">
              {quiz.timeLimit != null && (
                <span className="qz-quiz-pill"><Clock size={13} />{quiz.timeLimit} min</span>
              )}
              {quiz.maxMarks != null && (
                <span className="qz-quiz-pill"><Award size={13} />{quiz.maxMarks} marks</span>
              )}
              {qCount > 0 && (
                <span className="qz-quiz-pill"><FileQuestion size={13} />{qCount} questions</span>
              )}
            </div>

            <button
              type="button"
              className="qz-quiz-cta"
              disabled={!isLive}
              onClick={() => router.push(`/quizmode/${quiz._id}`)}
            >
              {isLive ? <Play size={15} /> : <Lock size={15} />}
              {isLive ? 'Start Quiz' : 'Not Available'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizCard;
