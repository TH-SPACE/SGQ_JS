const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db/db');
const { route } = require('./protected');
const { triggerAsyncId } = require('async_hooks');
const bcrypt = require('bcrypt'); // 🔐 Importa bcrypt

// 📄 Página principal do painel administrativo
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin_panel.html'));
});

// 🔍 Lista todos os usuários (API)
router.get('/usuarios', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nome, email, perfil, status FROM usuarios');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar usuários' });
    }
});

/// ✏️ Edita um usuário
router.post('/editar/:id', async (req, res) => {
    const { nome, email, senha, perfil, status } = req.body;
    const { id } = req.params;

    try {
        let query = '';
        let params = [];

        if (senha && senha.trim() !== '') {
            // 🔐 Se senha for preenchida, criptografa e atualiza
            const senhaCriptografada = await bcrypt.hash(senha, 10);
            query = 'UPDATE usuarios SET nome=?, email=?, senha=?, perfil=?, status=? WHERE id=?';
            params = [nome, email, senhaCriptografada, perfil, status, id];
        } else {
            // 🔐 Se não foi preenchida, mantém a senha antiga
            query = 'UPDATE usuarios SET nome=?, email=?, perfil=?, status=? WHERE id=?';
            params = [nome, email, perfil, status, id];
        }

        await db.query(query, params);
        res.redirect('/admin/painel');

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao editar usuário');
    }
});

// ✏️ Edita um usuário
router.post('/editar/:id', async (req, res) => {
    const { nome, email, senha, perfil, status } = req.body;
    const { id } = req.params;
    try {
        await db.query(
            'UPDATE usuarios SET nome=?, email=?, senha=?, perfil=?, status=? WHERE id=?',
            [nome, email, senha, perfil, status, id]
        );
        res.redirect('/admin/painel');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao editar usuário');
    }
});

// ❌ Exclui usuário
router.post('/excluir/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.redirect('/admin/painel');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao excluir usuário');
    }
});

// ✅ Aprova usuário (ativa conta)
router.post('/aprovar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE usuarios SET status = "ATIVO" WHERE id = ?', [id]);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao aprovar usuário!');
    }
});

// DESATIVAR USUÁRIO
router.post('/desativar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE usuarios SET status = "INATIVO" WHERE id = ?', [id]);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao desativar o usuário!')
    }

})

module.exports = router;
