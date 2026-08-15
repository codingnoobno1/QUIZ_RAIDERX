'use client';

import * as Tooltip from '@radix-ui/react-tooltip';

export default function StatCard({ icon: Icon, label, value, color = '#a855f7', hint, loading }) {
    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <div className="dsh-stat" style={{ '--accent': color }} tabIndex={0}>
                    <div className="dsh-stat-icon" style={{ color, background: `${color}1f`, borderColor: `${color}33` }}>
                        <Icon size={18} />
                    </div>
                    <div className="dsh-stat-meta">
                        <div className="dsh-stat-value">
                            {loading ? <span className="dsh-skel" style={{ width: 38 }} /> : value}
                        </div>
                        <div className="dsh-stat-label">{label}</div>
                    </div>
                </div>
            </Tooltip.Trigger>
            {hint && (
                <Tooltip.Portal>
                    <Tooltip.Content className="dsh-tooltip" side="top" sideOffset={6}>
                        {hint}
                        <Tooltip.Arrow className="dsh-tooltip-arrow" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            )}
        </Tooltip.Root>
    );
}
