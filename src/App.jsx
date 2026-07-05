import { useState } from 'react';
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import Badge from './components/ui/Badge';
import Modal from './components/ui/Modal';

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-base-bg text-slate-100 p-8">
      <h1 className="text-4xl font-bold mb-8">JavaBlocks - UI Primitives Demo</h1>

      {/* Button variants */}
      <Card className="mb-8 p-6">
        <h2 className="text-xl font-bold mb-4">Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <Button variant="primary">Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="success">Success</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </Card>

      {/* Badge variants */}
      <Card className="mb-8 p-6">
        <h2 className="text-xl font-bold mb-4">Badges</h2>
        <div className="flex gap-4 flex-wrap">
          <Badge color="#4f8cff">Blue</Badge>
          <Badge color="#10b981">Green</Badge>
          <Badge color="#f59e0b">Amber</Badge>
          <Badge color="#ef4444">Red</Badge>
        </div>
      </Card>

      {/* Modal demo */}
      <Card className="mb-8 p-6">
        <h2 className="text-xl font-bold mb-4">Modal</h2>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          Open Modal
        </Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Welcome!">
          <p className="text-slate-300 mb-4">
            This is a modal example with animations powered by framer-motion.
          </p>
          <Button variant="success" onClick={() => setModalOpen(false)}>
            Close
          </Button>
        </Modal>
      </Card>
    </div>
  );
}
