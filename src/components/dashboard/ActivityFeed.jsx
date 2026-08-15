'use client';

import * as ScrollArea from '@radix-ui/react-scroll-area';
import { Activity, CalendarCheck, FileQuestion, FolderGit2, FlaskConical, Inbox } from 'lucide-react';

const ICONS = {
    event: CalendarCheck,
    quiz: FileQuestion,
    project: FolderGit2,
    research: FlaskConical,
};

export default function ActivityFeed({ items = [], loading }) {
    return (
        <div className="dsh-card dsh-activity">
            <div className="dsh-card-head">
                <Activity size={15} />
                <span>Recent Activity</span>
            </div>

            <ScrollArea.Root className="dsh-scroll">
                <ScrollArea.Viewport className="dsh-scroll-vp">
                    {loading ? (
                        <div className="dsh-act-list">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="dsh-act-item">
                                    <span className="dsh-skel" style={{ width: 30, height: 30, borderRadius: 8 }} />
                                    <span className="dsh-skel" style={{ width: '70%', height: 12 }} />
                                </div>
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="dsh-empty">
                            <Inbox size={30} />
                            <p>No recent activity yet.</p>
                            <span>Register for an event or take a quiz to get started.</span>
                        </div>
                    ) : (
                        <div className="dsh-act-list">
                            {items.map((it, i) => {
                                const Icon = ICONS[it.type] || Activity;
                                return (
                                    <div key={i} className="dsh-act-item">
                                        <span className="dsh-act-icon" style={{ color: it.color }}>
                                            <Icon size={16} />
                                        </span>
                                        <div className="dsh-act-text">
                                            <span className="dsh-act-title">{it.title}</span>
                                            {it.meta && <span className="dsh-act-meta">{it.meta}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar orientation="vertical" className="dsh-scrollbar">
                    <ScrollArea.Thumb className="dsh-thumb" />
                </ScrollArea.Scrollbar>
            </ScrollArea.Root>
        </div>
    );
}
