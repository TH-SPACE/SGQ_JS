const db = require('../db/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');

exports.login = async (req, res) => {
    const { email, senha } = req.body;

    try {
        // Busca apenas pelo e-mail
        const [rows] = await db.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.redirect('/?erro=1'); // Email não encontrado
        }

        const user = rows[0];

        // ✅ Compara senha digitada com hash salvo
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) {
            return res.redirect('/?erro=1'); // Senha incorreta
        }

        // Verifica status
        if (user.status !== 'ATIVO') {
            return res.redirect('/?erro=2');
        }

        const agora = Date.now();

        // Verifica expiração da senha
        if (user.senha_expira_em && user.senha_expira_em < agora) {
            // Redireciona para reset com mensagem especial
            return res.redirect('/auth/forcar-redefinir?email=' + encodeURIComponent(user.email));

        }

        // Cria sessão
        req.session.usuario = {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil
        };

        res.redirect('/home');

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no login');
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        res.redirect('/');
    });
};
