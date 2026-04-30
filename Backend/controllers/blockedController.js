const Blocked = require('../models/Blocked');

// GET dates bloquées
exports.getBlockedDates = async (req, res) => {
  try {
    const { nom_item } = req.params;

    const blockedDates = await Blocked.findAll({
      where: { nom_item },
      order: [['date', 'ASC']],
      attributes: ['date']
    });

    res.json(blockedDates.map(b => b.date));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération dates bloquées" });
  }
};

// BLOQUER date
exports.blockDate = async (req, res) => {
  try {
    const { nom_item, date, reason } = req.body;

    const exists = await Blocked.findOne({
      where: { nom_item, date }
    });

    if (exists) {
      return res.status(400).json({ error: "Date déjà bloquée" });
    }

    const blocked = await Blocked.create({
      nom_item,
      date,
      reason
    });

    res.status(201).json(blocked);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur blocage date" });
  }
};

// UNBLOCK date
exports.unblockDate = async (req, res) => {
  try {
    const { nom_item, date } = req.params;

    const blocked = await Blocked.findOne({
      where: { nom_item, date }
    });

    if (!blocked) {
      return res.status(404).json({ error: "Date non trouvée" });
    }

    await blocked.destroy();

    res.json({ message: "Date débloquée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur déblocage date" });
  }
};