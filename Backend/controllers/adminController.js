const jwt = require("jsonwebtoken");
const { Property } = require("../models");


// ========== GESTION DES PROPRIÉTÉS (HÉBERGEMENTS) ==========

// GET tous les hébergements
const getAllProperties = async (req, res) => {
    try {
        const properties = await Property.findAll({
            order: [["createdAt", "DESC"]]
        });
        res.json(properties);
    } catch (error) {
        console.error("Erreur getAllProperties:", error);
        res.status(500).json({ error: error.message });
    }
};

// GET un hébergement par ID
const getPropertyById = async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) {
            return res.status(404).json({ error: "Hébergement non trouvé" });
        }
        res.json(property);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST créer un hébergement
const createProperty = async (req, res) => {
    try {
        const { title, location, description, price, type, images } = req.body;
        
        // Validation
        if (!title || !location || !description || !price || !type) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }
        
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({ error: "Le prix doit être un nombre positif" });
        }
        
        const property = await Property.create({
            title,
            location,
            description,
            price: parseInt(price),
            type,
            images: images || []
        });
        
        console.log(`✅ Admin a créé l'hébergement: ${title}`);
        res.status(201).json(property);
        
    } catch (error) {
        console.error("Erreur createProperty:", error);
        res.status(500).json({ error: error.message });
    }
};

// PUT modifier un hébergement
const updateProperty = async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) {
            return res.status(404).json({ error: "Hébergement non trouvé" });
        }
        
        const { title, location, description, price, type, images } = req.body;
        
        await property.update({
            title: title || property.title,
            location: location || property.location,
            description: description || property.description,
            price: price || property.price,
            type: type || property.type,
            images: images || property.images
        });
        
        console.log(`✅ Admin a modifié l'hébergement ID: ${req.params.id}`);
        res.json(property);
        
    } catch (error) {
        console.error("Erreur updateProperty:", error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE supprimer un hébergement
const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) {
            return res.status(404).json({ error: "Hébergement non trouvé" });
        }
        
        await property.destroy();
        console.log(`✅ Admin a supprimé l'hébergement ID: ${req.params.id}`);
        res.json({ message: "Hébergement supprimé avec succès" });
        
    } catch (error) {
        console.error("Erreur deleteProperty:", error);
        res.status(500).json({ error: error.message });
    }
};

// ========== EXPORT ==========
module.exports = {
  
    getAllProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty
};