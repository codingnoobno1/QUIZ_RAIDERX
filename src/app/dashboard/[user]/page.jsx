'use client'; // REQUIRED at the top

import { useSearchParams } from 'next/navigation';
import PageTitle from '@components/ui/PageTitle';

import MainLayout from '@components/layouts/MainLayout';
import MainContent from '@/components/MainContent';
import Sidebar from '@/components/Sidebar';

import QuizSection from '@/components/quiz/QuizSection';
import CodeEditorSection from '@/components/code/CodeEditorSection';
import ProfileSection from '@/components/profile/ProfileSection';
import ProjectsSection from '@/components/projects/ProjectsSection';
import SolutionsSection from '@/components/solutions/SolutionsSection';

export default function CodingClubPage() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section');

  const renderContent = () => {
    switch (section) {
      case 'quiz':
        return <QuizSection />;
      case 'code':
        return <CodeEditorSection />;
      case 'profile':
        return <ProfileSection />;
      case 'projects':
        return <ProjectsSection />;
      case 'solutions':
        return <SolutionsSection />;
      default:
        return <PageTitle text="Welcome to the Coding Club" />;
    }
  };

  return (
    <MainLayout>
      <Sidebar />
      <MainContent>
        {renderContent()}
      </MainContent>
    </MainLayout>
  );
}
