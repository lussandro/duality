import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { FaCopy, FaSave } from 'react-icons/fa';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/router';
import { format } from 'date-fns';

import { useAdminSession } from '@/hooks/useAdminSession';
import LoadingAnimation from '@/components/LoadingAnimation';
import Toast from '@/components/Toast';

const actions = [
  {
    name: 'Bloquear Usuário',
    url: 'bloquear',
    api: '/api/auth/blacklist',
    placeholder: 'Digite o nome de usuário',
  },
  {
    name: 'Consultar Usuário',
    url: 'consultar',
    api: '/api/auth/lookup',
    placeholder: 'Digite o nome de usuário',
  },
  {
    name: 'Desbloquear Usuário',
    url: 'desbloquear',
    api: '/api/auth/unblacklist',
    placeholder: 'Digite o nome de usuário',
  },
  {
    name: 'Gerar Chave',
    url: 'gerar',
    api: '/api/auth/generate',
    subvalues: [{ value: '1d' }, { value: '7d' }, { value: '15d' }, { value: '30d' }],
  },
];

export default function AdminActions() {
  const router = useRouter();
  const { action } = router.query;
  const adminData = useAdminSession();
  const [username, setUsername] = useState('');
  const [response, setResponse] = useState('');
  const [toastCount, settoastCount] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, settoastType] = useState<
    'success' | 'error' | 'information' | 'warning' | 'loading'
  >('error');
  const [subvalue, setSubvalue] = useState('');

  const selectedAction = actions.find((item) => item.url === action);
  const renderInputs = selectedAction?.url;

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'information' | 'warning' | 'loading'
  ) => {
    setToastMessage(message);
    settoastCount((prevCount) => prevCount + 1);
    settoastType(type);
  };

  useEffect(() => {
    if (selectedAction?.url === 'gerar') {
      setSubvalue('1d');
    }
  }, [selectedAction]);

  if (action && !actions.find((item) => item.url === action)) {
    router.push('/404');
  }

  if (!adminData) return <LoadingAnimation />;

  type RequestBody = {
    username?: string;
    duration?: string;
    amount?: number;
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedAction) {
      try {
        addToast('Executando...', 'loading');

        const requestBody: RequestBody = {};

        if (selectedAction.url !== 'gerar') {
          requestBody.username = username;
        }

        if (selectedAction.url === 'gerar') {
          requestBody.amount = 1;
          requestBody.duration = subvalue;
        }

        const response = await axios.post(selectedAction.api, requestBody, {
          withCredentials: true,
        });

        try {
          const { data } = response;
          if (data.accessKeys) {
            setResponse(data.accessKeys.join('\n').trim());
            addToast('Chave de acesso gerada com sucesso.', 'success');
          } else if (data.message) {
            addToast(data.message.trim(), 'success');
          } else if (data.data) {
            let roleText = '';
            if (data.data.role === 'user') {
              roleText = 'Usuário';
            } else if (data.data.role === 'admin') {
              roleText = 'Administrador';
            }

            const expirationDate = format(
              new Date(data.data.expirationDate),
              'dd/MM/yyyy HH:mm:ss'
            );
            const blacklistedText = data.data.blacklisted ? 'Sim' : 'Não';

            let formattedResult = '';

            if (data.data.id) {
              formattedResult += `ID: ${data.data.id}\n`;
            }
            if (data.data.username) {
              formattedResult += `Usuário: ${data.data.username}\n`;
            }
            if (roleText) {
              formattedResult += `Cargo: ${roleText}\n`;
            }
            if (expirationDate) {
              formattedResult += `Data de expiração: ${expirationDate}\n`;
            }
            if (data.data.queries) {
              formattedResult += `Consultas: ${data.data.queries}\n`;
            }
            if (data.data.blacklisted !== undefined) {
              formattedResult += `Lista negra: ${blacklistedText}\n`;
            }

            setResponse(formattedResult.trim());
            addToast('Consulta realizada com sucesso.', 'success')
          }
        } catch (error: unknown) {
          console.error(error);
          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ message: string }>;
            if (axiosError.response?.data?.message) {
              addToast(axiosError.response.data.message, 'error');
            } else {
              addToast('Erro ao processar a resposta do servidor.', 'error');
            }
          } else {
            addToast('Erro ao processar a resposta do servidor.', 'error');
          }
        }
      } catch (error: unknown) {
        console.error(error);
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<{ message: string }>;
          if (axiosError.response?.data?.message) {
            addToast(axiosError.response.data.message, 'error');
          } else {
            addToast('Erro ao enviar a requisição.', 'error');
          }
        } else {
          addToast('Erro ao enviar a requisição.', 'error');
        }
      }
    }
  };

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target;
    const formattedValue = value
      .replace(/[^A-Za-z0-9!@#$%^&*()\\\-=_+\[\]{};':",.<>\/?]/g, '')
      .slice(0, 20);
    setUsername(formattedValue);
  };

  const handleDurationChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const { value } = event.target;
    setSubvalue(value);
  };

  if (!action || !actions.find((item) => item.url === action)) {
    return null;
  }

  const handleCopyResult = () => {
    const accessKeyPrefix = action === 'gerar' ? 'https://findy.pro/ativar?chave=' : '';
    const modifiedResponse = response
      .split('\n')
      .map((line) => accessKeyPrefix + line)
      .join('\n');
    navigator.clipboard.writeText(modifiedResponse);
  };

  const handleReturn = () => {
    router.push('/admin/painel');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-6">{selectedAction?.name}</h1>
      <form onSubmit={handleFormSubmit} className="text-center mb-4">
        {renderInputs && selectedAction.placeholder && (
          <label className="flex flex-col mb-4">
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              className="placeholder:text-text-secundary text-center px-2 py-1 w-72 md:w-96 bg-tertiary rounded outline-none"
              placeholder={selectedAction?.placeholder || ''}
            />
          </label>
        )}
        {selectedAction?.subvalues && (
          <label className="flex flex-col mb-4">
            <select
              value={subvalue}
              onChange={handleDurationChange}
              className="px-2 py-1 w-72 md:w-96 text-center bg-tertiary rounded outline-none"
            >
              {selectedAction.subvalues.map((subvalue) => (
                <option key={subvalue.value} value={subvalue.value}>
                  {subvalue.value}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex justify-center space-x-6">
          <button
            type="button"
            className="bg-red-500 hover:bg-red-600 transition-all duration-300 cursor-pointer font-medium py-2 px-4 rounded"
            onClick={handleReturn}
          >
            Voltar
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 transition-all duration-300 font-medium py-2 px-4 rounded"
          >
            Executar
          </button>
        </div>
      </form>
      {response && (
        <div className="text-center mx-4 bg-tertiary mb-4 p-4 rounded max-w-screen-md relative">
          <h2 className="text-lg font-bold mb-2">Resposta:</h2>
          <button
            type="button"
            className="text-text-secundary hover:text-text-primary transition-all duration-300 font-medium py-1 px-2 rounded m-1"
            onClick={handleCopyResult}
          >
            <FaCopy />
          </button>
          <pre className="whitespace-pre-wrap break-words">{response}</pre>
        </div>
      )}
      {toastCount > 0 && <Toast type={toastType} message={toastMessage} index={toastCount} />}
    </div>
  );
}
