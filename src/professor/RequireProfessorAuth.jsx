import { Navigate } from 'react-router-dom';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';

export default function RequireProfessorAuth({ children }) {
  const { isAuthenticated } = useProfessorAuth();
  if (!isAuthenticated) {
    return <Navigate to="/professor" replace />;
  }
  return children;
}
