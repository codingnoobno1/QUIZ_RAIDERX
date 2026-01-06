// /app/[user]/layout.jsx
import ResponsiveLayout from '@/layouts/ResponsiveLayout';

export default function Layout({ children }) {
  return <ResponsiveLayout>{children}</ResponsiveLayout>;
}
