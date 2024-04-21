const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Função para gerar uma chave JWT
// Função para gerar uma chave JWT
function generateJWT(data, expiresIn = '30d') {
  const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

  if (!JWT_SECRET_KEY) {
    throw new Error('JWT_SECRET_KEY não foi definida no arquivo .env');
  }

  // Gera o token JWT
  const token = jwt.sign(data, JWT_SECRET_KEY, { expiresIn });

  // Retorna os primeiros 36 caracteres do token
  return token.substring(0, 36);
}



// Exemplo de uso
const token = generateJWT({ username: 'teste' });
console.log('Token JWT:', token);
