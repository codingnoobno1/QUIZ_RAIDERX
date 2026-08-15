'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Label from '@radix-ui/react-label';
import * as Tooltip from '@radix-ui/react-tooltip';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import useEventUserStore from '@/store/useEventUserStore';

export default function EventLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useEventUserStore((s) => s.setUser);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setUser(data.user, data.loginTime);
      toast.success(`Welcome back, ${data.user?.name?.split(' ')[0] || 'attendee'}!`);
      router.replace('/event/dashboard');
    } catch (err) {
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="evt-form-title">Event Login</h2>

      <div className="evt-field">
        <Label.Root htmlFor="evt-login-email" className="evt-label">Email</Label.Root>
        <div className="evt-input-wrap">
          <span className="evt-input-icon"><Mail size={16} /></span>
          <input
            id="evt-login-email"
            type="email"
            className="evt-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="evt-field">
        <Label.Root htmlFor="evt-login-password" className="evt-label">Password</Label.Root>
        <div className="evt-input-wrap">
          <span className="evt-input-icon"><Lock size={16} /></span>
          <input
            id="evt-login-password"
            type={showPassword ? 'text' : 'password'}
            className="evt-input evt-input--pad-right"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                className="evt-eye"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="left" sideOffset={6} className="evt-tooltip"
                style={{ background: '#2a2440', color: '#e9d5ff', fontSize: 12, padding: '5px 9px', borderRadius: 6, zIndex: 9999 }}>
                {showPassword ? 'Hide password' : 'Show password'}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </div>

      <button type="submit" className="evt-btn" disabled={loading}>
        {loading ? <span className="evt-spin" /> : 'Sign In →'}
      </button>
    </form>
  );
}
