const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

router.get('/usuario', (req, res) => {
    res.json({
        nome: req.session.usuario.nome,
        perfil: req.session.usuario.perfil
    });
});

module.exports = router;
