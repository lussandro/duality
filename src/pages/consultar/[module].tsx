import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { FaCopy, FaSave } from 'react-icons/fa';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/router';
import { saveAs } from 'file-saver';

import LoadingAnimation from '@/components/LoadingAnimation';
import { useSession } from '@/hooks/useSession';
import Toast from '@/components/Toast';

const modules = [
  {
    name: 'CPF',
    url: 'cpf',
    api: '/api/consultar',
    placeholder: 'Digite o CPF',
    submodules: [
      { name: 'SERASA', api: '/cpf' }
      // { name: 'CADSUS', api: '/cpf' }
    ],
    charactersToRemove: ['.', '-', ' '],
  },
  {
    name: 'Email',
    url: 'email',
    api: '/api/consultar',
    placeholder: 'Digite o email',
    submodules: [
      { name: 'Serasa', api: '/mail' },
    ],
    charactersToRemove: [' '],
  },
  {
    name: 'Placas 2.0',
    url: 'placa2',
    api: '/api/consultar',
    placeholder: 'Digite a placa',
    submodules: [
      { name: 'DETRAN', api: '/placa2' },
    ],
    charactersToRemove: [' '],
  },
  {
    name: 'Placa',
    url: 'placa',
    api: '/api/consultar',
    placeholder: 'Digite a placa',
    submodules: [
      { name: 'DETRAN', api: '/placa' },
    ],
    charactersToRemove: [' '],
  },
  {
    name: 'IP',
    url: 'ip',
    api: '/api/consultar',
    placeholder: 'Digite o IP',
    submodules: [
      { name: 'Pública', api: '/Ip' },
    ],
    charactersToRemove: [' '],
  },
  {
    name: 'Nome',
    url: 'nome',
    api: '/api/consultar',
    placeholder: 'Digite o nome',
    submodules: [
      { name: 'SERASA', api: '/nomeserasa' },
      { name: 'DataPrime', api: '/nameprime'}
    ],
  },
  {
    name: 'Telefone',
    url: 'telefone',
    api: '/api/consultar',
    placeholder: 'Digite o telefone',
    submodules: [
      { name: 'Serasa', api: '/telefone' },
    ],
    charactersToRemove: ['+', '(', ')', '-', ' '],
  }, 
  {
    name: 'CEP',
    url: 'cep',
    api: '/api/consultar',
    placeholder: 'Digite o CEP',
    submodules: [
      { name: 'OwnData', api: '/cep' },
    ],
    charactersToRemove: ['-', ' '],
  },
  {
    name: 'Mãe',
    url: 'mae',
    api: '/api/consultar',
    placeholder: 'Digite o nome da Mãe',
    submodules: [
      { name: 'OwnData', api: '/mother' }
    ],
  },
  {
    name: 'Título Eleitor',
    url: 'eleitor',
    api: '/api/consultar',
    placeholder: 'Digite o título',
    submodules: [
      { name: 'OwnData', api: '/title' }
    ],
    charactersToRemove: ['+', '(', ')', '-', ' '],
  }
];

export default function Query() {
  const router = useRouter();
  const { module } = router.query;
  const userData = useSession();
  const [input, setInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [response, setResponse] = useState('');
  const [toastCount, settoastCount] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, settoastType] = useState<
    'success' | 'error' | 'information' | 'warning' | 'loading'
  >('error');
  const [submodule, setsubmodule] = useState('');
  const [photoData, setPhotoData] = useState<string>('');

  const selectedModule = modules.find((item) => item.url === module);

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'information' | 'warning' | 'loading'
  ) => {
    setToastMessage(message);
    settoastCount((prevCount) => prevCount + 1);
    settoastType(type);
  };

  useEffect(() => {
    if (module && !modules.find((item) => item.url === module)) {
      router.push('/404');
    }

    if (selectedModule?.url === 'foto') {
      setPhotoData('');
    }
  }, [module, modules, router, selectedModule]);

  if (!userData) {
    return <LoadingAnimation />;
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setInput(event.target.value.toUpperCase());
  };

  const handleDateInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setDateInput(event.target.value);
  };

  const handleReturn = () => {
    router.push('/painel');
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input) {
      addToast('Preencha os campos necessários antes de fazer sua consulta.', 'warning');
      return;
    }

    setResponse('');

    if (selectedModule) {
      try {
        addToast('Consultando...', 'loading');
        setPhotoData('');

        let queryUrl = selectedModule.api;
        let cleanedInput = input;

        if (submodule) {
          queryUrl += submodule;
        } else if (firstSubmodule?.api) {
          queryUrl += firstSubmodule?.api;
        }

        if (selectedModule.charactersToRemove) {
          cleanedInput = selectedModule.charactersToRemove.reduce(
            (cleaned, character) => cleaned.split(character).join(''),
            input
          );
        }

        queryUrl += `/${cleanedInput || input}`;

        let response;

        response = await axios.post(
          queryUrl,
          {},
          {
            headers: {
              'Content-Type': 'application/json'
            },
          }
        );

        const { data } = response;
        if (data.response) {
          setResponse(data.response.toUpperCase().trim());
          addToast('Consulta realizada com sucesso.', 'success');
        } else {
          console.log(queryUrl)
          addToast('Resposta inválida do servidor.', 'error');
        }
      } catch (error: any) { 
        console.log (error)
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<any>;
          if (axiosError.response?.data?.message) {
            addToast(axiosError.response?.data?.message, 'error');
          } else {
            addToast('Resposta inválida do servidor', 'error');
          }
        } else {
          if (error && error.message) {
            addToast(error.message, 'error');
          } else {
            addToast('Erro ao obter a resposta do servidor.', 'error');
          }
        }
      }
    }
  };

  const handleCopyResult = () => {
    if (selectedModule?.url === 'foto' && photoData) {
      const dataURI = `data:image/jpeg;base64,${photoData}`;
      const img = new Image();
      img.src = dataURI;

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const clipboardItem = new ClipboardItem({ 'image/png': blob });

            navigator.clipboard.write([clipboardItem]);
          }
        }, 'image/png');
      }
    } else {
      navigator.clipboard.writeText(`${response}\n\nhttps://findy.pro | INFORMAÇÃO PRIVADA`);
    }
  };

  const handleSaveResult = () => {
    if (selectedModule?.url === 'foto' && photoData) {
      const dataURI = `data:image/jpeg;base64,${photoData}`;
      const link = document.createElement('a');
      link.href = dataURI;
      link.download = `${input}.png`;
      link.click();
    } else {
      const blob = new Blob([`${response}\n\nhttps://findy.pro | INFORMAÇÃO PRIVADA`], {
        type: 'text/plain;charset=utf-8',
      });
      saveAs(blob, `${selectedModule?.name?.toUpperCase()} (${submodule}) - ${input}.txt`);
    }
  };

  if (!module || !modules.find((item) => item.url === module)) {
    return null;
  }

  let firstSubmodule: { name: string; api: string } | undefined;
  if (selectedModule && selectedModule.submodules && selectedModule.submodules.length > 0) {
    firstSubmodule = selectedModule.submodules[0];
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Consulta de {selectedModule?.name}</h1>
      <form onSubmit={handleFormSubmit} className="text-center mb-4" noValidate>
        {selectedModule?.submodules && (
          <label className="flex flex-col mb-4">
            <select
              value={submodule}
              onChange={(event) => setsubmodule(event.target.value)}
              className="text-center px-2 py-1 w-72 md:w-96 bg-tertiary rounded outline-none"
            >
              {selectedModule.submodules.map((submodule) => (
                <option key={submodule.name} value={submodule.api}>
                  {submodule.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {selectedModule?.placeholder && (
          <label className="flex flex-col mb-4">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              className="placeholder:text-text-secundary text-center px-2 py-1 w-72 md:w-96 bg-tertiary rounded outline-none"
              placeholder={selectedModule?.placeholder || ''}
              spellCheck="false"
            />
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
            Consultar
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
          <button
            type="submit"
            className="text-text-secundary hover:text-text-primary transition-all duration-300 font-medium py-1 px-2 rounded m-1"
            onClick={handleSaveResult}
          >
            <FaSave />
          </button>
          <pre className="whitespace-pre-wrap break-words">{response}</pre>
        </div>
      )}

      {photoData && (
        <div className="text-center mx-4 bg-tertiary mb-4 p-4 rounded max-w-screen relative">
          <h2 className="text-lg font-bold mb-2">Resposta:</h2>

          <button
            type="button"
            className="text-text-secundary hover:text-text-primary transition-all duration-300 font-medium py-1 px-2 rounded m-1"
            onClick={handleCopyResult}
          >
            <FaCopy />
          </button>
          <button
            type="button"
            className="text-text-secundary hover:text-text-primary transition-all duration-300 font-medium py-1 px-2 rounded m-1"
            onClick={handleSaveResult}
          >
            <FaSave />
          </button>
          <img
            src={`data:image/jpeg;base64,${photoData}`}
            alt="Imagem da consulta"
            className="max-w-full h-auto mx-auto mb-2"
          />
        </div>
      )}
      {toastCount > 0 && <Toast type={toastType} message={toastMessage} index={toastCount} />}
    </div>
  );
}
