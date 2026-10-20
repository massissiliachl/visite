const { Activity } = require("../models");

const parseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const parseOptions = (value) => {
  const arr = parseArray(value);
  return arr
    .map((item) => {
      if (typeof item === "string") {
        const [label, price] = item.split("|").map((s) => s.trim());
        return { label, price: Number(price) || 0 };
      }
      return {
        label: item.label || item.name || "",
        price: Number(item.price) || 0,
      };
    })
    .filter((o) => o.label);
};

const parseBoolean = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

const slugify = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || `act-${Date.now()}`;

const serializeBasePrice = (raw) => {
  const str = String(raw ?? "0").trim();
  if (/^\d+$/.test(str)) return Number(str);
  return str;
};

const toPublic = (row) => {
  const plain = typeof row.toJSON === "function" ? row.toJSON() : row;
  return {
    id: plain.slug,
    slug: plain.slug,
    name: plain.name,
    basePrice: serializeBasePrice(plain.basePrice),
    category: plain.category,
    icon: plain.icon,
    image: plain.image,
    desc: plain.description || plain.desc || "",
    hasChild: !!plain.hasChild,
    childPrice: Number(plain.childPrice) || 0,
    activityNote: Array.isArray(plain.activityNote) ? plain.activityNote : [],
    options: Array.isArray(plain.options) ? plain.options : [],
    published: !!plain.published,
    sortOrder: Number(plain.sortOrder) || 0,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

const normalizePayload = (body = {}, { isUpdate = false } = {}) => {
  const name = (body.name || body.titre || "").trim();
  const slugRaw = (body.slug || body.id || "").trim();
  const slug = slugRaw || (name ? slugify(name) : "");

  const payload = {
    name,
    basePrice: String(
      body.basePrice ?? body.prix ?? body.price ?? "0"
    ).trim(),
    category: (body.category || body.categorie || "mer").trim(),
    icon: (body.icon || "fa-star").trim().replace(/^fas\s+/, ""),
    image: (body.image || body.photo || "assets/images/all.jpg").trim(),
    description: (body.desc || body.description || "").trim(),
    hasChild: parseBoolean(body.hasChild),
    childPrice: Number(body.childPrice) || 0,
    activityNote: parseArray(body.activityNote || body.notes),
    options: parseOptions(body.options),
    published: parseBoolean(body.published),
    sortOrder: Number(body.sortOrder ?? body.ordre ?? 0) || 0,
  };

  if (!isUpdate || slugRaw) {
    payload.slug = slug;
  }

  return payload;
};

// GET public — activités publiées (site)
const getPublishedActivities = async (req, res) => {
  try {
    const activities = await Activity.findAll({
      where: { published: true },
      order: [
        ["sortOrder", "ASC"],
        ["name", "ASC"],
      ],
    });
    res.json(activities.map(toPublic));
  } catch (error) {
    console.error("getPublishedActivities:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET admin — toutes
const getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.findAll({
      order: [
        ["sortOrder", "ASC"],
        ["updatedAt", "DESC"],
      ],
    });
    res.json(activities.map(toPublic));
  } catch (error) {
    console.error("getAllActivities:", error);
    res.status(500).json({ error: error.message });
  }
};

const getActivityBySlug = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.slug);
    if (!activity) {
      return res.status(404).json({ error: "Activité introuvable" });
    }
    res.json(toPublic(activity));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createActivity = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    if (!payload.name || !payload.slug || !payload.description) {
      return res
        .status(400)
        .json({ error: "Nom, slug et description sont requis" });
    }
    if (!["mer", "terre", "culture"].includes(payload.category)) {
      return res
        .status(400)
        .json({ error: "Catégorie invalide (mer, terre, culture)" });
    }

    const exists = await Activity.findByPk(payload.slug);
    if (exists) {
      return res.status(409).json({ error: "Ce slug existe déjà" });
    }

    const activity = await Activity.create(payload);
    res.status(201).json(toPublic(activity));
  } catch (error) {
    console.error("createActivity:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.slug);
    if (!activity) {
      return res.status(404).json({ error: "Activité introuvable" });
    }

    const payload = normalizePayload(req.body, { isUpdate: true });
    delete payload.slug;

    if (payload.category && !["mer", "terre", "culture"].includes(payload.category)) {
      return res
        .status(400)
        .json({ error: "Catégorie invalide (mer, terre, culture)" });
    }

    await activity.update(payload);
    res.json(toPublic(activity));
  } catch (error) {
    console.error("updateActivity:", error);
    res.status(500).json({ error: error.message });
  }
};

const togglePublish = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.slug);
    if (!activity) {
      return res.status(404).json({ error: "Activité introuvable" });
    }
    const published =
      req.body.published !== undefined
        ? parseBoolean(req.body.published)
        : !activity.published;
    await activity.update({ published });
    res.json(toPublic(activity));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.slug);
    if (!activity) {
      return res.status(404).json({ error: "Activité introuvable" });
    }
    await activity.destroy();
    res.json({ ok: true, slug: req.params.slug });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPublishedActivities,
  getAllActivities,
  getActivityBySlug,
  createActivity,
  updateActivity,
  togglePublish,
  deleteActivity,
  toPublic,
};
