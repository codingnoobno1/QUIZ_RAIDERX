'use client'; // REQUIRED at the top

import { useSearchParams } from 'next/navigation';
import PageTitle from '@components/ui/PageTitle';

export default function DashboardPage() {
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
        return <PageTitle text="Welcome to your Dashboard" />;
    }
  };

  return (
    <>
      {renderContent()}
    </>
  );
}
