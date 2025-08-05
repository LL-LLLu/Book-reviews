import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import PasswordSetupModal from './PasswordSetupModal';

interface PasswordSetupWrapperProps {
  children: React.ReactNode;
}

export default function PasswordSetupWrapper({ children }: PasswordSetupWrapperProps) {
  const { requirePasswordSetup, setPasswordSetupComplete, checkAuth } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (requirePasswordSetup) {
      setShowModal(true);
    }
  }, [requirePasswordSetup]);

  const handlePasswordSetupSuccess = async () => {
    setPasswordSetupComplete();
    setShowModal(false);
    // Refresh auth to get updated user data
    await checkAuth(true);
  };

  return (
    <>
      {children}
      <PasswordSetupModal
        isOpen={showModal}
        onClose={() => {}} // Don't allow closing without setting up password
        onSuccess={handlePasswordSetupSuccess}
      />
    </>
  );
}