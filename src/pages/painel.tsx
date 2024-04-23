import {
  BsFillPersonVcardFill,
  BsFillPersonFill,
  BsFillTelephoneFill,
  BsFillPersonBadgeFill,
  BsCurrencyDollar,
  BsFillCarFrontFill,
  BsFillBuildingFill,
  BsFillTelephoneXFill
} from 'react-icons/bs';
import { IoWomanSharp, IoLocationSharp } from 'react-icons/io5';
import { FaServer } from 'react-icons/fa';
import { FaCar } from 'react-icons/fa';
import { IoMdMail } from 'react-icons/io';
import { format, parseISO } from 'date-fns';

import LoadingAnimation from '@/components/LoadingAnimation';
import { useSession } from '@/hooks/useSession';
import Header from '@/components/Header';
import Widget from '@/components/Widget';

export default function Panel() {
  const userData = useSession();
  if (!userData) {
    return <LoadingAnimation />;
  }

  const { username, role, expirationDate } = userData;
  const parsedExpirationDate = parseISO(expirationDate);
  const formattedExpirationDate = format(parsedExpirationDate, 'dd/MM/yyyy');
  return (
    <>
      <Header adminButton={role === 'admin'} />
      <main className="flex min-h-screen flex-col items-center justify-between p-3 md:p-10">
        <div className="grid grid-cols-2 2sm:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
         
          <Widget
            icon={BsFillPersonVcardFill}
            title="CPF"
            description="Consultando CPF com a melhor qualidade de dados"
            redirectUrl="/consultar/cpf"
          />
          <Widget
            icon={BsFillPersonFill}
            title="Nome"
            description="Consultando nomes completos por todo Brasil"
            redirectUrl="/consultar/nome"
          />
          <Widget
            icon={BsFillTelephoneFill}
            title="Telefone"
            description="Dados vinculados um telefone"
            redirectUrl="/consultar/telefone"
          />
          <Widget
            icon={FaCar}
            title="PLACA"
            description="Informações através da PLACA"
            redirectUrl="/consultar/placa"
          />
          <Widget
            icon={IoMdMail}
            title="Email"
            description="Dados vinculados a um endereço de e-mail"
            redirectUrl="/consultar/email"
          />
          <Widget
            icon={IoLocationSharp}
            title="CEP"
            description="Informações completas de um CEP"
            redirectUrl="/consultar/cep"
          />
          <Widget
            icon={IoWomanSharp}
            title="Mãe"
            description="Trás todos os filhos atráves do nome da Mãe"
            redirectUrl="/consultar/mae"
          />
          <Widget
            icon={BsFillPersonBadgeFill}
            title="Titulo Eleitor"
            description="Dados a partir do título de eleitor brasileiro"
            redirectUrl="/consultar/eleitor"
          />
          <Widget
            icon={FaServer}
            title="IP"
            description="Informações a partir de qualquer endereço IP"
            redirectUrl="/consultar/ip"
          />
            <Widget
            icon={BsFillCarFrontFill}
            title="PLACA 2.0"
            description="Informações completas através da PLACA"
            redirectUrl="/consultar/placa2"
          />
          <Widget
            icon={BsFillBuildingFill}
            title="CNPJ"
            description="Busca Empresas no CPF ou Sócios por CNPJ"
            redirectUrl="/consultar/empresa"
          />
          <Widget
            icon={BsFillTelephoneXFill}
            title="Telefone"
            description="Busca telefones vinculados a um CPF"
            redirectUrl="/consultar/telefone2"
          />
          {/* <Widget
            icon={BsCurrencyDollar}
            title="Comprar Créditos"
            description="Renovar o Seu plano"
            redirectUrl="/consultar/placa2"
          /> */}
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
