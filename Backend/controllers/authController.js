const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const users = require("../models/users");

// REGISTER - Version corrigée
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await users.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    // Vérifier que le mot de passe est présent
    if (!password) {
      return res.status(400).json({ message: "Le mot de passe est requis" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await users.create({
      nom,
      prenom,
      email,
      password: hashedPassword,
      telephone: telephone || null,
      role: role || 'employeur',
      isActive: true
    });

    // Ne pas renvoyer le mot de passe
    res.status(201).json({
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      isActive: user.isActive
    });

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

    res.json({
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        isActive: user.isActive
      }
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
    const employeurs = await users.findAll({
      where: { role: 'employeur' },
      attributes: { exclude: ['password'] }
    });
    res.json(employeurs);
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
    
    await user.destroy();
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};