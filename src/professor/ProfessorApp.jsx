import { Routes, Route } from 'react-router-dom';
import { ProfessorAuthProvider } from './ProfessorAuthProvider.jsx';
import ProfessorLogin from './ProfessorLogin.jsx';
import RequireProfessorAuth from './RequireProfessorAuth.jsx';
import ProfessorChallengesPage from './ProfessorChallengesPage.jsx';
import ProfessorDashboardPage from './ProfessorDashboardPage.jsx';
import ProfessorConfigPage from './ProfessorConfigPage.jsx';

export default function ProfessorApp() {
  return (
    <ProfessorAuthProvider>
      <Routes>
        <Route path="/" element={<ProfessorLogin />} />
        <Route
          path="desafios"
          element={
            <RequireProfessorAuth>
              <ProfessorChallengesPage />
            </RequireProfessorAuth>
          }
        />
        <Route
          path="dashboard"
          element={
            <RequireProfessorAuth>
              <ProfessorDashboardPage />
            </RequireProfessorAuth>
          }
        />
        <Route
          path="config"
          element={
            <RequireProfessorAuth>
              <ProfessorConfigPage />
            </RequireProfessorAuth>
          }
        />
      </Routes>
    </ProfessorAuthProvider>
  );
}
