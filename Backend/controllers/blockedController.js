// controllers/blockedController.js
const Blocked = require('../models/Blocked');

// Récupérer toutes les dates bloquées pour une activité
exports.getBlockedDates = async (req, res) => {
  const { nom_item } = req.params;
  try {
    const blockedDates = await Blocked.findAll({
      where: { nom_item },
      order: [['date', 'ASC']],
      attributes: ['date']
    });
    // Retourner uniquement un tableau de dates
    res.json(blockedDates.map(b => b.date));
  } catch (err) {
    console.error("getBlockedDates error:", err);
    res.status(500).json({ error: "Erreur récupération dates bloquées" });
  }
};

// Bloquer une date
exports.blockDate = async (req, res) => {
  const { nom_item, date, reason } = req.body;
  try {
    // Vérifier si la date est déjà bloquée
    const exists = await Blocked.findOne({ where: { nom_item, date } });
    if (exists) return res.status(400).json({ error: "Date déjà bloquée" });

    const blocked = await Blocked.create({ nom_item, date, reason });
    res.status(201).json(blocked);
  } catch (err) {
    console.error("blockDate error:", err);
    res.status(500).json({ error: "Erreur blocage date" });
  }
};

// Débloquer une date
exports.unblockDate = async (req, res) => {
  const { nom_item, date } = req.params;
  try {
    const blocked = await Blocked.findOne({ where: { nom_item, date } });
    if (!blocked) return res.status(404).json({ error: "Date non trouvée" });

    await blocked.destroy();
    res.json({ message: "Date débloquée avec succès" });
  } catch (err) {
    console.error("unblockDate error:", err);
    res.status(500).json({ error: "Erreur déblocage date" });
  }
};
