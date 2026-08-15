'use client';

import { useState } from 'react';
import * as Label from '@radix-ui/react-label';
import * as Tooltip from '@radix-ui/react-tooltip';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Mail, Lock, BadgeCheck, GraduationCap, CalendarRange } from 'lucide-react';

const FIELDS = [
  { name: 'name', label: 'Full Name', type: 'text', icon: User, placeholder: 'Jane Doe', full: true },
  { name: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'you@example.com', full: true },
  { name: 'enrollmentNumber', label: 'Enrollment No.', type: 'text', icon: BadgeCheck, placeholder: 'A2305...' },
  { name: 'course', label: 'Course', type: 'text', icon: GraduationCap, placeholder: 'B.Tech' },
  { name: 'semester', label: 'Semester', type: 'text', icon: CalendarRange, placeholder: '4', full: true },
];

export default function EventRegister({ onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    name: '', enrollmentNumber: '', course: '', semester: '', email: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, enrollmentNumber, course, semester, email, password, confirmPassword } = formData;

    if ([name, enrollmentNumber, course, semester, email, password, confirmPassword].some((f) => f.trim() === '')) {
      return toast.error('All fields are required');
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return toast.error('Please enter a valid email address');
    }
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      toast.success('Registered! Switching to login...');
      setTimeout(() => onRegisterSuccess?.(), 1400);
    } catch (err) {
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderField = ({ name, label, type, icon: Icon, placeholder }) => (
    <div className="evt-field" key={name}>
      <Label.Root htmlFor={`evt-reg-${name}`} className="evt-label">{label}</Label.Root>
      <div className="evt-input-wrap">
        <span className="evt-input-icon"><Icon size={16} /></span>
        <input
          id={`evt-reg-${name}`}
          name={name}
          type={type}
          className="evt-input"
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleChange}
          required
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="evt-form-title">Event Registration</h2>

      {FIELDS.filter((f) => f.full).slice(0, 2).map(renderField)}

      <div className="evt-row">
        {FIELDS.filter((f) => !f.full).map(renderField)}
      </div>

      {FIELDS.filter((f) => f.full).slice(2).map(renderField)}

      <div className="evt-row">
        <div className="evt-field">
          <Label.Root htmlFor="evt-reg-password" className="evt-label">Password</Label.Root>
          <div className="evt-input-wrap">
            <span className="evt-input-icon"><Lock size={16} /></span>
            <input
              id="evt-reg-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="evt-input evt-input--pad-right"
              placeholder="••••••"
              value={formData.password}
              onChange={handleChange}
              required
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
                <Tooltip.Content side="left" sideOffset={6}
                  style={{ background: '#2a2440', color: '#e9d5ff', fontSize: 12, padding: '5px 9px', borderRadius: 6, zIndex: 9999 }}>
                  {showPassword ? 'Hide' : 'Show'}
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
        </div>

        <div className="evt-field">
          <Label.Root htmlFor="evt-reg-confirm" className="evt-label">Confirm</Label.Root>
          <div className="evt-input-wrap">
            <span className="evt-input-icon"><Lock size={16} /></span>
            <input
              id="evt-reg-confirm"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              className="evt-input"
              placeholder="••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      <button type="submit" className="evt-btn" disabled={loading}>
        {loading ? <span className="evt-spin" /> : 'Create Account →'}
      </button>
    </form>
  );
}
