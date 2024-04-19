import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

import Footer from '@/components/Footer';
import Toast from '@/components/Toast';

export default function SignUp() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [toastCount, settoastCount] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, settoastType] = useState<
    'success' | 'error' | 'information' | 'warning' | 'loading'
  >('error');

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'information' | 'warning' | 'loading'
  ) => {
    setToastMessage(message);
    settoastCount((prevCount) => prevCount + 1);
    settoastType(type);
  };

  function getCookie(cookieName: any) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(`${cookieName}=`)) {
        return cookie.substring(cookieName.length + 1);
      }
    }
    return null;
  }

  useEffect(() => {
    const token = getCookie('token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const { data } = await axios.get('/api/auth/token', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.data) {
        router.push('/painel');
      } else {
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    } catch (error) {
      console.error(error);
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  };

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target;
    const formattedValue = value
      .replace(/[^A-Za-z0-9!@#$%^&*()\\\-=_+\[\]{};':",.<>\/?]/g, '')
      .slice(0, 20);
    setUsername(formattedValue);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target;
    const formattedValue = value
      .replace(/[^A-Za-z0-9!@#$%^&*()\\\-=_+\[\]{};':",.<>\/?]/g, '')
      .slice(0, 32);
    setPassword(formattedValue);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const target = event.target as typeof event.target & {
      username: { value: string };
      password: { value: string };
    };

    const username = target.username.value;
    const password = target.password.value;

    try {
      const { data } = await axios.post(
        '/api/auth/signup',
        { username, password },
        {
          headers: {
            'Content-Type': 'application/json'
          },
        }
      );

      if (data.message === 'Registro realizado com sucesso.') {
        router.push('/ativar');
      }
    } catch (error: any) {
      console.error(error);
      if (error && error.response && error.response.data) {
        addToast(error.response.data.message, 'error');
      } else {
        addToast('Erro ao processar o resgistro.', 'error');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="rounded px-8 py-8 md:w-2/3 w-full max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Duality</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 text-center">
            <label className="block text-lg font-semibold mb-2">Usuário</label>
            <input
              type="text"
              name="username"
              className="placeholder:text-text-secundary text-center px-2 py-1 w-9/12 bg-tertiary rounded outline-none"
              onChange={handleUsernameChange}
              value={username}
              spellCheck="false"
            />
          </div>
          <div className="mb-4 text-center">
            <label className="block text-lg font-semibold mb-2">Senha</label>
            <input
              type="password"
              name="password"
              className="text-center px-2 py-1 w-9/12 bg-tertiary rounded outline-none"
              onChange={handlePasswordChange}
              value={password}
              spellCheck="false"
            />
          </div>
          <div className="text-center mb-4">
            <p className="text-text-secundary">
              Já tem uma conta?{' '}
              <span className="text-blue-500 cursor-pointer" onClick={() => router.push('/')}>
                Entre aqui.
              </span>
            </p>
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 transition-all duration-300 font-medium py-2 px-4 rounded outline-none"
            >
              Registrar
            </button>
          </div>
        </form>
        {toastCount > 0 && <Toast type={toastType} message={toastMessage} index={toastCount} />}
      </div>
      <Footer />
    </div>
  );
}
