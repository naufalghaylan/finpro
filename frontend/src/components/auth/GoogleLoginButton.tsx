import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface GoogleLoginButtonProps {
  label?: string; // GoogleLogin doesn't easily accept custom labels without configuring shape/theme, we'll let it use defaults
  onError?: (error: string) => void;
}

export default function GoogleLoginButton({ onError }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { socialLogin } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      {isLoading ? (
        <div style={{ 
          width: '100%', 
          padding: '12px', 
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          color: 'var(--ink)'
        }}>
          Memproses...
        </div>
      ) : (
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            if (!credentialResponse.credential) {
              if (onError) onError('Token tidak ditemukan');
              return;
            }
            try {
              setIsLoading(true);
              const result = await socialLogin({ 
                token: credentialResponse.credential, 
                provider: 'GOOGLE' 
              });
              if (result?.isNewUser) {
                navigate('/onboarding');
              } else {
                const user = useAuthStore.getState().user;
                if (user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_ADMIN') {
                  navigate('/admin/stores');
                } else {
                  navigate('/');
                }
              }
            } catch (err: unknown) {
              const error = err as { response?: { data?: { message?: string } } };
              console.error('Google login error:', error)
              if (onError) onError(error.response?.data?.message || 'Login dengan Google gagal.');
            }
          }}
          onError={() => {
            if (onError) onError('Login Google gagal');
          }}
          useOneTap
          theme="outline"
          size="large"
          text="continue_with"
        />
      )}
    </div>
  );
}
