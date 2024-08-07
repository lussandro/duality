const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

app.use(express.json());

app.post('/login', async (req, res) => {
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).send('Nome é obrigatório');
    }

    // CPF e senha sem formatação
    const USERNAME = '01818794330';
    const PASSWORD = 'gaioso18';

    try {
        const browser = await puppeteer.launch({ headless: false }); // headless: false para manter o navegador aberto
        const page = await browser.newPage();
        await page.goto('https://siisp.ma.gov.br/SIISP/login');

        await delay(3000); // Espera 3 segundos para carregar a página

        // Função para digitar texto caractere por caractere
        async function typeText(selector, text) {
            for (const char of text) {
                await page.type(selector, char);
                await delay(2); // Espera 2ms entre cada caractere
            }
        }

        // Insere o CPF caractere por caractere
        await typeText('#cpf', USERNAME);

        // Espera 1 segundo após preencher o CPF
        await delay(1000);

        // Insere a senha caractere por caractere
        await typeText('#senha', PASSWORD);

        // Espera 1 segundo após preencher a senha
        await delay(1000);

        // Clica no botão de login
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
            await submitButton.click();
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        } else {
            console.error('Botão de submit não encontrado');
            return res.status(500).send('Botão de submit não encontrado');
        }

        await delay(3000); // Espera 3 segundos após o login

        // Clica no menu "Presos"
        const presosMenu = await page.$('#menuform\\:preso');
        if (presosMenu) {
            await presosMenu.click();
            await delay(300); // Espera 300ms após clicar no menu "Presos"
        } else {
            console.error('Menu "Presos" não encontrado');
            return res.status(500).send('Menu "Presos" não encontrado');
        }

        // Clica em "Buscar Preso"
        const buscarPresoLink = await page.$('#menuform\\:buscaPreso');
        if (buscarPresoLink) {
            await buscarPresoLink.click();
            await delay(300); // Espera 300ms após clicar em "Buscar Preso"
        } else {
            console.error('Link "Buscar Preso" não encontrado');
            return res.status(500).send('Link "Buscar Preso" não encontrado');
        }

        // Insere o nome no campo "Matrícula/Nome" e pressiona Enter
        await page.evaluate((name) => {
            const input = document.querySelector('input[placeholder="Matrícula/Nome"]');
            input.focus();
            input.value = '';
            input.value = name;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }, nome);

        await page.keyboard.press('Enter');
        await delay(300); // Espera 300ms após pressionar Enter

        // Não fecha o navegador para depuração

        res.send('Operação concluída');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
});
