import {
  BsPersonFillAdd,
  BsPersonFillSlash,
  BsPersonFillDash,
  BsPersonFillGear,
} from 'react-icons/bs';
import { parseISO, format } from 'date-fns';

import LoadingAnimation from '@/components/LoadingAnimation';
import { useAdminSession } from '@/hooks/useAdminSession';
import Header from '@/components/Header';
import Widget from '@/components/Widget';

export default function AdminPanel() {
  const adminData = useAdminSession();
  if (!adminData) {
    return <LoadingAnimation />;
  }

  const { username, expirationDate } = adminData;
  const parsedExpirationDate = parseISO(expirationDate);
  const formattedExpirationDate = format(parsedExpirationDate, 'dd/MM/yyyy');
  return (
    <>
      <Header returnButton />
      <main className="flex min-h-screen flex-col items-center justify-between p-3 md:p-10">
        <div className="grid grid-cols-2 2sm:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-5">
          <Widget
            icon={BsPersonFillAdd}
            title="Gerar"
            description="Gera uma chave de acesso"
            redirectUrl="/admin/gerar"
          />
          <Widget
            icon={BsPersonFillSlash}
            title="Bloquear"
            description="Adiciona um usuário à lista negra"
            redirectUrl="/admin/bloquear"
          />
          <Widget
            icon={BsPersonFillDash}
            title="Desbloquear"
            description="Remove um usuário da lista negra"
            redirectUrl="/admin/desbloquear"
          />
          <Widget
            icon={BsPersonFillGear}
            title="Consultar"
            description="Consulta informações de um usuário"
            redirectUrl="/admin/consultar"
          />
        </div>
      </main>
      <div className="fixed bottom-5 left-0 right-0 flex justify-center">
        <div className="bg-secundary border border-text-secundary rounded-xl max-w-sm px-4 py-2">
          <p className="text-center">
            Usuário: {username}
            <br />
            Seu plano expira em: {formattedExpirationDate}
          </p>
        </div>
      </div>
    </>
  );
}
