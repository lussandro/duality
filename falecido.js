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

// Rota para receber o nome
app.post('/', async (req, res) => {
    const { nome } = req.body;
    let browser;

    try {
        console.log(`Iniciando processamento para o nome: ${nome}`);
        
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

        await page.goto('https://www.falecidosnobrasil.org.br/');
        console.log('Página carregada com sucesso.');

        // Preencher o campo de nome
        await page.type('input[name="nome"]', nome);
        console.log('Campo de nome preenchido.');

        // Esperar o iframe do reCAPTCHA ser carregado
        await page.waitForSelector('iframe');

        // Obter o iframe
        const frames = await page.frames();
        const recaptchaFrame = frames.find(frame => frame.url().includes('https://www.google.com/recaptcha/'));

        if (recaptchaFrame) {
            console.log('Iframe do reCAPTCHA encontrado.');
            await verificarRecaptcha(recaptchaFrame);
        } else {
            console.log('Iframe do reCAPTCHA não encontrado.');
        }

        // Manter a página aberta para observação
        await delay(30000); // Aguarde 30 segundos para observar os dados no navegador

        res.json({ message: 'Operação concluída. Verifique a página.' });
        res.end();
    } catch (error) {
        console.log(error.message);
        res.json({ error: error.message });
        res.end();
        if (browser) await browser.close();
    }
});

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function verificarRecaptcha(iframe) {
    await delay(2000);

    // Verificar se conseguimos encontrar o checkbox do reCAPTCHA usando uma abordagem diferente
    const checkbox = await iframe.$('#recaptcha-checkbox-checkmark');
    if (checkbox) {
        await checkbox.click();
        console.log('Checkbox do reCAPTCHA clicado.');
        await delay(5000); // Aguarde um pouco mais para garantir que o captcha seja processado
    } else {
        console.log('Checkbox do reCAPTCHA não encontrado.');
    }
}

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
