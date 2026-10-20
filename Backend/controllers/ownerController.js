const { Op } = require("sequelize");
const { Property, PropertyReservation, users } = require("../models");
const Blocked = require("../models/Blocked");

const sanitizeOwner = (user) => ({
  id: user.id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  telephone: user.telephone,
  role: user.role,
  isActive: user.isActive,
});

const assertOwnsProperty = async (user, propertyId) => {
  const property = await Property.findByPk(String(propertyId));
  if (!property) return { error: "Hébergement introuvable", status: 404 };
  if (user.role === "admin") return { property };
  if (user.role !== "proprietaire") {
    return { error: "Accès réservé aux propriétaires", status: 403 };
  }
  if (Number(property.ownerId) !== Number(user.id)) {
    return { error: "Cet hébergement ne vous appartient pas", status: 403 };
  }
  return { property };
};

// Admin — liste des propriétaires (+ leurs biens + nb demandes)
exports.getProprietaires = async (req, res) => {
  try {
    const list = await users.findAll({
      where: { role: "proprietaire" },
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    const withProps = await Promise.all(
      list.map(async (u) => {
        const props = await Property.findAll({
          where: { ownerId: u.id },
          attributes: [
            "id",
            "title",
            "location",
            "type",
            "price",
            "approvalStatus",
          ],
          order: [["title", "ASC"]],
        });
        const propIds = props.map((p) => p.id);
        let reservationsCount = 0;
        let pendingReservations = 0;
        if (propIds.length) {
          reservationsCount = await PropertyReservation.count({
            where: { propertyId: { [Op.in]: propIds } },
          });
          pendingReservations = await PropertyReservation.count({
            where: {
              propertyId: { [Op.in]: propIds },
              status: "en_attente",
            },
          });
        }
        return {
          ...sanitizeOwner(u),
          properties: props,
          reservationsCount,
          pendingReservations,
          pendingProperties: props.filter(
            (p) => (p.approvalStatus || "approved") === "pending"
          ).length,
        };
      })
    );

    res.json(withProps);
  } catch (err) {
    console.error("getProprietaires:", err);
    res.status(500).json({ error: err.message });
  }
};

// Admin — créer un propriétaire
exports.createProprietaire = async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");
    const { nom, prenom, email, password, telephone, propertyIds } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res
        .status(400)
        .json({ error: "Nom, prénom, email et mot de passe requis" });
    }

    const existing = await users.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Cet email est déjà utilisé" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await users.create({
      nom,
      prenom,
      email,
      password: hashed,
      telephone: telephone || null,
      role: "proprietaire",
      isActive: true,
    });

    const ids = Array.isArray(propertyIds)
      ? propertyIds.map(String).filter(Boolean)
      : [];

    if (ids.length) {
      await Property.update(
        { ownerId: user.id, approvalStatus: "approved" },
        { where: { id: { [Op.in]: ids } } }
      );
    }

    const props = await Property.findAll({
      where: { ownerId: user.id },
      attributes: ["id", "title", "location", "type", "price", "approvalStatus"],
    });

    res.status(201).json({ ...sanitizeOwner(user), properties: props });
  } catch (err) {
    console.error("createProprietaire:", err);
    res.status(500).json({ error: err.message });
  }
};

// Admin — assigner / retirer des hébergements
exports.assignProperties = async (req, res) => {
  try {
    const ownerId = Number(req.params.id);
    const user = await users.findByPk(ownerId);
    if (!user || user.role !== "proprietaire") {
      return res.status(404).json({ error: "Propriétaire introuvable" });
    }

    const ids = Array.isArray(req.body.propertyIds)
      ? req.body.propertyIds.map(String).filter(Boolean)
      : [];

    // Retirer les biens qui n'étaient plus sélectionnés
    await Property.update(
      { ownerId: null },
      { where: { ownerId } }
    );

    if (ids.length) {
      await Property.update(
        { ownerId, approvalStatus: "approved" },
        { where: { id: { [Op.in]: ids } } }
      );
    }

    const props = await Property.findAll({
      where: { ownerId },
      attributes: ["id", "title", "location", "type", "price", "approvalStatus"],
    });

    res.json({ ...sanitizeOwner(user), properties: props });
  } catch (err) {
    console.error("assignProperties:", err);
    res.status(500).json({ error: err.message });
  }
};

// Propriétaire — mes hébergements
exports.getMyProperties = async (req, res) => {
  try {
    if (req.user.role !== "proprietaire" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const where =
      req.user.role === "admin" && req.query.all === "1"
        ? {}
        : { ownerId: req.user.id };

    const props = await Property.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    res.json(props);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Propriétaire — proposer un nouvel hébergement (en attente de validation)
exports.createMyProperty = async (req, res) => {
  try {
    if (req.user.role !== "proprietaire" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const {
      title,
      location,
      description,
      longDescription,
      price,
      priceHaute,
      priceBasse,
      type,
      capacity,
      images,
      isDevis,
    } = req.body;

    if (!title || !location || !description || !type) {
      return res.status(400).json({
        error: "Titre, localisation, description et type sont requis",
      });
    }

    const priceValue = Number(price || priceHaute || 0);
    const property = await Property.create({
      title: String(title).trim(),
      location: String(location).trim(),
      description: String(description).trim(),
      longDescription: String(longDescription || description).trim(),
      price: Number.isFinite(priceValue) ? priceValue : 0,
      priceHaute: priceHaute != null ? Number(priceHaute) || null : null,
      priceBasse: priceBasse != null ? Number(priceBasse) || null : null,
      isDevis: isDevis === true || isDevis === "true" || !priceValue,
      type: String(type).trim(),
      capacity: capacity != null ? Number(capacity) || null : null,
      images: Array.isArray(images)
        ? images
        : String(images || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
      ownerId: req.user.role === "proprietaire" ? req.user.id : req.body.ownerId || req.user.id,
      approvalStatus: "pending",
      popular: false,
      rating: 0,
      ambiance: [],
      features: [],
    });

    res.status(201).json(property);
  } catch (err) {
    console.error("createMyProperty:", err);
    res.status(500).json({ error: err.message });
  }
};

// Admin — biens soumis par les propriétaires (à valider)
exports.listSubmittedProperties = async (req, res) => {
  try {
    const status = req.query.status; // pending | approved | rejected | all
    const where = {
      ownerId: { [Op.ne]: null },
    };
    if (status && status !== "all") {
      where.approvalStatus = status;
    }

    const props = await Property.findAll({
      where,
      include: [
        {
          model: users,
          as: "owner",
          attributes: ["id", "nom", "prenom", "email", "telephone"],
        },
      ],
      order: [
        ["approvalStatus", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    // Compter les réservations par bien
    const withCounts = await Promise.all(
      props.map(async (p) => {
        const plain = p.toJSON();
        const reservationsCount = await PropertyReservation.count({
          where: { propertyId: p.id },
        });
        const pendingReservations = await PropertyReservation.count({
          where: { propertyId: p.id, status: "en_attente" },
        });
        return { ...plain, reservationsCount, pendingReservations };
      })
    );

    res.json(withCounts);
  } catch (err) {
    console.error("listSubmittedProperties:", err);
    res.status(500).json({ error: err.message });
  }
};

// Admin — valider un hébergement
exports.approveProperty = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) {
      return res.status(404).json({ error: "Hébergement introuvable" });
    }
    await property.update({ approvalStatus: "approved" });
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin — refuser un hébergement (reste visible pour le proprio)
exports.rejectProperty = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) {
      return res.status(404).json({ error: "Hébergement introuvable" });
    }
    await property.update({ approvalStatus: "rejected" });
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin — supprimer un hébergement
exports.deletePropertyAsAdmin = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) {
      return res.status(404).json({ error: "Hébergement introuvable" });
    }
    const id = property.id;
    await property.destroy();
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Propriétaire — dates bloquées d'un bien
exports.getMyPropertyBlocked = async (req, res) => {
  try {
    const check = await assertOwnsProperty(req.user, req.params.propertyId);
    if (check.error) return res.status(check.status).json({ error: check.error });

    const blocked = await Blocked.findAll({
      where: {
        item_type: "property",
        item_id: String(req.params.propertyId),
      },
      order: [["date", "ASC"]],
    });
    res.json(blocked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Propriétaire — bloquer une ou plusieurs dates
exports.blockMyPropertyDates = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const check = await assertOwnsProperty(req.user, propertyId);
    if (check.error) return res.status(check.status).json({ error: check.error });

    const { dates, date, reason } = req.body;
    if ((check.property.approvalStatus || "approved") !== "approved") {
      return res.status(400).json({
        error: "Hébergement non validé : impossible de bloquer des dates",
      });
    }
    const list = Array.isArray(dates)
      ? dates
      : date
        ? [date]
        : [];

    if (!list.length) {
      return res.status(400).json({ error: "Indiquez date ou dates[]" });
    }

    const created = [];
    for (const d of list) {
      const clean = String(d).slice(0, 10);
      const exists = await Blocked.findOne({
        where: {
          item_type: "property",
          item_id: String(propertyId),
          date: clean,
        },
      });
      if (exists) continue;

      const row = await Blocked.create({
        nom_item: check.property.title,
        date: clean,
        reason: reason || "Indisponible (propriétaire)",
        item_type: "property",
        item_id: String(propertyId),
      });
      created.push(row);
    }

    res.status(201).json({ created, count: created.length });
  } catch (err) {
    console.error("blockMyPropertyDates:", err);
    res.status(500).json({ error: err.message });
  }
};

// Propriétaire — débloquer une date
exports.unblockMyPropertyDate = async (req, res) => {
  try {
    const { propertyId, date } = req.params;
    const check = await assertOwnsProperty(req.user, propertyId);
    if (check.error) return res.status(check.status).json({ error: check.error });

    const blocked = await Blocked.findOne({
      where: {
        item_type: "property",
        item_id: String(propertyId),
        date: String(date).slice(0, 10),
      },
    });

    if (!blocked) {
      return res.status(404).json({ error: "Date non trouvée" });
    }

    await blocked.destroy();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Propriétaire — réservations de ses biens
exports.getMyReservations = async (req, res) => {
  try {
    if (req.user.role !== "proprietaire" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const myProps = await Property.findAll({
      where: { ownerId: req.user.id },
      attributes: ["id"],
    });
    const ids = myProps.map((p) => p.id);
    if (!ids.length) return res.json([]);

    const reservations = await PropertyReservation.findAll({
      where: { propertyId: { [Op.in]: ids } },
      include: [{ model: Property, attributes: ["id", "title", "location"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin — réservations d'un propriétaire précis
exports.getOwnerReservations = async (req, res) => {
  try {
    const ownerId = Number(req.params.id);
    const user = await users.findByPk(ownerId);
    if (!user || user.role !== "proprietaire") {
      return res.status(404).json({ error: "Propriétaire introuvable" });
    }

    const myProps = await Property.findAll({
      where: { ownerId },
      attributes: ["id", "title"],
    });
    const ids = myProps.map((p) => p.id);
    if (!ids.length) {
      return res.json({
        owner: sanitizeOwner(user),
        properties: [],
        reservations: [],
      });
    }

    const reservations = await PropertyReservation.findAll({
      where: { propertyId: { [Op.in]: ids } },
      include: [
        {
          model: Property,
          attributes: ["id", "title", "location", "type"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      owner: sanitizeOwner(user),
      properties: myProps,
      reservations,
    });
  } catch (err) {
    console.error("getOwnerReservations:", err);
    res.status(500).json({ error: err.message });
  }
};

// Admin — synchroniser appartements / villas du site vers la BDD
exports.syncSiteProperties = async (req, res) => {
  try {
    const { seedSiteProperties } = require("../utils/seedSiteProperties");
    const result = await seedSiteProperties();
    const props = await Property.findAll({
      attributes: ["id", "title", "location", "type", "price", "ownerId"],
      order: [
        ["type", "ASC"],
        ["title", "ASC"],
      ],
    });
    res.json({ ...result, properties: props });
  } catch (err) {
    console.error("syncSiteProperties:", err);
    res.status(500).json({ error: err.message });
  }
};
