import { Routes, Route } from 'react-router-dom';
import { ProfessorAuthProvider } from './ProfessorAuthProvider.jsx';
import ProfessorLogin from './ProfessorLogin.jsx';

export default function ProfessorApp() {
  return (
    <ProfessorAuthProvider>
      <Routes>
        <Route path="/" element={<ProfessorLogin />} />
      </Routes>
    </ProfessorAuthProvider>
  );
}
