const { Op } = require('sequelize');
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
        item_id: String(propertyId),
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

// GET tous les blocages (admin) — ?type=activity|property&from=YYYY-MM-DD
exports.listBlocked = async (req, res) => {
  try {
    const where = {};
    if (req.query.type === 'activity' || req.query.type === 'property') where.item_type = req.query.type;
    if (req.query.from) where.date = { [Op.gte]: req.query.from };
    const rows = await Blocked.findAll({ where, order: [['date', 'ASC']] });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération des blocages" });
  }
};

// DELETE un blocage par id
exports.deleteBlocked = async (req, res) => {
  try {
    if (!/^\d+$/.test(String(req.params.id))) {
      return res.status(400).json({ error: "Identifiant invalide" });
    }
    const n = await Blocked.destroy({ where: { id: req.params.id } });
    if (!n) return res.status(404).json({ error: "Blocage introuvable" });
    res.json({ message: "Date débloquée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur déblocage date" });
  }
};

function daysBetween(from, to) {
  const out = [];
  const d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (d <= end && out.length <= 366) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// BLOQUER date (ou période si date_end est fourni)
exports.blockDate = async (req, res) => {
  try {
    const { nom_item, date, date_end, reason, item_type, item_id } = req.body;

    if (!nom_item || !date) {
      return res.status(400).json({ error: "nom_item et date sont requis" });
    }

    if (date_end && date_end !== date) {
      if (date_end < date) {
        return res.status(400).json({ error: "La date de fin doit être après la date de début" });
      }
      const days = daysBetween(date, date_end);
      if (days.length > 366) {
        return res.status(400).json({ error: "Période trop longue (366 jours maximum)" });
      }
      const type = item_type || 'activity';
      const where = { item_type: type, date: days };
      if (type === 'property') where.item_id = String(item_id);
      else where.nom_item = nom_item;
      const existing = new Set((await Blocked.findAll({ where, attributes: ['date'] })).map((b) => b.date));
      const toCreate = days.filter((d) => !existing.has(d)).map((d) => ({
        nom_item,
        date: d,
        reason: reason || 'Bloqué par admin',
        item_type: type,
        item_id: item_id != null ? String(item_id) : null
      }));
      const created = toCreate.length ? await Blocked.bulkCreate(toCreate) : [];
      return res.status(201).json({ created: created.length, skipped: days.length - created.length, data: created });
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
      item_id: item_id != null ? String(item_id) : null
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
        item_id: String(propertyId),
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