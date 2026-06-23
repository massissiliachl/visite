const Blocked = require('../models/Blocked');

// GET dates bloquées pour une activité
exports.getBlockedDates = async (req, res) => {
  try {
    const { nom_item } = req.params;

    const blockedDates = await Blocked.findAll({
      where: { 
        nom_item: nom_item,
        item_type: 'activity' 
      },
      order: [['date', 'ASC']],
      attributes: ['date', 'reason', 'id']
    });

    res.json(blockedDates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération dates bloquées" });
  }
};

// GET dates bloquées pour un hébergement
exports.getBlockedDatesByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const blockedDates = await Blocked.findAll({
      where: { 
        item_id: propertyId,
        item_type: 'property'
      },
      order: [['date', 'ASC']],
      attributes: ['date', 'reason', 'id']
    });

    res.json(blockedDates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération dates bloquées" });
  }
};

// BLOQUER date
exports.blockDate = async (req, res) => {
  try {
    const { nom_item, date, reason, item_type, item_id } = req.body;

    if (!nom_item || !date) {
      return res.status(400).json({ error: "nom_item et date sont requis" });
    }

    // Vérifier si la date est déjà bloquée
    const whereClause = { 
      nom_item, 
      date,
      item_type: item_type || 'activity'
    };
    
    if (item_id) {
      whereClause.item_id = item_id;
    }

    const exists = await Blocked.findOne({
      where: whereClause
    });

    if (exists) {
      return res.status(400).json({ error: "Date déjà bloquée" });
    }

    const blocked = await Blocked.create({
      nom_item,
      date,
      reason: reason || 'Bloqué par admin',
      item_type: item_type || 'activity',
      item_id: item_id || null
    });

    res.status(201).json(blocked);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur blocage date" });
  }
};

// UNBLOCK date pour activité
exports.unblockDate = async (req, res) => {
  try {
    const { nom_item, date } = req.params;

    const blocked = await Blocked.findOne({
      where: { 
        nom_item, 
        date,
        item_type: 'activity'
      }
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

// UNBLOCK date pour hébergement
exports.unblockPropertyDate = async (req, res) => {
  try {
    const { propertyId, date } = req.params;

    const blocked = await Blocked.findOne({
      where: { 
        item_id: propertyId,
        item_type: 'property',
        date: date
      }
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