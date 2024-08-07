# Usar a imagem oficial do Node.js como base
FROM node:18-alpine

# Instalar OpenSSL e outras dependências necessárias
RUN apk update && apk add --no-cache openssl libc6-compat

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar o package.json e package-lock.json (se disponível)
COPY package*.json ./

# Instalar as dependências do projeto
RUN npm install

# Copiar o restante do código da aplicação para o diretório de trabalho
COPY . .

# Construir a aplicação para produção
RUN npm run build

# Gerar o Prisma Client
RUN npx prisma generate

# Expor a porta que a aplicação vai rodar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
