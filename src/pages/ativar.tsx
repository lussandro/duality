import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

import Toast from '@/components/Toast';
import Footer from '@/components/Footer';

export default function Activation() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [accessKey, setAccessKey] = useState('');
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get('chave');

    if (keyParam) {
      setAccessKey(keyParam);
    }
  }, []);

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target;
    const formattedValue = value
      .replace(/[^A-Za-z0-9!@#$%^&*()\\\-=_+\[\]{};':",.<>\/?]/g, '')
      .slice(0, 20);
    setUsername(formattedValue);
  };

  const handleAccessKeyChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target;
    const formattedValue = value
      .replace(/[^A-Za-z0-9!@#$%^&*()\\\-=_+\[\]{};':",.<>\/?]/g, '')
      .slice(0, 36);
    setAccessKey(formattedValue);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const target = event.target as typeof event.target & {
      username: { value: string };
      accessKey: { value: string };
    };

    const username = target.username.value;
    const accessKey = target.accessKey.value;

    if (!username) {
      addToast('Insira seu usuário para ativar a chave.', 'warning');
      return;
    }

    if (!accessKey) {
      addToast('Insira sua chave para ativá-la.', 'warning');
      return;
    }

    try {
      const { data } = await axios.post(
        '/api/auth/activate',
        { username, accessKey },
        {
          headers: {
            'Content-Type': 'application/json'
          },
        }
      );

      if (data.message) {
        addToast(data.message, 'success');
      }
    } catch (error: any) {
      console.error(error);
      if (error && error.response && error.response.data) {
        addToast(error.response.data.message, 'error');
      } else {
        addToast('Erro ao ativar a chave.', 'error');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="rounded px-8 py-8 md:w-2/3 w-full max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Ative sua conta:</h1>
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
            <label className="block text-lg font-semibold mb-2">Chave de acesso</label>
            <input
              type="text"
              name="accessKey"
              className="text-center px-2 py-1 w-9/12 bg-tertiary rounded outline-none"
              onChange={handleAccessKeyChange}
              value={accessKey}
              spellCheck="false"
            />
          </div>
          <div className="text-center mb-4">
            <p className="text-text-secundary mb-1">
              Ainda não tem uma chave?{' '}
              <span
                className="text-blue-500 cursor-pointer"
                onClick={() => router.push('/discord')}
              >
                Compre uma aqui.
              </span>
            </p>
            <p className="text-text-secundary">
              Antes de ativar sua chave, verifique se o usuário está correto.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 transition-all duration-300 font-medium py-2 px-4 rounded outline-none"
            >
              Ativar
            </button>
          </div>
        </form>
        {toastCount > 0 && <Toast type={toastType} message={toastMessage} index={toastCount} />}
      </div>
      <Footer />
    </div>
  );
}
