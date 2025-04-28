'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Quiz as QuizIcon,
  AccountCircle as ProfileIcon,
  Code as CodeIcon,
  Description as ProjectIcon,
  Terminal as SolutionIcon,
} from '@mui/icons-material';

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/coding-club/dashboard' },
  { text: 'Quiz', icon: <QuizIcon />, path: '/coding-club/quiz' },
  { text: 'Your Profile', icon: <ProfileIcon />, path: '/coding-club/profile' },
  { text: 'Code Snippets', icon: <CodeIcon />, path: '/coding-club/code' },
  { text: 'Your Projects', icon: <ProjectIcon />, path: '/coding-club/projects' },
  { text: 'Coding Solutions', icon: <SolutionIcon />, path: '/coding-club/solutions' },
];

export default function Sidebar({ isExpanded }) {
  const pathname = usePathname();

  return (
    <div className="h-full bg-gray-900 text-white px-2 pt-6">
      <List>
        {navItems.map(({ text, icon, path }) => (
          <Link key={text} href={path} passHref>
            <ListItem sx={{ gap: 1 }} component="a">
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>{icon}</ListItemIcon>
              {isExpanded && (
                <ListItemText
                  primary={text}
                  primaryTypographyProps={{ fontWeight: 600, sx: { whiteSpace: 'nowrap' } }}
                />
              )}
            </ListItem>
          </Link>
        ))}
      </List>
    </div>
  );
}
