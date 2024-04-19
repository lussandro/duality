import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta property="og:title" content="Duality Buscas" />
      <meta
        property="og:description"
        content="Obtenha respostas precisas e rápidas com o nosso painel de consultas."
      />
      <meta property="og:image" content="/logo.png" />
      <meta name="theme-color" content="#0061F0" />
      <meta
        name="keywords"
        content="painel de consultas, consultar nome, consultar telefone, consultar cpf, consultar cnpj, consultar placa, consultar cep, consultar email, consultar pessoa, puxar dados, api de consultas"
      />
      <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
      <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <Head />
      <body>
        <title>Duality Buscas</title>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
