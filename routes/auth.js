const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db/db');
const bcrypt = require('bcrypt'); // 🔐 Importa bcrypt
const nodemailer = require('nodemailer')

// 📧 Lista de administradores
const emailsADM = ['thiago.anunes@telefonica.com', 'admin2@teste222.com'];

// 💌 Transporter SMTP (exemplo com Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'suportesgq14@gmail.com',      // substitua
        pass: 'hboi vkrj fspm ttdq'                // senha de app, não sua senha normal
    }
});

const authController = require('../controllers/authController'); //controle de autenticação

const authResetsenha = require('../controllers/authResetsenha') //rota para resetar a senha

const rotaRedefineSenhaEX = require('../controllers/rotaRedefineSenhaEX') //rota para resetar a senha

router.post('/login', authController.login);
router.get('/logout', authController.logout);

// GET - renderiza formulário
router.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/cadastro.html'));
});

// POST - cadastra novo usuário com senha criptografada
router.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!email.endsWith('@telefonica.com')) {
        return res.redirect('/auth/cadastro?erro=email');
    }

    try {
        // 🔐 Criptografa a senha antes de salvar
        const saltRounds = 10;
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

        //CRIAR TEMPO PARA EXPIRAR A SENHA
        const MILIS_90_DIAS = 90 * 24 * 60 * 60 * 1000;
        const expiraEm = Date.now() + MILIS_90_DIAS;

        await db.query(
            'INSERT INTO usuarios (nome, email, senha, perfil, status, primeiro_login, senha_expira_em) VALUES (?, ?, ?, "USER", "AGUARDANDO", TRUE, ?)',
            [nome, email, senhaCriptografada, expiraEm]
        );

        // 💌 Enviar e-mail para ADMs
        await transporter.sendMail({
            from: '"SGQ Sistema" <suportesgq14@gmail.com>',
            to: emailsADM.join(','),
            subject: 'Novo cadastro pendente - SGQ',
            html: `
      <h3>📢 Novo cadastro aguardando aprovação</h3>
      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p>⚠️ Acesse o painel admin para aprovar ou rejeitar o usuário.</p>
      <a href="http://localhost:3000/admin/painel" target="_blank">Ir para o painel</a>
    `
        });


        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.redirect('/auth/cadastro?erro=servidor');
    }
});

// ROTAS PARA RESETAR A SENHA
router.post('/esqueci', authResetsenha.esqueciSenha);

router.get('/resetar', authResetsenha.formResetSenha);

router.post('/resetar/:token', authResetsenha.salvarNovaSenha);

//CASO SENHA EXPIAR IR PARA REDEFINIR A SENHA
router.get('/forcar-redefinir', rotaRedefineSenhaEX.forcarRedefinirSenha);
router.post('/forcar-redefinir', rotaRedefineSenhaEX.salvarNovaSenhaExpirada); // ⬅️ ESSA é a POST


module.exports = router;
