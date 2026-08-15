'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function QuickActionTile({ icon: Icon, label, desc, href, color = '#a855f7' }) {
    return (
        <Link href={href} className="dsh-tile" style={{ '--accent': color }}>
            <div className="dsh-tile-icon" style={{ color, background: `${color}1a`, borderColor: `${color}33` }}>
                <Icon size={18} />
            </div>
            <div className="dsh-tile-body">
                <span className="dsh-tile-label">{label}</span>
                <span className="dsh-tile-desc">{desc}</span>
            </div>
            <ChevronRight size={15} className="dsh-tile-chev" />
        </Link>
    );
}
