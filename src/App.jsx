import { ChallengeProvider } from './context/ChallengeContext.jsx';
import ChallengeScreen from './aluno/ChallengeScreen.jsx';

export default function App() {
  return (
    <ChallengeProvider>
      <ChallengeScreen />
    </ChallengeProvider>
  );
}
