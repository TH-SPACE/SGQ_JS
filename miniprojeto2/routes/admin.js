
const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/painel', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin.html'));
});

module.exports = router;
