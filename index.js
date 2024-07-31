const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = 3008;

app.get('/whois/:domain', (req, res) => {
  const domain = req.params.domain;

  exec(`whois ${domain}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: 'Erro ao executar o comando whois' });
    }

    if (stderr) {
      return res.status(500).json({ error: stderr });
    }

    const result = parseWhoisData(stdout);
    res.json(result);
  });
});

function parseWhoisData(data) {
  // Esta função processa os dados do whois e retorna um objeto JSON.
  const result = {};
  const lines = data.split('\n');
  
  lines.forEach(line => {
    const [key, value] = line.split(':').map(part => part.trim());
    if (key && value) {
      result[key] = value;
    }
  });

  return result;
}

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
