import { NextApiRequest, NextApiResponse } from 'next';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import NodeCache from 'node-cache';
import axios from 'axios';

import AuthMiddleware from '@/middlewares/AuthMiddleware';

const API_BASE_URL_SECUNDARY = 'http://ip-api.com/json'
const API_BASE_URL_SERASA = `https://f5search.com.br/search/serasa?access-key=${process.env.API_SERASA}`
const API_BASE_URL_DUALITY = `https://api.arcadiancenter.com/token/${process.env.API_DUALITY}`


const prisma = new PrismaClient();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const cache = new NodeCache();

const RATE_LIMIT_DURATION = 60;
const REQUEST_LIMIT = 6;


interface HostingData {
  query: string;
  country: string;
  regionName: string;
  city: string;
  isp: string;
  hosting: boolean | string;
}

interface CpfResult {
  data: {
    CONTATOS: {
      CONTATOS_ID: string;
      CPF: string;
      NOME: string;
      SEXO: string;
      NASC: string;
      NOME_MAE: string;
      NOME_PAI: string;
      CADASTRO_ID: string;
      ESTCIV: string;
      RG: string;
      NACIONALID: string;
      CONTATOS_ID_CONJUGE: string;
      SO: string;
      CD_SIT_CAD: string;
      DT_SIT_CAD: string;
      DT_INFORMACAO: string;
      CBO: string;
      ORGAO_EMISSOR: string;
      UF_EMISSAO: string;
      DT_OB: string;
      CD_MOSAIC: string;
      RENDA: string;
      FAIXA_RENDA_ID: string;
      TITULO_ELEITOR: string;
      CD_MOSAIC_NOVO: string;
      CD_MOSAIC_SECUNDARIO: string;
    };
    EMAIL: Array<{
      CONTATOS_ID: string;
      EMAIL: string;
      PRIORIDADE: string;
      EMAIL_SCORE: string;
      EMAIL_PESSOAL: string;
      EMAIL_DUPLICADO: string;
      BLACKLIST: string;
      ESTRUTURA: string;
      STATUS_VT: string;
      DOMINIO: string;
      MAPAS: string;
      PESO: string;
      CADASTRO_ID: string;
      DT_INCLUSAO: string;
    }>;
    ENDERECOS: Array<{
      CONTATOS_ID: string;
      LOGR_TIPO: string;
      LOGR_NOME: string;
      LOGR_NUMERO: string;
      LOGR_COMPLEMENTO: string;
      BAIRRO: string;
      CIDADE: string;
      UF: string;
      CEP: string;
      DT_ATUALIZACAO: string;
      DT_INCLUSAO: string;
      TIPO_ENDERECO_ID: string
    }>;
    HISTORICO_TELEFONES: Array<{
      CONTATOS_ID: string;
      DDD: string;
      TELEFONE: string;
      TIPO_TELEFONE: string;
      DT_INCLUSAO: string;
      DT_INFORMACAO: string;
      SIGILO: string;
      NSU: string;
      CLASSIFICACAO: string;
    }>;
    MAPA_PARENTES_ANALYTICS: Array<{
      NOME_VINCULO: string;
      CPF_VINCULO: string;
      VINCULO: string;
    }>;
    MODELOS_ANALYTICS_SCORE: {
      CONTATOS_ID: string;
      CSB8: string;
      CSB8_FAIXA: string;
      CSBA: string;
      CSBA_FAIXA: string;
    };
    PODER_AQUISITIVO: {
      CONTATOS_ID: string;
      COD_PODER_AQUISITIVO: string;
      PODER_AQUISITIVO: string;
      RENDA_PODER_AQUISITIVO: string;
      FX_PODER_AQUISITIVO: string
    };
    PROFISSAO: string;
    PIS: {
      CONTATOS_ID: string;
      PIS: string;
      CADASTRO_ID: string;
      DT_INCLUSAO: string;
    };
    TSE: string;
    UNIVERSITARIO: {
      NOME: string;
      ANO_VESTIBULAR: string;
      FACULDADE: string;
      UF: string;
      CAMPUS: string;
      CURSO: string;
      PERIODO_CURSADO: string;
      INSCRICAO_VESTIBULAR: string;
      DATA_NASCIMENTO: string;
      COTA: string;
      ANO_CONCULSAO: string;
      DT_INCLUSAO: string;
    };
    IRPF: {
      DocNumber: string;
      Instituicao_Bancaria: string;
      Cod_Agencia: string;
      Lote: string;
      Ano_Referencia: string;
      Dt_Lote: string;
      Sit_Receita_Federal: string;
      Dt_Consulta: string;
    }
  }
}

interface PlacaResult {
  data: {
    INFORMACOES_DO_VEICULO: {
    tipo_veiculo: string;
    tipo_combustivel: string;
    capac_passageiro: string;
    numero_lacre: string;
    ano_fabricacao: string;
    renavam: string;
    capac_carga: string;
    marca_modelo: string;
    chassi: string;
    uf_lacre: string;
    ano_lic_corrent: string;
    ano_modelo: string;
    placa: string;
    catego_veiculo: string;
    uf_veiculo: string;
    ano_licenc: string;
    cor_veiculo: string;
    especie_veiculo: string;
    valor_deb_licens: string;
    restricao_judicial: string;
    situacao: string;
    valor_multa: string;
    valor_bur: string;
    cod_restricao_4: string;
    comunicacao_venda: string;
    roubo_furt: string;
    data_comunic_venda: string;
    bloqueio_administ: string;
    debito_ipva: string;
    debito_seguro: string;
    valor_deb_seguro: string;
    valor_dac: string;
    debito_licens:string;
    proprietario: string;
    type: string;
    cpf_cnpj: string;
    nome: string;
  }
  }
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
  CPF: string;
  NOME: string;
  SEXO: string;
  NASC: string;
  NOME_MAE: string;
  NOME_PAI: string;
  RG: string;
  UF_EMISSAO: string;
  DT_SIT_CAD: string;
  RENDA: string;
  TITULO_ELEITOR: string;

}

interface TelefoneResult {
  data: {
    Contatos: {
      CPF: string;
      NOME: string;
      SEXO: string;
      NASC: string;
      NOME_MAE: string;
      NOME_PAI: string;
      RG: string;
      DT_SIT_CAD: string;
      CBO: string;
      ORGAO_EMISSOR: string;
      UF_EMISSAO: string;
      DT_OB: string;
      RENDA: string;
      TITULO_ELEITOR: string;
      DDD: string;
      TELEFONE: string;
      TIPO_TELEFONE: string;
      DT_INCLUSAO: string;
      SIGILO: string;
      NSU: string;
      CLASSIFICACAO: string
    }
  }
}
interface MailResult {
  cpf_cnpj: string;
  nome: string;
  dataNascimento: string;
  sexo: string;
  nomeMae: string;
}

interface CepResult {
  cpf_cnpj: string;
  nome: string;
  dataNascimento: string;
  sexo: string;
  nomeMae: string;
}

interface MotherResult {
  cpf_cnpj: string;
  nome: string;
  dataNascimento: string;
  sexo: string;
  nomeMae: string;
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
      cpf: (input) => `${API_BASE_URL_SERASA}&cpf=${input}`,
      nomeserasa: (input) => `${API_BASE_URL_SERASA}&nome=${encodeURIComponent(input)}`,
      placa: (input) => `${API_BASE_URL_DUALITY}/PlacaCircular/${encodeURIComponent(input)}`,
      telefone: (input) => `${API_BASE_URL_SERASA}&telefone=${input}`,
      // cep: (input) => `${API_BASE_URL_OWNDATA}&modulo=cep&consulta=0${input}`,
      // mother: (input) => `${API_BASE_URL_OWNDATA}&modulo=mother&consulta=${encodeURIComponent(input)}`,
      // mail: (input) => `${API_BASE_URL_OWNDATA}&modulo=mail&consulta=${encodeURIComponent(input.toLowerCase())}`,
      // title: (input) => `${API_BASE_URL_OWNDATA}&modulo=title&consulta=${input}`,
      
    };


    if (!moduleUrlMap[module]) {
      return res.status(404).json({ message: 'Módulo não reconhecido.' });
    }

    let url = moduleUrlMap[module](input);
    const response = await axios.get(url);
    const data = response.data;

    if (response.status === 200) {
      const resultString = formatResults(module, data);
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
    case 'cpf':
      return formatCpfResults(data as CpfResult, resultString);
    case 'placa':
      return formatPlacaResults(data as PlacaResult, resultString);
    case 'nomeserasa':  
      return formatNameResults(data.data as NomeResult[], 20);
    case 'telefone':
      return formatTelefoneResults(data.data as TelefoneResult[], 20);
    case 'mail':
      return formatMailResults(data.msg as MailResult[]);
    case 'cep':
      return formatCepResults(data.msg as CepResult[], 15);
    case 'mother':
      return formatMotherResults(data.msg as MotherResult[], 4);
    default:
      return '';
  }
}

export default AuthMiddleware(QueryAPI);

let resultString = '';

function formatCpfResults(parsedResult: CpfResult, resultString: string) {

  resultString = '';

  resultString += `
CPF: ${parsedResult.data.CONTATOS.CPF || 'Não encontrado'}
Nome: ${parsedResult.data.CONTATOS.NOME || 'Não encontrado'}
Sexo: ${parsedResult.data.CONTATOS.SEXO === 'M' ? 'Masculino' : 'Feminino'}
Nascimento: ${parsedResult.data.CONTATOS.NASC || 'Não encontrado'}
Nome da Mãe: ${parsedResult.data.CONTATOS.NOME_MAE || 'Não encontrado'}
Nome do Pai: ${parsedResult.data.CONTATOS.NOME_PAI || 'Não encontrado'}
RG: ${parsedResult.data.CONTATOS.RG || 'Não encontrado'}
CBO: ${parsedResult.data.CONTATOS.CBO || 'Não encontrado'}
Orgao Emissor: ${parsedResult.data.CONTATOS.ORGAO_EMISSOR || 'Não encontrado'}
Estado da Emissão: ${parsedResult.data.CONTATOS.DT_SIT_CAD || 'Não encontrado'}
DATA DA OB: ${parsedResult.data.CONTATOS.DT_OB || 'Não encontrado'}
RENDA MENSAL: ${parsedResult.data.CONTATOS.RENDA || 'Não encontrado'}
Titulo de Eleitor: ${parsedResult.data.CONTATOS.TITULO_ELEITOR || 'Não encontrado'}\n`


  if (parsedResult.data.MODELOS_ANALYTICS_SCORE) {
    resultString += '\nScore:\n';
    resultString += `Score CSB8: ${parsedResult.data.MODELOS_ANALYTICS_SCORE.CSB8 || 'Não encontrado'}\nScore CSBA: ${parsedResult.data.MODELOS_ANALYTICS_SCORE.CSBA || 'Não ecnontrado'}\n`;
  }

  if (parsedResult.data.HISTORICO_TELEFONES)
    resultString += '\nTelefones\n';
  resultString += parsedResult.data.HISTORICO_TELEFONES
    .map((phone, index) => {
      const formattedPhone = `(${phone.DDD})${phone.TELEFONE}DATA INCLUSAO ${phone.DT_INCLUSAO}`;
      return (index + 1) % 3 === 0 ? `${formattedPhone}\n` : formattedPhone;
    })
    .join('\n');

  if (parsedResult.data.EMAIL) {
    resultString += '\nEmails:\n';
    resultString += parsedResult.data.EMAIL
      .map(email => `${email.EMAIL} - SCORE  ${email.EMAIL_SCORE}\n`)
      .join('');
  }

  if (parsedResult.data.ENDERECOS) {
    resultString += '\nEndereços\n';
    resultString += parsedResult.data.ENDERECOS
      .map(address => `${address.LOGR_TIPO} ${address.LOGR_NOME}, ${address.LOGR_NUMERO} - ${address.BAIRRO}, ${address.CIDADE}/${address.UF}  DATA INFORMACAO:${address.DT_INCLUSAO}\n`)
      .join('\n');
  }

  if (parsedResult.data.PODER_AQUISITIVO) {
    resultString += '\nPoder Aquisitivo:\n';
    resultString += `Poder Aquisitivo: ${parsedResult.data.PODER_AQUISITIVO.PODER_AQUISITIVO || 'Não encontrado'}\n`;
    resultString += `RENDA MAX ${parsedResult.data.PODER_AQUISITIVO.RENDA_PODER_AQUISITIVO || 'Não encontrado'}\n`;
    resultString += `RENDA APROXIMADA: ${parsedResult.data.PODER_AQUISITIVO.FX_PODER_AQUISITIVO || 'Não encontrado'}\n`;
  }

  if (parsedResult.data.PROFISSAO) {
    resultString += '\nProfissão:\n';
    resultString += `${parsedResult.data.PROFISSAO || 'Não encontrado'}\n`;
  }
  if (parsedResult.data.PIS) {
    resultString += '\nPIS:\n';
    resultString += `PIS ${parsedResult.data.PIS.PIS || 'Não encontrado'}\n`;
    resultString += `DATA INCLUSAO PIS${parsedResult.data.PIS.DT_INCLUSAO || 'Não encontrado'}\n`;
  }
  if (parsedResult.data.UNIVERSITARIO) {
    resultString += '\nUniversitario:\n';
    resultString += `NOME: ${parsedResult.data.UNIVERSITARIO.NOME || 'Não encontrado'}\n`
    resultString += `ANO_VESTIBULAR: ${parsedResult.data.UNIVERSITARIO.ANO_VESTIBULAR || 'Não encontrado'}\n`
    resultString += `FACULDADE: ${parsedResult.data.UNIVERSITARIO.FACULDADE || 'Não encontrado'}\n`
    resultString += `UF: ${parsedResult.data.UNIVERSITARIO.UF || 'Não encontrado'}\n`
    resultString += `CAMPUS: ${parsedResult.data.UNIVERSITARIO.CAMPUS || 'Não encontrado'}\n`
    resultString += `CURSO: ${parsedResult.data.UNIVERSITARIO.CURSO || 'Não encontrado'}\n`
    resultString += `PERIODO CURSADO: ${parsedResult.data.UNIVERSITARIO.PERIODO_CURSADO || 'Não encontrado'}\n`
    resultString += `DATA ENTRADA: ${parsedResult.data.UNIVERSITARIO.DATA_NASCIMENTO || 'Não encontrado'}\n`
    resultString += `COTA: ${parsedResult.data.UNIVERSITARIO.COTA || 'Não encontrado'}\n`
    resultString += `ANO CONCLUSÃO: ${parsedResult.data.UNIVERSITARIO.ANO_CONCULSAO || 'Não encontrado'}\n`
    resultString += `DATA DA INCLUSÃO: ${parsedResult.data.UNIVERSITARIO.DT_INCLUSAO || 'Não encontrado'}\n`
  }
  if (parsedResult.data.MAPA_PARENTES_ANALYTICS) {
    resultString += '\nParentes\n';
    resultString += parsedResult.data.MAPA_PARENTES_ANALYTICS
      .map(address => `${address.VINCULO} ${address.CPF_VINCULO}, ${address.NOME_VINCULO}\n`)
      .join('\n');
  }

  if (parsedResult.data.IRPF) {
    resultString += '\`IRPF`:\n';
    resultString += `DOC: ${parsedResult.data.IRPF.DocNumber || 'Não encontrado'}\n`
    resultString += `INSTITUIÇÃO BANCARIA: ${parsedResult.data.IRPF.Instituicao_Bancaria || 'Não encontrado'}\n`
    resultString += `CODIGO DA AGENCIA: ${parsedResult.data.IRPF.Cod_Agencia || 'Não encontrado'}\n`
    resultString += `LOTE: ${parsedResult.data.IRPF.Lote || 'Não encontrado'}\n`
    resultString += `ANO REFERENCIA: ${parsedResult.data.IRPF.Ano_Referencia || 'Não encontrado'}\n`
    resultString += `DATA DO LOTE: ${parsedResult.data.IRPF.Dt_Lote || 'Não encontrado'}\n`
    resultString += `SITUAÇÃO RECEITA FEREDERAL: ${parsedResult.data.IRPF.Sit_Receita_Federal || 'Não encontrado'}\n`
    resultString += `DATA DA CONSULTA : ${parsedResult.data.IRPF.Dt_Consulta || 'Não encontrado'}\n`
  }
  return resultString;
}
function formatPlacaResults(data: PlacaResult[], maxResults: number): string {
  resultString = '';

  for (let i = 0; i < Math.min(data.length, maxResults); i++) {
    const result = data[i];
    resultString += `
  CPF: ${parsedResult.data.INFORMACOES_DO_VEICULO|| 'Não encontrado'}
  Tipo do veículo: ${parsedResult.data.tipo_veiculo || 'Não encontrado'}
  Tipo combustível: ${parsedResult.data.tipo_combustivel || 'Não encontrado'}
  Capacidade de passageiros: ${parsedResult.data.capac_passageiro || 'Não encontrado'}
  Número do lacre: ${parsedResult.data.numero_lacre || 'Não encontrado'}
  Ano de fabricação: ${parsedResult.data.ano_fabricacao || 'Não encontrado'}
  Renavam: ${parsedResult.data.renavam || 'Não encontrado'}
  Capacidade de carga: ${parsedResult.data.capac_carga || 'Não encontrado'}
  Marca do Modelo: ${parsedResult.data.marca_modelo || 'Não encontrado'}
  Chassi: ${parsedResult.data.chassi || 'Não encontrado'}
  Lacre: ${parsedResult.data.uf_lacre || 'Não encontrado'}
  Ano do licenciamento: ${parsedResult.data.ano_lic_corrent || 'Não encontrado'}
  Ano do modelo: ${parsedResult.data.ano_modelo || 'Não encontrado'}
  Placa: ${parsedResult.data.placa || 'Não encontrado'}
  Categoria do veículo: ${parsedResult.data.catego_veiculo || 'Não encontrado'}
  Local do veículo: ${parsedResult.data.uf_veiculo || 'Não encontrado'}
  Ano do licenciamento: ${parsedResult.data.ano_licenc || 'Não encontrado'}
  Cor do veículo: ${parsedResult.data.cor_veiculo || 'Não encontrado'}
  Espécie do veículo: ${parsedResult.data.especie_veiculo || 'Não encontrado'}
  Débito no licenciamento: ${parsedResult.data.valor_deb_licens || 'Não encontrado'}
  Restrição judicial: ${parsedResult.data.restricao_judicial || 'Não encontrado'}
  Situação: ${parsedResult.data.situacao || 'Não encontrado'}
  Valor da multa: ${parsedResult.data.valor_multa || 'Não encontrado'}
  Código de restrição: ${parsedResult.data.cod_restricao_4 || 'Não encontrado'}
  Comunicação da venda: ${parsedResult.data.comunicacao_venda || 'Não encontrado'}
  Roubo ou furto: ${parsedResult.data.roubo_furt || 'Não encontrado'}
  Data de comunicação da venda: ${parsedResult.data.data_comunic_venda || 'Não encontrado'}
  Bloqueio administrativo: ${parsedResult.data.bloqueio_administ || 'Não encontrado'}
  Débito IPVA: ${parsedResult.data.debito_ipva || 'Não encontrado'}
  Débito Seguro: ${parsedResult.data.debito_seguro || 'Não encontrado'}
  Valor do débito do Seguro: ${parsedResult.data.valor_deb_seguro || 'Não encontrado'}
  Valor DAC: ${parsedResult.data.valor_dac || 'Não encontrado'}
  Débito Licenciamento: ${parsedResult.data.debito_licens || 'Não encontrado'}
  Proprietário: ${parsedResult.data.proprietario || 'Não encontrado'}
  CPF OU CNPJ: ${parsedResult.data.cpf_cnpj || 'Não encontrado'}
  Nome: ${parsedResult.data.nome || 'Não encontrado'}
  `;
}

if (data.length > maxResults) {
  resultString += `\nExibindo apenas ${maxResults} de ${data.length} resultados.`;
}

return resultString;
}
function formatTelefoneResults(data: TelefoneResult[], maxResults: number): string {
  resultString = '';

  for (let i = 0; i < Math.min(data.length, maxResults); i++) {
    const result = data[i];
    resultString += `
    CPF: ${result.CPF || 'Não encontrado'}
    RG: ${result.RG || 'Não encontrado'}
    Nome: ${result.NOME || 'Não encontrado'}
    Nascimento: ${result.NASC || 'Não encontrado'}
    Sexo: ${result.SEXO === 'F - FEMININO' ? 'Feminino' : 'Masculino'}
    Nome da Mãe: ${result.NOME_MAE || 'Não encontrado'}
    Nome do Pai: ${result.NOME_PAI || 'Não encontrado'}
    CBO: ${result.CBO  || 'Não encontrado'}
    Lugar de Emissão: ${result.UF_EMISSAO || 'Não encontrado'}
    Título Eleitor: ${result.TITULO_ELEITOR || 'Não encontrado'}
    Renda: ${result.RENDA || 'Não encontrado'}
    Data Situação Cadastral: ${result.DT_SIT_CAD || 'Não encontrado'}
    TITULO ELEITOR: ${result.TITULO_ELEITOR || 'Não encontrado'}
    DATA INCLUSÃO: ${result.DT_INCLUSAO || 'Não encontrado'}
    `;
  }

  if (data.length > maxResults) {
    resultString += `\nExibindo apenas ${maxResults} de ${data.length} resultados.`;
  }

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

function formatNameResults(data: NomeResult[], maxResults: number): string {
  resultString = '';

  for (let i = 0; i < Math.min(data.length, maxResults); i++) {
    const result = data[i];
    resultString += `
CPF: ${result.CPF || 'Não encontrado'}
RG: ${result.RG || 'Não encontrado'}
Nome: ${result.NOME || 'Não encontrado'}
Nascimento: ${result.NASC || 'Não encontrado'}
Sexo: ${result.SEXO === 'F - FEMININO' ? 'Feminino' : 'Masculino'}
Nome da Mãe: ${result.NOME_MAE || 'Não encontrado'}
Nome da PAI: ${result.NOME_PAI || 'Não encontrado'}
LUGAR DE EMISSÃO: ${result.UF_EMISSAO || 'Não encontrado'}
TITULO ELEITOR: ${result.TITULO_ELEITOR || 'Não encontrado'}
RENDA: ${result.RENDA || 'Não encontrado'}
DATA SITUAÇÃO CADASTRAL: ${result.DT_SIT_CAD || 'Não encontrado'}
`;
  }

  if (data.length > maxResults) {
    resultString += `\nExibindo apenas ${maxResults} de ${data.length} resultados.`;
  }

  return resultString;
}


function formatMailResults(data: MailResult[]): string {
  resultString = '';

  data.forEach((result) => {
    resultString += `
CPF/CNPJ: ${result.cpf_cnpj || 'Não encontrado'}
Nome: ${result.nome || 'Não encontrado'}
Nascimento: ${result.dataNascimento || 'Não encontrado'}
Sexo: ${result.sexo === "M" ? "MASCULINO" : "FEMININO" || 'Não encontrado'}
Nome da Mãe: ${result.nomeMae || 'Não encontrado'}
`;
  });

  return resultString;
}

function formatCepResults(data: CepResult[], maxResults: number): string {
  resultString = '';

  for (let i = 0; i < Math.min(data.length, maxResults); i++) {
    const result = data[i];
    resultString += `
CPF/CNPJ: ${result.cpf_cnpj || 'Não encontrado'}
Nome: ${result.nome || 'Não encontrado'}
Nascimento: ${result.dataNascimento || 'Não encontrado'}
Sexo: ${result.sexo === "M" ? "MASCULINO" : "FEMININO" || 'Não encontrado'}
Nome da Mãe: ${result.nomeMae || 'Não encontrado'}
`;
  }

  if (data.length > maxResults) {
    resultString += `\nExibindo apenas ${maxResults} de ${data.length} resultados.`;
  }

  return resultString;
}

function formatMotherResults(data: CepResult[], maxResults: number): string {
  resultString = '';

  if (data.length > maxResults) {
    resultString += `\nExibindo apenas ${maxResults} de ${data.length} resultados.`;
  }

  for (let i = 0; i < Math.min(data.length, maxResults); i++) {
    const result = data[i];
    resultString += `
CPF/CNPJ: ${result.cpf_cnpj || 'Não encontrado'}
Nome: ${result.nome || 'Não encontrado'}
Nascimento: ${result.dataNascimento || 'Não encontrado'}
Sexo: ${result.sexo === "M" ? "MASCULINO" : "FEMININO" || 'Não encontrado'}
Nome da Mãe: ${result.nomeMae || 'Não encontrado'}
`;
  }
  return resultString;
}

resultString;
resultString = '';