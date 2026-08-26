import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Routes, Route } from 'react-router-dom';
import { User } from 'lucide-react';
import { ensureStudentCounselorLink } from '@/lib/ensureStudentCounselorLink';
import { StudentSidebar } from './StudentSidebar';
import { StudentContent } from './StudentContent';
import { StudentProfileForm } from './StudentProfileForm';
import { UniversityShortlists } from './UniversityShortlists';
import { StudentUniversities } from './StudentUniversities';
import { StudentDocuments } from './StudentDocuments';
import { StudentApplications } from './StudentApplications';
import { StudentPrivateChat } from './StudentPrivateChat';
import { StudentNotifications } from './StudentNotifications';

export function StudentLayout() {
  const { user, loading, roleLoading, isStudent } = useAuth();
  const isLoading = loading || roleLoading;

  useEffect(() => {
    if (user) void ensureStudentCounselorLink(user);
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isStudent) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-gradient-background">
      <StudentSidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route index element={<StudentContent />} />
          <Route path="profile" element={
            <div className="p-4 md:p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  My Profile
                </h1>
                <p className="text-muted-foreground mt-2">
                  Fill personal details, academics, and the countries you want to study in — then click Save Profile.
                </p>
              </div>
              <StudentProfileForm />
            </div>
          } />
          <Route path="universities" element={
            <div className="p-4 md:p-6">
              <StudentUniversities />
            </div>
          } />
          <Route path="shortlists" element={
            <div className="p-4 md:p-6">
              <UniversityShortlists />
            </div>
          } />
          <Route path="documents" element={
            <div className="p-4 md:p-6">
              <StudentDocuments />
            </div>
          } />
          <Route path="applications" element={
            <div className="p-4 md:p-6">
              <StudentApplications />
            </div>
          } />
          <Route path="chat" element={
            <div className="p-4 md:p-6">
              <StudentPrivateChat />
            </div>
          } />
          <Route path="notifications" element={
            <div className="p-4 md:p-6">
              <StudentNotifications />
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}