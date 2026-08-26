import { useAuth } from '@/hooks/useAuth';
import { Navigate, Routes, Route } from 'react-router-dom';
import { CounselorSidebar } from './CounselorSidebar';
import { CounselorDashboard } from '@/counselor/dashboard/CounselorDashboard';
import { MyLeads } from '@/counselor/leads/MyLeads';
import { MyStudents } from '@/counselor/students/MyStudents';
import { UniversityShortlisting } from '@/counselor/shortlists/UniversityShortlisting';
import { CounselorStudentChat } from '@/counselor/chat/CounselorStudentChat';
import { CounselorProfileForm } from '@/counselor/profile/CounselorProfileForm';
import { LeaveManagement } from '@/counselor/hr/LeaveManagement';
import { AttendanceTracking } from '@/counselor/hr/AttendanceTracking';
import { SalaryRecords } from '@/counselor/hr/SalaryRecords';
import { StudentDocumentReview } from '@/counselor/documents/CounselorDocumentReview';
import { StudentNotifications } from '@/counselor/notifications/CounselorNotifications';

export function CounselorLayout() {
  const { user, loading, roleLoading, userRole, isAdmin } = useAuth();
  const isLoading = loading || roleLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading counselor portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== 'counselor' && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-gradient-background">
      <CounselorSidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route
            index
            element={
              <div className="p-4 md:p-6">
                <CounselorDashboard />
              </div>
            }
          />
          <Route
            path="leads"
            element={
              <div className="p-4 md:p-6">
                <MyLeads />
              </div>
            }
          />
          <Route
            path="students"
            element={
              <div className="p-4 md:p-6">
                <MyStudents />
              </div>
            }
          />
          <Route
            path="shortlists"
            element={
              <div className="p-4 md:p-6">
                <UniversityShortlisting />
              </div>
            }
          />
          <Route
            path="chat"
            element={
              <div className="p-4 md:p-6">
                <CounselorStudentChat />
              </div>
            }
          />
          <Route
            path="documents"
            element={
              <div className="p-4 md:p-6">
                <StudentDocumentReview />
              </div>
            }
          />
          <Route
            path="profile"
            element={
              <div className="p-4 md:p-6">
                <CounselorProfileForm />
              </div>
            }
          />
          <Route
            path="leave"
            element={
              <div className="p-4 md:p-6">
                <LeaveManagement />
              </div>
            }
          />
          <Route
            path="attendance"
            element={
              <div className="p-4 md:p-6">
                <AttendanceTracking />
              </div>
            }
          />
          <Route
            path="salary"
            element={
              <div className="p-4 md:p-6">
                <SalaryRecords />
              </div>
            }
          />
          <Route
            path="notifications"
            element={
              <div className="p-4 md:p-6">
                <StudentNotifications />
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
