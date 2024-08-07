const express = require('express');
const puppeteer = require('puppeteer');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para fazer o parsing do JSON no corpo da requisição
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP
    message: 'Muitas requisições vindas deste IP, por favor tente novamente mais tarde.'
});

app.use(limiter);

// Rota para receber os dados do CPF e data de nascimento
app.post('/', async (req, res) => {
    const { cpf, dataNascimento } = req.body;
    let browser;

    try {
        console.log(`Iniciando processamento para CPF: ${cpf} e Data de Nascimento: ${dataNascimento}`);
        
        browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--window-size=1920,1080',
            ]
        });

        const page = await browser.newPage();
        console.log('Navegador iniciado com sucesso.');

        await page.goto('https://servicos.receita.fazenda.gov.br/Servicos/CPF/ConsultaSituacao/ConsultaPublica.asp');
        console.log('Página carregada com sucesso.');

        // Preencher os campos do formulário
        await page.type('#txtCPF', cpf);
        await page.type('#txtDataNascimento', dataNascimento);
        await delay(3000); // Aguarde 3 segundos para garantir que os campos estejam carregados

        console.log('Campos do formulário preenchidos.');

        // Esperar o iframe do captcha ser carregado
        await page.waitForSelector('iframe');

        // Obter o iframe
        const frames = await page.frames();
        const captchaFrame = frames.find(frame => frame.url().includes('https://newassets.hcaptcha.com/captcha/v1/'));

        if (captchaFrame) {
            console.log('Iframe do captcha encontrado.');
            await verificarCampoHCaptcha(captchaFrame);
        } else {
            console.log('Iframe do captcha não encontrado.');
        }

        // Clique no botão "Consultar"
        await page.click('#id_submit');
        console.log('Botão "Consultar" clicado.');

        // Aguardar a resposta e pegar o resultado
        await page.waitForNavigation();
        console.log('Navegação concluída após clicar no botão "Consultar".');

        // Manter a página aberta por mais alguns segundos para observação
        await delay(10000); // Aguarde 10 segundos para observar os dados no navegador

        const dadosCPF = await page.evaluate(() => {
            const spans = document.querySelectorAll('span.clConteudoDados');
            return {
                cpf: spans[0]?.querySelector('b')?.innerText.trim() || null,
                nome: spans[1]?.querySelector('b')?.innerText.trim() || null,
                dataNascimento: spans[2]?.querySelector('b')?.innerText.trim() || null,
                situacaoCadastral: spans[3]?.querySelector('b')?.innerText.trim() || null,
                dataInscricao: spans[4]?.querySelector('b')?.innerText.trim() || null,
                digitoVerificador: spans[5]?.querySelector('b')?.innerText.trim() || null,
            };
        });

        console.log(dadosCPF);

        res.json(dadosCPF);
        res.end();

        await browser.close();
    } catch (error) {
        console.log(error.message);
        res.json({ token: null });
        res.end();
        if (browser) await browser.close();
    }
});

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function verificarCampoHCaptcha(iframe) {
    // Aguarde 3 segundos antes de verificar o captcha
    await delay(3000);

    try {
        // Esperar pelo checkbox do captcha
        await iframe.waitForSelector('div[role="checkbox"][aria-checked="false"]');
        const checkbox = await iframe.$('div[role="checkbox"][aria-checked="false"]');
        if (checkbox) {
            await checkbox.click();
            console.log('Checkbox do captcha clicado.');
            await delay(5000); // Aguarde um pouco mais para garantir que o captcha seja processado
        } else {
            console.log('Checkbox do captcha não encontrado.');
        }
    } catch (error) {
        console.log('Erro ao tentar encontrar ou clicar no checkbox do captcha:', error);
    }
}

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
