import { NextApiRequest, NextApiResponse } from 'next';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import NodeCache from 'node-cache';
import axios from 'axios';

import AuthMiddleware from '@/middlewares/AuthMiddleware';

const API_BASE_URL_SECUNDARY = 'http://ip-api.com/json'
const API_BASE_URL_SERASA = `http://92.112.176.245:5008`
const API_BASE_URL_DUALITY = `http://92.112.176.245:5000/api`
const API_BASE_URL_OWNDATA = `http://192.168.1.6:5000/buscar_contatos`
const API_PLACAS = 'https://wdapi2.com.br'
const API_PLACAS_DETRAN = 'https://flamesconsultas.store/apis'
const API_CEP='https://viacep.com.br/ws'
const prisma = new PrismaClient();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const API_TOKEN=process.env.API_TOKEN

const cache = new NodeCache();

const RATE_LIMIT_DURATION = 60;
const REQUEST_LIMIT = 6;

interface EmpresaResult {
  CNPJ: string;
  Endereco: {
    Bairro: string;
    CEP: string;
    Cidade: string;
    Complemento: string;
    Nome: string;
    Numero: string;
    Tipo: string;
    Titulo: string;
    UF: string;
  };
  
  Participacao_Socio: string;
  Razao_Social: string;
}
interface WhoisResult {
  domain: string;
  owner: string;
  ownerid: string;
  responsible: string;
  country: string;
  "owner-c": string;
  "tech-c": string;
  nserver: string;
  nsstat: string;
  nslastaa: string;
  saci: string;
  created: string;
  changed: string;
  expires: string;
  status: string;
  provider: string;
  "nic-hdl-br": string;
  person: string;
  "e-mail": string;
}

interface PlacaResultdetran {
  alertSystemOutOfService: boolean;
  alerts: any[];
  billing: {
    document: {
      number: string;
      type: string;
    };
    state: string;
  };
  capacity: {
    chargeKg: number;
    passengers: number;
    totalGrossWeight: number;
  };
  completed: boolean;
  general: {
    characteristicsLastUpdate: string;
    chassis: string;
    color: string;
    fuelType: string;
    group: string;
    markupChassis: boolean;
    model: string;
    mountingType: string;
    plate: string;
    renavam: string;
    specie: string;
    type: string;
  };
  hasAlert: boolean;
  identifiers: {
    auxiliaryShaft: string;
    gearbox: string;
    motor: string;
    rearAxle: string;
  };
  import: {
    declarationId: string;
    importerId: string;
  };
  licensePlate: {
    city: string;
    cityId: string;
    state: string;
  };
  mechanics: {
    axleQuantity: number;
    engineCapacity: number;
    potencyHp: number;
    tractionKg: number;
  };
  owner: {
    document: {
      number: string;
      type: string;
    };
    name: string;
  };
  possessor: {
    document: {
      number: string;
      type: string;
    };
    name: string;
  };
  provider: string;
  renter: {
    document: {
      number: string;
      type: string;
    };
    name: string;
  };
  restrictions: any[];
  years: {
    manufacture: number;
    model: number;
  };
}



interface HostingData {
  query: string;
  country: string;
  regionName: string;
  city: string;
  isp: string;
  hosting: boolean | string;
}


interface CpfResult {
  CADASTRO_ID: string;
  CBO: string;
  CD_MOSAIC: string;
  CD_MOSAIC_NOVO: string;
  CD_MOSAIC_SECUNDARIO: string;
  CD_SIT_CAD: string;
  CONTATOS_ID: string;
  CONTATOS_ID_CONJUGE?: string;
  CPF: string;
  DT_INFORMACAO: string;
  DT_OB?: string;
  DT_SIT_CAD: string;
  ESTCIV: string;
  FAIXA_RENDA_ID?: string;
  NACIONALID?: string;
  NASC: string;
  NOME: string;
  NOME_MAE: string;
  NOME_PAI?: string;
  ORGAO_EMISSOR: string;
  RENDA?: string;
  RG: string;
  SEXO: string;
  SO: boolean;
  TITULO_ELEITOR: string;
  UF_EMISSAO: string;
  emails: { EMAIL: string }[];
  enderecos: {
    BAIRRO: string;
    CEP: string;
    CIDADE: string;
    ENDERECO: string;
    NUMERO: string;
  }[];
  irmaos: {
    nome: string;
    cpf: string;
    nasc: string;
    vinculo: string;
  }[];
  telefones: {
    DDD: string;
    NUMERO: string;
    INST: string;
  }[];
}



interface PlacaResult {
  veiculo_data: {
    Chassi: string;
    Placa: string;
    Ano: number;
    Cor: string;
    Modelo: string;
    Tipo: string;
    Origem: string;
    Carroceria: string;
    Motor: string;
  }
}
interface PlacaResult2 {
  MARCA: string;
  MODELO: string;
  SUBMODELO: string;
  VERSAO: string;
  ano: string;
  anoModelo: string;
  chassi: string;
  codigoSituacao: string;
  cor: string;
  data: string;
  extra: {
    ano_fabricacao: string;
    ano_modelo: string;
    caixa_cambio: string;
    cap_maxima_tracao: string;
    carroceria: string;
    cilindradas: string;
    combustivel: string;
    di: string;
    eixo_traseiro_dif: string;
    eixos: string;
    especie: string;
    faturado: string;
    grupo: string;
    limite_restricao_trib: string;
    linha: string;
    modelo: string;
    motor: string;
    municipio: string;
    nacionalidade: string;
    peso_bruto_total: string;
    placa_modelo_antigo: string;
    placa_modelo_novo: string;
    quantidade_passageiro: string;
    registro_di: string;
    renavam: string;
    restricao_1: string;
    restricao_2: string;
    restricao_3: string;
    restricao_4: string;
    s_especie: string;
    segmento: string;
    situacao_chassi: string;
    situacao_veiculo: string;
    sub_segmento: string;
    terceiro_eixo: string;
    tipo_carroceria: string;
    tipo_doc_faturado: string;
    tipo_doc_importadora: string;
    tipo_doc_prop: string;
    tipo_montagem: string;
    tipo_veiculo: string;
    uf: string;
    uf_faturado: string;
    uf_placa: string;
    unidade_local_srf: string;
  };
  fipe: {
    ano_modelo: string;
    codigo_fipe: string;
    codigo_marca: number;
    codigo_modelo: string;
    combustivel: string;
    id_valor: number;
    mes_referencia: string;
    referencia_fipe: number;
    score: number;
    sigla_combustivel: string;
    texto_marca: string;
    texto_modelo: string;
    texto_valor: string;
    tipo_modelo: number;
    listaModelo: string[];
    logo: string;
    marca: string;
    marcaModelo: string;
    mensagemRetorno: string;
    modelo: string;
    municipio: string;
    origem: string;
    placa: string;
    placa_alternativa: string;
    situacao: string;
    uf: string;
  };
}



interface Endereco {
  logradouro: string;
  logradouroNumero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}

interface NomeResult {
  NOME: string;
  CPF: string;
  NASC: string;
  NOME_MAE: string;
}

interface TelefoneResult {
  results: {
    ddd: string;
    telefone: string;
    cpf_cnpj?: string; // Campo opcional, pode ser CPF ou CNPJ
    cnpj?: string; 
    cpf?: string;    // Campo opcional, específico para CNPJ
    nome: string;
    source: string;
    data: string;
  }[];
}

interface MailResult {
  cpf: string;
  nome: string;
}


interface MotherResult {
  cpf_cnpj: string;
  nome: string;

}

interface TitleResult {
  nome: string;
  cpf: string;
  zona: string;
  secao: string;
}

async function QueryAPI(req: NextApiRequest, res: NextApiResponse) {
  let decoded: JwtPayload | null = null;
  let cacheKey: string | undefined;

  try {
    const { token } = req.cookies;
    const modules = req.query.module as string[];
    const [module, ...rest] = modules || [];
    const input = rest.join('/');

    let user: { role: string; queries: number } | null = null;

    try {
      decoded = jwt.verify(token as string, JWT_SECRET_KEY as string) as JwtPayload;

      if (decoded && 'id' in decoded) {
        const { id } = decoded;
        cacheKey = `id:${id}:${req.url}`;
        user = await prisma.user.findUnique({
          where: { id },
          select: {
            role: true,
            queries: true,
          },
        });
      }
    } catch (error) {
      console.error(error);
    }

    const requestCount = (cache.get(cacheKey as string) as number | undefined) || 0;
    cache.set(cacheKey as string, requestCount + 1, RATE_LIMIT_DURATION);

    if (requestCount >= REQUEST_LIMIT && user?.role !== 'admin') {
      cache.ttl(cacheKey as string);
      return res.status(429).json({
        message: 'Limite de requisições excedido.',
      });
    }

    const moduleUrlMap: Record<string, (input: string) => string> = {
      Ip: (input) => `${API_BASE_URL_SECUNDARY}/${input}?fields=16867865`,
      site: (input) => `http://92.112.178.71:3008/whois/${input}`,
      cpf: (input) => `${API_BASE_URL_SERASA}/cpf/${input}`,
      nomeserasa: (input) => `${API_BASE_URL_SERASA}/nome/${input}`,
      placa: (input) => `${API_BASE_URL_DUALITY}/consulta_placa?placa=${input}`,
      placa2: (input) => `${API_PLACAS}/consulta/${input}/${API_TOKEN}`,
      placadetran: (input) => `${API_PLACAS_DETRAN}/?consultar=${input}&consulta_tipo=veiculos/placa&token=Qq84BtO0Dtp0c1l6S`,
      telefone: (input) => `${API_BASE_URL_DUALITY}/consulta_telefone?ddd_telefone=${input}`,
      telefone2: (input) => `${API_BASE_URL_DUALITY}/consulta_telefone_cpf?cpf=${input}`,
      cep: (input) => `${API_BASE_URL_SERASA}/buscar_cep?cep=${input}`,
      mother: (input) => `${API_BASE_URL_DUALITY}/mae?nomemae=${encodeURIComponent(input)}`,
      mail: (input) => `${API_BASE_URL_OWNDATA}?email=${encodeURIComponent(input.toLowerCase())}`,
      title: (input) => `${API_BASE_URL_DUALITY}/eleitor?titulo=${input}`,
      cpfsocio: (input) => `${API_BASE_URL_DUALITY}/empresas?cpf_cnpj=${input}`,
      cnpj: (input) => `${API_BASE_URL_DUALITY}/empresas?cpf_cnpj=${input}`,
    };


    if (!moduleUrlMap[module]) {
      return res.status(404).json({ message: 'Módulo não reconhecido.' });
    }

    let url = moduleUrlMap[module](input);
    const response = await axios.get(url);
    const data = response.data;
    console.log('Dados recebidos da API:', data);
    if (response.status === 200) {
      const resultString = formatResults(module, data);
      console.log('Dados recebidos da API Formatada:', resultString);
      return res.status(200).json({ response: resultString });
    }
  } catch (error: any) {
    console.error(error);
    return res.status(404).json({ message: 'Consulta não encontrada.' });
  }
}

function formatResults(module: string, data: any): string {
  switch (module) {
    case 'Ip':
      return formatIpResults(data as HostingData, resultString);
    case 'site':
      return formatWhoisResults(data as WhoisResult);      
    case 'cpf':
      return formatCpfResults(data as CpfResult);
    case 'placa':
      return formatPlacaResults(data as PlacaResult);
    case 'placa2':
      return formatPlacaResults2(data as PlacaResult2);
    case 'placadetran':
      return formatPlacaResultsdetran(data[0] as PlacaResultdetran);
    case 'nomeserasa':  
      return formatNameResults(data as { cpf: string; mae: string; nasc: string; nome: string }[], 1500);
    case 'telefone':
      return formatTelefoneResults(data as TelefoneResult);
    case 'telefone2':
      return formatTelefoneResults(data.data as TelefoneResult);
    case 'mail':
      return formatMailResults(data as MailResult[]);

    case 'title':
      return formatTitleResults(data as TitleResult[]);      
      case 'mother':
        return formatMotherResults(data as [string, string][]);
    case 'cpfsocio':
      return formatEmpresaResults(data as EmpresaResult[]);
      
    default:
      return '';
  }
}

export default AuthMiddleware(QueryAPI);

let resultString = '';

function formatWhoisResults(parsedResult: WhoisResult): string {
  let resultString = '';

  resultString += `
Domínio: ${parsedResult.domain || 'Não encontrado'}
Proprietário: ${parsedResult.owner || 'Não encontrado'}
ID do Proprietário: ${parsedResult.ownerid || 'Não encontrado'}
Responsável: ${parsedResult.responsible || 'Não encontrado'}
País: ${parsedResult.country || 'Não encontrado'}
Código do Proprietário: ${parsedResult["owner-c"] || 'Não encontrado'}
Código Técnico: ${parsedResult["tech-c"] || 'Não encontrado'}
Servidor de Nomes: ${parsedResult.nserver || 'Não encontrado'}
Status do Servidor de Nomes: ${parsedResult.nsstat || 'Não encontrado'}
Última Atualização do Servidor de Nomes: ${parsedResult.nslastaa || 'Não encontrado'}
SACI: ${parsedResult.saci || 'Não encontrado'}
Data de Criação: ${parsedResult.created || 'Não encontrado'}
Data de Alteração: ${parsedResult.changed || 'Não encontrado'}
Data de Expiração: ${parsedResult.expires || 'Não encontrado'}
Status: ${parsedResult.status || 'Não encontrado'}
Provedor: ${parsedResult.provider || 'Não encontrado'}
NIC Handle BR: ${parsedResult["nic-hdl-br"] || 'Não encontrado'}
Pessoa de Contato: ${parsedResult.person || 'Não encontrado'}
Email: ${parsedResult["e-mail"] || 'Não encontrado'}
`;

  return resultString;
}

function formatPlacaResults2(parsedResult: PlacaResult2): string {
  let resultString = '';

  // for (let i = 0; i < Math.min(data.length); i++) {
  //   const parsedResult = data[i];
  const extraData = parsedResult.extra;
  const fipeData = parsedResult.fipe;

    resultString += `
  Marca: ${parsedResult.MARCA || 'Não encontrado'}
  Modelo: ${parsedResult.MODELO || 'Não encontrado'}
  Submodelo: ${parsedResult.SUBMODELO || 'Não encontrado'}
  Versão: ${parsedResult.VERSAO || 'Não encontrado'}
  Ano: ${parsedResult.ano || 'Não encontrado'}
  Ano do Modelo: ${parsedResult.anoModelo || 'Não encontrado'}
  Chassi: ${parsedResult.chassi || 'Não encontrado'}
  Código de Situação: ${parsedResult.codigoSituacao || 'Não encontrado'}
  Cor: ${parsedResult.cor || 'Não encontrado'}
  Data: ${parsedResult.data || 'Não encontrado'}
  
  --- Informações Extras ---
  Ano de Fabricação: ${extraData.ano_fabricacao || 'Não encontrado'}
  Ano do Modelo: ${extraData.ano_modelo || 'Não encontrado'}
  Caixa de Câmbio: ${extraData.caixa_cambio || 'Não encontrado'}
  Capacidade Máxima de Tração: ${extraData.cap_maxima_tracao || 'Não encontrado'}
  Carroceria: ${extraData.carroceria || 'Não encontrado'}
  Cilindradas: ${extraData.cilindradas || 'Não encontrado'}
  Combustível: ${extraData.combustivel || 'Não encontrado'}
  DI: ${extraData.di || 'Não encontrado'}
  Eixo Traseiro Diferencial: ${extraData.eixo_traseiro_dif || 'Não encontrado'}
  Eixos: ${extraData.eixos || 'Não encontrado'}
  Espécie: ${extraData.especie || 'Não encontrado'}
  Faturado: ${extraData.faturado || 'Não encontrado'}
  Grupo: ${extraData.grupo || 'Não encontrado'}
  Limite de Restrição Tributária: ${extraData.limite_restricao_trib || 'Não encontrado'}
  Linha: ${extraData.linha || 'Não encontrado'}
  Modelo: ${extraData.modelo || 'Não encontrado'}
  Motor: ${extraData.motor || 'Não encontrado'}
  Município: ${extraData.municipio || 'Não encontrado'}
  Nacionalidade: ${extraData.nacionalidade || 'Não encontrado'}
  Peso Bruto Total: ${extraData.peso_bruto_total || 'Não encontrado'}
  Placa Modelo Antigo: ${extraData.placa_modelo_antigo || 'Não encontrado'}
  Placa Modelo Novo: ${extraData.placa_modelo_novo || 'Não encontrado'}
  Quantidade de Passageiros: ${extraData.quantidade_passageiro || 'Não encontrado'}
  Registro DI: ${extraData.registro_di || 'Não encontrado'}
  Renavam: ${extraData.renavam || 'Não encontrado'}
  Restrição 1: ${extraData.restricao_1 || 'Não encontrado'}
  Restrição 2: ${extraData.restricao_2 || 'Não encontrado'}
  Restrição 3: ${extraData.restricao_3 || 'Não encontrado'}
  Restrição 4: ${extraData.restricao_4 || 'Não encontrado'}
  Espécie (S): ${extraData.s_especie || 'Não encontrado'}
  Segmento: ${extraData.segmento || 'Não encontrado'}
  Situação do Chassi: ${extraData.situacao_chassi || 'Não encontrado'}
  Situação do Veículo: ${extraData.situacao_veiculo || 'Não encontrado'}
  Subsegmento: ${extraData.sub_segmento || 'Não encontrado'}
  Terceiro Eixo: ${extraData.terceiro_eixo || 'Não encontrado'}
  Tipo de Carroceria: ${extraData.tipo_carroceria || 'Não encontrado'}
  Tipo de Documento Faturado: ${extraData.tipo_doc_faturado || 'Não encontrado'}
  Tipo de Documento Importadora: ${extraData.tipo_doc_importadora || 'Não encontrado'}
  Tipo de Documento Proprietário: ${extraData.tipo_doc_prop || 'Não encontrado'}
  Tipo de Montagem: ${extraData.tipo_montagem || 'Não encontrado'}
  Tipo de Veículo: ${extraData.tipo_veiculo || 'Não encontrado'}
  UF: ${extraData.uf || 'Não encontrado'}
  UF Faturado: ${extraData.uf_faturado || 'Não encontrado'}
  UF da Placa: ${extraData.uf_placa || 'Não encontrado'}
  Unidade Local SRF: ${extraData.unidade_local_srf || 'Não encontrado'}

 
  `;
  

  return resultString;
}

function formatPlacaResultsdetran(parsedResult: PlacaResultdetran): string {
  let resultString = '';

  resultString += `
Sistema de Alerta Fora de Serviço: ${parsedResult.alertSystemOutOfService ? 'Sim' : 'Não'}
Estado de Cobrança: ${parsedResult.billing.state || 'Não encontrado'}
Chassi: ${parsedResult.general.chassis || 'Não encontrado'}
Cor: ${parsedResult.general.color || 'Não encontrado'}
Tipo de Combustível: ${parsedResult.general.fuelType || 'Não encontrado'}
Modelo: ${parsedResult.general.model || 'Não encontrado'}
Placa: ${parsedResult.general.plate || 'Não encontrado'}
Renavam: ${parsedResult.general.renavam || 'Não encontrado'}
Tipo: ${parsedResult.general.type || 'Não encontrado'}
Última Atualização das Características: ${parsedResult.general.characteristicsLastUpdate || 'Não encontrado'}

Cidade da Placa: ${parsedResult.licensePlate.city || 'Não encontrado'}
Estado da Placa: ${parsedResult.licensePlate.state || 'Não encontrado'}

Capacidade de Passageiros: ${parsedResult.capacity.passengers || 'Não encontrado'}
Potência do Motor (HP): ${parsedResult.mechanics.potencyHp || 'Não encontrado'}
Capacidade do Motor (cc): ${parsedResult.mechanics.engineCapacity || 'Não encontrado'}

Nome do Proprietário: ${parsedResult.owner.name || 'Não encontrado'}
Documento do Proprietário: ${parsedResult.owner.document.number || 'Não encontrado'}

Nome do Possuidor: ${parsedResult.possessor.name || 'Não encontrado'}
Documento do Possuidor: ${parsedResult.possessor.document.number || 'Não encontrado'}

Ano de Fabricação: ${parsedResult.years.manufacture || 'Não encontrado'}
Ano do Modelo: ${parsedResult.years.model || 'Não encontrado'}
`;

  return resultString;
}


function formatCpfResults(parsedResult: CpfResult): string {
  let resultString = '';

  resultString += `
CPF: ${parsedResult.CPF || 'Não encontrado'}
Nome: ${parsedResult.NOME || 'Não encontrado'}
Sexo: ${parsedResult.SEXO === 'M' ? 'Masculino' : 'Feminino'}
Nascimento: ${parsedResult.NASC || 'Não encontrado'}
Nome da Mãe: ${parsedResult.NOME_MAE || 'Não encontrado'}
Nome do Pai: ${parsedResult.NOME_PAI || 'Não encontrado'}
RG: ${parsedResult.RG || 'Não encontrado'}
CBO: ${parsedResult.CBO || 'Não encontrado'}
Orgão Emissor: ${parsedResult.ORGAO_EMISSOR || 'Não encontrado'}
Estado da Emissão: ${parsedResult.UF_EMISSAO || 'Não encontrado'}
Data da OB: ${parsedResult.DT_OB || 'Não encontrado'}
Renda Mensal: ${parsedResult.RENDA || 'Não encontrado'}
Título de Eleitor: ${parsedResult.TITULO_ELEITOR || 'Não encontrado'}
Estado Civil: ${parsedResult.ESTCIV || 'Não encontrado'}\n`;

  if (parsedResult.enderecos && parsedResult.enderecos.length > 0) {
    resultString += '\nEndereços:\n';
    parsedResult.enderecos.forEach((address, index) => {
      resultString += `${index + 1}. ${address.ENDERECO}, ${address.NUMERO} - ${address.BAIRRO} - ${address.CIDADE} - ${address.CEP}\n`;
    });
  } else {
    resultString += '\nEndereços: Não encontrado\n';
  }

  if (parsedResult.telefones && parsedResult.telefones.length > 0) {
    resultString += '\nTelefones:\n';
    parsedResult.telefones.forEach((phone, index) => {
      resultString += `${index + 1}. (${phone.DDD}) ${phone.NUMERO}\n`;
    });
  } else {
    resultString += '\nTelefones: Não encontrado\n';
  }

  if (parsedResult.irmaos && parsedResult.irmaos.length > 0) {
    resultString += '\nParentes:\n';
    parsedResult.irmaos.forEach((irmao, index) => {
      resultString += `${index + 1}. Nome: ${irmao.nome}, CPF: ${irmao.cpf}, Vínculo: ${irmao.vinculo}\n`;
    });
  } else {
    resultString += '\nParentes: Não encontrado\n';
  }

  if (parsedResult.emails && parsedResult.emails.length > 0) {
    resultString += '\nEmails:\n';
    parsedResult.emails.forEach((emailObj, index) => {
      resultString += `${index + 1}. ${emailObj.EMAIL}\n`;
    });
  } else {
    resultString += '\nEmails: Não encontrado\n';
  }

  return resultString;
}


function formatEmpresaResults(data: EmpresaResult[]): string {
  let resultString = ''; // Inicialização da variável resultString aqui
  console.log('Estou dentro da função');

  const maxResults = 10; // Defina o número máximo de resultados a serem processados
    
  // Usar um loop for para iterar sobre os dados
  for (let i = 0; i < Math.min(data.length, maxResults); i++) {
    const empresa = data[i];
    
    resultString += `
      Razão Social: ${empresa.Razao_Social || 'Não encontrado'}
      CNPJ: ${empresa.CNPJ || 'Não encontrado'}
      Participação Societaria: ${empresa.Participacao_Socio || 'Não encontrado'}
      Endereço:
        Tipo: ${empresa.Endereco?.Tipo || 'Não encontrado'}
        Nome: ${empresa.Endereco?.Nome || 'Não encontrado'}
        Número: ${empresa.Endereco?.Numero || 'Não encontrado'}
        Complemento: ${empresa.Endereco?.Complemento || 'Não encontrado'}
        Bairro: ${empresa.Endereco?.Bairro || 'Não encontrado'}
        Cidade: ${empresa.Endereco?.Cidade || 'Não encontrado'}
        CEP: ${empresa.Endereco?.CEP || 'Não encontrado'}
        UF: ${empresa.Endereco?.UF || 'Não encontrado'}
        Título: ${empresa.Endereco?.Titulo || 'Não encontrado'}
    `;
    
    // Adicionar uma quebra de linha entre cada empresa, exceto a última
    if (i !== Math.min(data.length, maxResults) - 1) {
      resultString += '\n\n';
    }
  }

  return resultString;
}



function formatPlacaResults(data: PlacaResult) {
  let resultString = '';

  // Não há necessidade de JSON.parse, pois já recebemos um objeto
  const veiculoData = data.veiculo_data;

  // Verifique se veiculoData existe e é um objeto
  if (veiculoData) {
    const {
      Chassi,
      Placa,
      Ano,
      Cor,
      Modelo,
      Tipo,
      Origem,
      Carroceria,
      Motor
    } = veiculoData;

    // Construa a string de resultados formatada
    resultString += `
      Chassi: ${Chassi || 'Não encontrado'}
      Placa: ${Placa || 'Não encontrado'}
      Ano: ${Ano || 'Não encontrado'}
      Cor: ${Cor || 'Não encontrado'}
      Modelo: ${Modelo || 'Não encontrado'}
      Tipo: ${Tipo || 'Não encontrado'}
      Origem: ${Origem || 'Não encontrado'}
      Carroceria: ${Carroceria || 'Não encontrado'}
      Motor: ${Motor || 'Não encontrado'}
    `;
  } else {
    // Se a chave 'veiculo_data' não existir nos dados, retorne uma mensagem de erro
    resultString = 'Dados de veículo não encontrados';
  }

  return resultString;
}

function formatTelefoneResults(data: TelefoneResult): string {
  let resultString = '';

  // Verificando se 'data.results' está definida e é uma matriz não vazia
  if (data.results && Array.isArray(data.results) && data.results.length > 0) {
    data.results.forEach(result => {
      const {
        ddd,
        telefone,
        cpf_cnpj,
        cnpj,
        cpf,
        data,
        nome,
        source
      } = result;

      let identificador = 'Não encontrado';
      if (cpf_cnpj) {
        identificador = `CPF/CNPJ: ${cpf_cnpj}`;
      } else if (cnpj) {
        identificador = `CNPJ: ${cnpj}`;
      } else if (cpf) {
        identificador = `CPF: ${cpf}`;
      }

      resultString += `
      ----------------------------------------
      Nome: ${nome || 'Não encontrado'}
      Source: ${source || 'Não encontrado'}
      DDD: ${ddd || 'Não encontrado'}
      Telefone: ${telefone || 'Não encontrado'}
      ${identificador}
      Instalacação: ${data || 'Null'}
      ----------------------------------------
      `;
    });
  } else {
    resultString = 'Dados não disponíveis';
  }

  return resultString;
}


function formatTitleResults(data: TitleResult[]): string {
  let resultString = ''; // Inicialização da variável resultString aqui
  
  // Iterar sobre cada elemento do array de dados
  data.forEach((item, index) => {
    resultString += `
      NOME: ${item.nome || 'Não encontrado'}
      CPF: ${item.cpf || 'Não encontrado'}
      ZONA: ${item.zona || 'Não encontrado'}
      SECAO: ${item.secao || 'Não encontrado'}
      
      `;

    // Adicionar uma linha em branco entre os resultados, exceto para o último item
    if (index < data.length - 1) {
      resultString += '\n';
    }
  });

  return resultString;
}

function formatIpResults(data: HostingData, resultString: string) {
  resultString = '';

  resultString += `
IP: ${data.query || 'Não encontrado'}
País: ${data.country || 'Não encontrado'}
Região: ${data.regionName || 'Não encontrado'}
Cidade: ${data.city || 'Não encontrado'}
ISP: ${data.isp || 'Não encontrado'}
É uma hospedagem? ${data.hosting === true ? 'SIM' : 'NÃO'}
`;

  return resultString;
}



function formatNameResults(data: { cpf: string; mae: string; nasc: string; nome: string }[], maxResults: number): string {
  let resultString = '';

  // Verificando se data é um array
  if (Array.isArray(data)) {
    for (let i = 0; i < Math.min(data.length, maxResults); i++) {
      const result = data[i];
      resultString += `
Nome: ${result.nome || 'Não encontrado'}
CPF: ${result.cpf || 'Não encontrado'}
Nascimento: ${result.nasc || 'Não encontrado'}
Nome da Mãe: ${result.mae || 'Não encontrado'}
`;
    }

    // Se houver mais resultados do que o limite especificado, avise o usuário
    if (data.length > maxResults) {
      resultString += `\nExibindo apenas ${maxResults} de ${data.length} resultados.`;
    }
  } else {
    resultString = 'Dados não disponíveis';
  }

  return resultString;
}


function formatMailResults(data: MailResult[] | MailResult): string {
  let resultString = ''; // Inicialização da variável resultString aqui

  // Verificar se 'data' é um array
  if (Array.isArray(data)) {
    // Iterar sobre cada objeto no array
    data.forEach((result, index) => {
      resultString += `
${index + 1}.
CPF: ${result.cpf || 'Não encontrado'}
Nome: ${result.nome || 'Não encontrado'}
`;
    });
  } else {
    // Se 'data' for um único objeto
    resultString += `
CPF: ${data.cpf || 'Não encontrado'}
Nome: ${data.nome || 'Não encontrado'}
`;
  }

  return resultString;
}


function formatMotherResults(data: [string, string][]): string {
  let resultString = '';

  // Iterando sobre cada elemento do array de dados
  data.forEach(([nome, cpf]) => {
    // Adicionando os dados formatados ao resultString para cada elemento
    resultString += `
     CPF: ${cpf || 'Não encontrado'}
     NOME: ${nome || 'Não encontrado'}
    `;
  });

  return resultString;
}

