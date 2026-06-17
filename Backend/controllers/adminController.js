const { Property } = require("../models");


// ========== GESTION DES PROPRIÉTÉS (HÉBERGEMENTS) ==========
const pickFirstDefined = (...values) => values.find((value) => value !== undefined);

const normalizePropertyPayload = (payload = {}) => ({
    title: pickFirstDefined(payload.title, payload.nom, payload.name),
    location: pickFirstDefined(payload.location, payload.localisation, payload.address),
    description: pickFirstDefined(payload.description, payload.shortDescription, payload.resume),
    longDescription: pickFirstDefined(
        payload.longDescription,
        payload.long_description,
        payload.longDesc,
        payload.descriptionLongue
    ),
    price: pickFirstDefined(payload.price, payload.prix, payload.tarif),
    type: pickFirstDefined(payload.type, payload.category, payload.categorie),
    images: pickFirstDefined(payload.images, payload.photos, payload.gallery),
    priceHaute: pickFirstDefined(
        payload.priceHaute,
        payload.price_haute,
        payload.prixHaute,
        payload.highSeasonPrice
    ),
    priceBasse: pickFirstDefined(
        payload.priceBasse,
        payload.price_basse,
        payload.prixBasse,
        payload.lowSeasonPrice
    ),
    isDevis: pickFirstDefined(payload.isDevis, payload.is_devis, payload.devis),
    capacity: pickFirstDefined(payload.capacity, payload.capacite, payload.maxPeople),
    rating: pickFirstDefined(payload.rating, payload.note),
    popular: pickFirstDefined(payload.popular, payload.isPopular, payload.top),
    ambiance: pickFirstDefined(payload.ambiance, payload.ambiances),
    features: pickFirstDefined(payload.features, payload.equipements, payload.amenities)
});

const parseNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseBoolean = (value) => {
    return value === true || value === 'true' || value === 1 || value === '1';
};

const parseArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return value.split(',').map((item) => item.trim()).filter(Boolean);
        }
    }
    return [];
};

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
        const payload = normalizePropertyPayload(req.body);
        const {
            title,
            location,
            description,
            longDescription,
            price,
            type,
            images,
            priceHaute,
            priceBasse,
            isDevis,
            capacity,
            rating,
            popular,
            ambiance,
            features
        } = payload;
        
        // Validation
        if (!title || !location || !description || !price || !type) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }
        
        const priceValue = parseNumber(price);
        if (priceValue === null || priceValue <= 0) {
            return res.status(400).json({ error: "Le prix doit être un nombre positif" });
        }
        
        const property = await Property.create({
            title,
            location,
            description,
            longDescription: longDescription || description,
            price: priceValue,
            type,
            images: parseArray(images),
            priceHaute: parseNumber(priceHaute),
            priceBasse: parseNumber(priceBasse),
            isDevis: parseBoolean(isDevis),
            capacity: parseNumber(capacity),
            rating: parseNumber(rating),
            popular: parseBoolean(popular),
            ambiance: parseArray(ambiance),
            features: parseArray(features)
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
        
        const payload = normalizePropertyPayload(req.body);
        const {
            title,
            location,
            description,
            longDescription,
            price,
            type,
            images,
            priceHaute,
            priceBasse,
            isDevis,
            capacity,
            rating,
            popular,
            ambiance,
            features
        } = payload;

        await property.update({
            title: title || property.title,
            location: location || property.location,
            description: description || property.description,
            longDescription: longDescription || property.longDescription,
            price: price !== undefined && price !== null ? parseNumber(price) : property.price,
            type: type || property.type,
            images: images !== undefined ? parseArray(images) : property.images,
            priceHaute: priceHaute !== undefined ? parseNumber(priceHaute) : property.priceHaute,
            priceBasse: priceBasse !== undefined ? parseNumber(priceBasse) : property.priceBasse,
            isDevis: isDevis !== undefined ? parseBoolean(isDevis) : property.isDevis,
            capacity: capacity !== undefined ? parseNumber(capacity) : property.capacity,
            rating: rating !== undefined ? parseNumber(rating) : property.rating,
            popular: popular !== undefined ? parseBoolean(popular) : property.popular,
            ambiance: ambiance !== undefined ? parseArray(ambiance) : property.ambiance,
            features: features !== undefined ? parseArray(features) : property.features
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