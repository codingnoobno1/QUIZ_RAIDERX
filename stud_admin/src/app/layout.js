import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Student Admin Dashboard',
  description: 'Admin panel for research and event notes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000' }}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
