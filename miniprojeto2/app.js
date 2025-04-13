
const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'segredo123',
    resave: false,
    saveUninitialized: true
}));

// Middleware de login
function verificaLogin(req, res, next) {
    if (req.session.usuario) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Rotas protegidas
app.use('/home', verificaLogin, require('./routes/home'));
app.use('/admin', verificaLogin, require('./routes/admin'));

// Página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    if (usuario === 'admin' && senha === '123') {
        req.session.usuario = { nome: 'Administrador' };
        res.redirect('/home');
    } else {
        res.send('<h3>Login inválido</h3><a href="/login">Tentar novamente</a>');
    }
});

app.get('/', (req, res) => {
    res.send('<h1>Bem-vindo</h1><a href="/login">Login</a>');
});

app.listen(3000, () => {
    console.log('🚀 Rodando em http://localhost:3000');
});
