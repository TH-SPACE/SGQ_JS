const db = require('../db/db');
const bcrypt = require('bcrypt');
const path = require('path');

exports.forcarRedefinirSenha = (req, res) => {
    const { email } = req.query;
    if (!email) return res.redirect('/');

    res.sendFile(path.join(__dirname, '../views/reset_manual.html'));
};

exports.salvarNovaSenhaExpirada = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).send('Dados incompletos.');
    }

    try {
        const senhaCriptografada = await bcrypt.hash(senha, 10);
        const novaExpiracao = Date.now() + (90 * 24 * 60 * 60 * 1000); // 90 dias
        await db.query(
            'UPDATE usuarios SET senha = ?, senha_expira_em = ? WHERE email = ?',
            [senhaCriptografada, novaExpiracao, email]
        );
        console.log(novaExpiracao);
        return res.redirect('/?sucesso=senha_redefinida');


    } catch (err) {
        console.error(err);
        return res.status(500).send('Erro ao redefinir senha.');
    }
};