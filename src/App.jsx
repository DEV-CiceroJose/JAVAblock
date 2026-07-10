import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChallengeProvider } from './context/ChallengeContext.jsx';
import ChallengeScreen from './aluno/ChallengeScreen.jsx';
import ProfessorApp from './professor/ProfessorApp.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ChallengeProvider>
              <ChallengeScreen />
            </ChallengeProvider>
          }
        />
        <Route path="/professor/*" element={<ProfessorApp />} />
      </Routes>
    </BrowserRouter>
  );
}
