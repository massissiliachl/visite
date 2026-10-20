const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const users = require("../models/users");
const Property = require("../models/Property");
const ReservationAdmin = require("../models/ReservationAdmin");

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

const sanitizeUser = (user) => ({
  id: user.id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  telephone: user.telephone,
  role: user.role,
  isActive: user.isActive,
  isOnline: !!user.isOnline,
  lastSeen: user.lastSeen
});

// REGISTER - Version corrigée
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await users.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    if (!nom || !prenom || !email) {
      return res.status(400).json({ message: "Nom, prénom et email sont obligatoires" });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const requestedRole = role || "employeur";
    const safeRole =
      requestedRole === "admin" || requestedRole === "proprietaire"
        ? "employeur"
        : requestedRole;

    const user = await users.create({
      nom,
      prenom,
      email,
      password: hashedPassword,
      telephone: telephone || null,
      role: safeRole,
      isActive: true,
      isOnline: false,
      lastSeen: null
    });

    // Ne pas renvoyer le mot de passe
    res.status(201).json(sanitizeUser(user));

  } catch (err) {
    console.error("Erreur register:", err);
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await users.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({ message: "Compte désactivé. Contactez l'administrateur." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "7d" }
    );

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    res.json({
      token,
      user: sanitizeUser(user)
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Créer un utilisateur de test
exports.createTestUser = async (req, res) => {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await users.findOne({ where: { email: "test@gmail.com" } });
    if (existingUser) {
      return res.json({ message: "L'utilisateur test existe déjà", user: existingUser });
    }

    const hashedPassword = await bcrypt.hash("123456", 10);

    const user = await users.create({
      nom: "Test",
      prenom: "User",
      email: "test@gmail.com",
      password: hashedPassword,
      telephone: "0555123456",
      role: "employeur",
      isActive: true
    });

    res.json({
      message: "Utilisateur test créé avec succès",
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Erreur création test user:", err);
    res.status(500).json({ message: err.message });
  }
};

// Récupérer tous les employeurs
exports.getEmployeurs = async (req, res) => {
  try {
    const now = Date.now();
    const employeurs = await users.findAll({
      where: { role: 'employeur' },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    const ids = employeurs.map((e) => e.id).filter(Boolean);
    const counts = {};
    const lasts = {};
    if (ids.length) {
      const rows = await ReservationAdmin.findAll({
        where: { createdById: { [Op.in]: ids } },
        attributes: ['createdById', 'createdAt', 'createdByName'],
        order: [['createdAt', 'DESC']]
      });
      for (const row of rows) {
        const id = row.createdById;
        counts[id] = (counts[id] || 0) + 1;
        if (!lasts[id]) lasts[id] = row.createdAt;
      }
    }

    const normalized = employeurs.map((emp) => {
      const lastSeenDate = emp.lastSeen ? new Date(emp.lastSeen) : null;
      const isOnlineByTime = lastSeenDate ? (now - lastSeenDate.getTime()) <= ONLINE_WINDOW_MS : false;
      return {
        ...emp.toJSON(),
        isOnline: !!emp.isOnline && isOnlineByTime,
        reservationsCount: counts[emp.id] || 0,
        lastReservationAt: lasts[emp.id] || null
      };
    });

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const allUsers = await users.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Activer/Désactiver un utilisateur
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const user = await users.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    user.isActive = isActive;
    await user.save();
    
    res.json({ 
      message: `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`,
      isActive: user.isActive 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Réinitialiser le mot de passe
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await users.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await users.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    await Property.update(
      { ownerId: null },
      { where: { ownerId: id } }
    ).catch(() => {});

    await user.destroy();
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mise à jour du profil utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, telephone, email } = req.body;
    const requester = req.user;
    const targetId = Number(id);

    if (!requester || (requester.role !== 'admin' && requester.id !== targetId)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const user = await users.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (email && email !== user.email) {
      const existing = await users.findOne({ where: { email } });
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }
    }

    user.nom = nom ?? user.nom;
    user.prenom = prenom ?? user.prenom;
    user.telephone = telephone ?? user.telephone;
    user.email = email ?? user.email;
    user.lastSeen = new Date();
    await user.save();

    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Déconnexion : marque hors ligne + met à jour lastSeen
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Token invalide" });
    }

    const user = await users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();

    res.json({ message: "Déconnexion enregistrée" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};