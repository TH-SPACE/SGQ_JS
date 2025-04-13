const db = require('../db/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');


//AQUI É QUANDO ESQUECE A SENHA

exports.esqueciSenha = async (req, res) => {
    const { email } = req.body;

    try {
        // Verifica se o e-mail existe
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (usuarios.length === 0) {
            return res.redirect('/?erro=email_nao_encontrado');
        }

        // 🔐 Gera token seguro e data de expiração
        const token = crypto.randomBytes(32).toString('hex');
        const expira = Date.now() + 3600000; // 1 hora

        // 💾 Salva no banco
        await db.query('UPDATE usuarios SET reset_token=?, reset_token_expira=? WHERE email=?', [token, expira, email]);

        // 🔗 Gera o link de redefinição
        const link = `http://localhost:3000/auth/resetar?token=${token}`;

        // 📧 Envia e-mail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'suportesgq14@gmail.com',      // substitua
                pass: 'hboi vkrj fspm ttdq'                // senha de app, não sua senha normal
            }
        });

        await transporter.sendMail({
            from: '"SGQV2" <suportesgq14@gmail.com>',
            to: email,
            subject: 'Recuperação de senha - SGQ',
            html: `<p>Recebemos uma solicitação para redefinir sua senha.</p>
                    <p>Para continuar, clique no link abaixo:</p>
                    <p><a href="${link}">${link}</a></p>
                    <p>Se você não solicitou essa alteração, por favor ignore esta mensagem.</p>
                    <br>
                    <p>Atenciosamente,<br>Equipe da Qualidade</p>`
        });

        console.log('Email enviado para redefinir Senha.')

        res.redirect('/?sucesso=link_enviado');

    } catch (err) {
        console.error(err);
        console.log('Erro ao processar recuperação de senha')
        res.status(500).send('Erro ao processar recuperação de senha');
    }
};

exports.formResetSenha = async (req, res) => {
    const { token } = req.query; // <- correto para query string

    try {
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expira > ?',
            [token, Date.now()]
        );

        console.log('Token recebido:', token);
        console.log('Agora:', Date.now());

        if (usuarios.length === 0) {
            return res.send('Token inválido ou expirado');
        }

        res.sendFile(path.join(__dirname, '../views/reset.html'));
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar página de redefinição');
    }

};

exports.salvarNovaSenha = async (req, res) => {
    const { token } = req.params;
    const { senha, confirmarSenha } = req.body;

    try {
        // 1. Verifica se o token existe e ainda é válido
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expira > ?',
            [token, Date.now()]
        );

        if (usuarios.length === 0) {
            return res.send('Token inválido ou expirado');
        }

        const usuario = usuarios[0];

        // 2. Verifica se as senhas coincidem
        if (senha !== confirmarSenha) {
            return res.send('As senhas não coincidem.');
        }

        // 3. Criptografa nova senha
        const senhaCriptografada = await bcrypt.hash(senha, 10);

        // 4. Atualiza no banco e remove o token

        //coloca uma data de 90 dias para expirar
        const novaExpiracao = Date.now() + (90 * 24 * 60 * 60 * 1000);

        await db.query(
            'UPDATE usuarios SET senha = ?, reset_token = NULL, reset_token_expira = NULL, senha_expira_em = ? WHERE id = ?',
            [senhaCriptografada, novaExpiracao, usuario.id]
        );

        // 5. Redireciona para login com mensagem
        res.redirect('/?sucesso=senha_alterada');

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao redefinir senha');
    }
};