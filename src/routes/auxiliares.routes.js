import express from 'express';
const router = express.Router();

router.get('/roles', (req, res) => res.status(200).json(["Top", "Jungle", "Mid", "ADC", "Support"]));
router.get('/estados', (req, res) => res.status(200).json(["activo", "inactivo"]));
router.get('/tipos-roster', (req, res) => res.status(200).json(["Principal", "Academy"]));

export default router;