const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const chalk = require('chalk');

dotenv.config(); //carrega variaveis do .env

const app = express(); // Cria o servidor Express

/// Middleware para interpretar dados de formulários enviados via POST
app.use(bodyParser.urlencoded({ extended: false }));  // extended: false => usa querystring (sem objetos complexos)
app.use(bodyParser.json()); // Middleware para interpretar JSON no corpo da requisição

// Middleware para gerenciar sessões de usuário
app.use(session({
    secret: process.env.SESSION_SECRET || 'segredo123',   // Chave secreta para assinar o ID da sessão
    resave: false,                         // Não resalva a sessão se nada foi modificado
    saveUninitialized: false,              // Não cria sessão para usuários não autenticados
    cookie: { secure: false }
}));

app.set('trust proxy', true);
// 📄 Morgan customizado com log de e-mail e IP
app.use(morgan((tokens, req, res) => {
    const user = req.session?.usuario?.email || 'visitante';
    const status = tokens.status(req, res);
    const method = tokens.method(req, res);
    const url = tokens.url(req, res);
    const responseTime = tokens['response-time'](req, res);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 🌈 Cores personalizadas
    const colorStatus =
        status >= 500 ? chalk.red :
            status >= 400 ? chalk.yellow :
                status >= 300 ? chalk.cyan :
                    status >= 200 ? chalk.green :
                        chalk.white;

    return `${chalk.blue(`[${user}]`)} ${chalk.magenta(`[${ip}]`)} ${chalk.yellow(`[${method}]`)} ${url} ${colorStatus(status)} - ${responseTime} ms`;
}));


// 🔐 Middleware direto aqui
function verificaLogin(req, res, next) {
    if (!req.session.usuario) return res.redirect('/');
    next();
}
// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// 🔐 Agora protegidas diretamente
app.use('/home', verificaLogin, require('./routes/protected')); // será tratado por routes/protected.js (home do sistema, páginas internas)

//verifica rota de ADM
function verificaADM(req, res, next) {
    if (req.session.usuario?.perfil !== 'ADM') {
        return res.sendFile(path.join(__dirname, 'views', 'acesso_negado.html'));
    }
    next();
}
app.use('/admin', verificaLogin, verificaADM, require('./routes/admin'));

// Rotas
app.use('/auth', require('./routes/auth'));  //será tratado por routes/auth.js (login, logout, cadastro)

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 SGQV2 rodando em http://0.0.0.0:3000 http://localhost:${PORT}`);
});

//SÓ PARA IMPRIMIR A VERSÃO DO PROJETO	npm version major
const { version } = require('./package.json');
console.log('SGQV2 v' + version);

//Função	O que faz
//express()	Cria o app
//session()	Ativa o controle de login com sessão
//bodyParser	Lê os dados de formulários e JSON
//static()	Libera a pasta public para uso via navegador
//use('/auth', ...)	Conecta rotas de login
//use('/menu', ...)	Conecta rotas protegidas do sistema
//get('/')	Define a tela inicial (login.html)
//listen()	Inicia o servidor na porta escolhida