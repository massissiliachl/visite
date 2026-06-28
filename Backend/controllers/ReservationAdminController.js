// controllers/ReservationAdminController.js
const { ReservationAdmin } = require("../models");

// ============================================================
// FONCTIONS UTILITAIRES DE NORMALISATION
// ============================================================

/**
 * Normalise les noms de champs pour gérer camelCase, snake_case, minuscules
 */
function normalizeField(obj, ...fieldNames) {
    if (!obj || typeof obj !== 'object') return { value: undefined, key: null };
    
    for (const field of fieldNames) {
        // Génère toutes les variantes possibles du nom de champ
        const variants = [
            field, // original
            field.toLowerCase(), // minuscules
            field.toUpperCase(), // majuscules
            field.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''), // snake_case
            field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()), // camelCase depuis snake_case
            field.replace(/^_/, ''), // enlever underscore au début
        ];
        
        // Enlève les doublons
        const uniqueVariants = [...new Set(variants)];
        
        for (const variant of uniqueVariants) {
            if (obj[variant] !== undefined && obj[variant] !== null) {
                return { value: obj[variant], key: variant };
            }
        }
    }
    return { value: undefined, key: null };
}

/**
 * Récupère une valeur numérique depuis l'objet
 */
function getNumericValue(obj, ...fieldNames) {
    const result = normalizeField(obj, ...fieldNames);
    if (result.value === undefined || result.value === null || result.value === '') return 0;
    const num = parseFloat(String(result.value).replace(/,/g, '.'));
    return isNaN(num) ? 0 : num;
}

/**
 * Récupère une valeur string depuis l'objet
 */
function getStringValue(obj, ...fieldNames) {
    const result = normalizeField(obj, ...fieldNames);
    return result.value !== undefined && result.value !== null ? String(result.value) : '';
}

/**
 * Récupère une valeur entière depuis l'objet
 */
function getIntValue(obj, ...fieldNames) {
    const result = normalizeField(obj, ...fieldNames);
    if (result.value === undefined || result.value === null || result.value === '') return 0;
    const num = parseInt(String(result.value));
    return isNaN(num) ? 0 : num;
}

// ============================================================
// FONCTIONS DE FORMATAGE ET VALIDATION
// ============================================================

/**
 * Formate une réservation pour l'API
 */
function formatReservation(row) {
    if (!row) return null;
    
    const data = row?.toJSON ? row.toJSON() : { ...row };
    
    // Récupération des valeurs avec fallback
    const total = getNumericValue(data, 'totalAPayer', 'totalapayer', 'total_a_payer', 'total_a_payer');
    const versement = getNumericValue(data, 'versement', 'versement');
    const reste = getNumericValue(data, 'resteAPayer', 'resteapayer', 'reste_a_payer');
    
    // Calcul du reste si non fourni
    const resteFinal = reste > 0 ? reste : Math.max(0, total - versement);
    
    // Détermination du statut de paiement
    const paymentStatus = derivePaymentStatus(total, versement, resteFinal);
    
    return {
        ...data,
        id: data.id || data.ID || null,
        nom: getStringValue(data, 'nom', 'nom'),
        prenom: getStringValue(data, 'prenom', 'prenom'),
        tel: getStringValue(data, 'tel', 'telephone', 'phone', 'telephone'),
        activite: getStringValue(data, 'activite', 'activite') || 'Bateau',
        heure: getStringValue(data, 'heure', 'heure'),
        date: getStringValue(data, 'date', 'date'),
        personnes: getIntValue(data, 'personnes', 'personnes') || 1,
        slot: getStringValue(data, 'slot', 'slot'),
        subslot: getStringValue(data, 'subslot', 'subslot'),
        bateau: getStringValue(data, 'bateau', 'bateau'),
        duree: getStringValue(data, 'duree', 'duree'),
        totalAPayer: total,
        versement: versement,
        resteAPayer: resteFinal,
        note: getStringValue(data, 'note', 'note') || "Aucune note",
        paymentStatus: paymentStatus,
        createdAt: data.createdAt || data.created_at || null,
        updatedAt: data.updatedAt || data.updated_at || null
    };
}

/**
 * Construit le payload pour la création/mise à jour
 */
function buildPayload(body) {
    if (!body) return {};
    
    console.log('🔨 Construction du payload à partir de:', JSON.stringify(body, null, 2));
    
    // Récupération des valeurs depuis le body avec tous les cas possibles
    const totalAPayer = getNumericValue(body, 'totalAPayer', 'totalapayer', 'total_a_payer', 'totalAPayer');
    const versement = getNumericValue(body, 'versement', 'versement');
    const resteAPayer = getNumericValue(body, 'resteAPayer', 'resteapayer', 'reste_a_payer');
    
    const resteFinal = resteAPayer > 0 ? resteAPayer : Math.max(0, totalAPayer - versement);
    
    const payload = {
        nom: getStringValue(body, 'nom', 'nom'),
        prenom: getStringValue(body, 'prenom', 'prenom'),
        tel: getStringValue(body, 'tel', 'telephone', 'phone') || null,
        activite: getStringValue(body, 'activite', 'activite') || 'Bateau',
        heure: getStringValue(body, 'heure', 'heure') || null,
        date: getStringValue(body, 'date', 'date'),
        personnes: getIntValue(body, 'personnes', 'personnes') || 1,
        slot: getStringValue(body, 'slot', 'slot') || null,
        subslot: getStringValue(body, 'subslot', 'subslot') || null,
        bateau: getStringValue(body, 'bateau', 'bateau') || null,
        duree: getStringValue(body, 'duree', 'duree') || null,
        totalAPayer: totalAPayer,
        versement: versement,
        resteAPayer: resteFinal,
        note: getStringValue(body, 'note', 'note') || "Aucune note"
    };
    
    // Ajout des champs optionnels s'ils existent
    if (body.id || body.ID) {
        payload.id = body.id || body.ID;
    }
    
    console.log('📦 Payload construit:', JSON.stringify(payload, null, 2));
    
    return payload;
}

/**
 * Valide les données de paiement
 */
function validatePayment(payload) {
    const total = parseFloat(payload.totalAPayer) || 0;
    const vers = parseFloat(payload.versement) || 0;
    
    // Validation du nom
    if (!payload.nom || payload.nom.trim() === '') {
        return "Le nom est obligatoire";
    }
    
    // Validation du prénom
    if (!payload.prenom || payload.prenom.trim() === '') {
        return "Le prénom est obligatoire";
    }
    
    // Validation de la date
    if (!payload.date) {
        return "La date est obligatoire";
    }
    
    // Validation du total
    if (total <= 0) {
        return "Le total à payer doit être supérieur à 0 DA";
    }
    
    // Validation du versement
    if (vers > total) {
        return "Le versement ne peut pas dépasser le total à payer";
    }
    
    if (vers < 0) {
        return "Le versement ne peut pas être négatif";
    }
    
    return null;
}

/**
 * Détermine le statut de paiement
 */
function derivePaymentStatus(total, versement, reste) {
    const t = parseFloat(total) || 0;
    const v = parseFloat(versement) || 0;
    const r = reste != null ? (parseFloat(reste) || 0) : Math.max(0, t - v);
    
    if (t > 0 && (v >= t || r <= 0)) return 'paye';
    if (v > 0) return 'verse';
    return 'non_paye';
}

// ============================================================
// CONTROLEURS CRUD
// ============================================================

/**
 * CREATE - Créer une nouvelle réservation
 */
exports.createReservationAdmin = async (req, res) => {
    try {
        console.log('📥 [CREATE] Body reçu:', JSON.stringify(req.body, null, 2));
        console.log('📥 [CREATE] Headers:', req.headers);
        
        const payload = buildPayload(req.body);
        
        const paymentError = validatePayment(payload);
        if (paymentError) {
            console.log('❌ [CREATE] Erreur validation:', paymentError);
            return res.status(400).json({ 
                message: paymentError,
                received: req.body 
            });
        }

        console.log('✅ [CREATE] Payload validé, création en cours...');
        
        const reservation = await ReservationAdmin.create(payload);
        
        console.log('✅ [CREATE] Réservation créée avec succès, ID:', reservation.id);
        console.log('📄 [CREATE] Données:', JSON.stringify(reservation, null, 2));
        
        const formatted = formatReservation(reservation);
        console.log('📤 [CREATE] Réponse formatée:', JSON.stringify(formatted, null, 2));
        
        res.status(201).json(formatted);
    } catch (error) {
        console.error('❌ [CREATE] Erreur:', error);
        console.error('📄 [CREATE] Stack:', error.stack);
        
        // Gestion des erreurs Sequelize
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: "Erreur de validation des données",
                errors: error.errors.map(e => e.message)
            });
        }
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                message: "Une réservation avec ces données existe déjà",
                errors: error.errors.map(e => e.message)
            });
        }
        
        res.status(500).json({
            message: "Erreur lors de la création de la réservation",
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * READ ALL - Récupérer toutes les réservations
 */
exports.getReservationsAdmin = async (req, res) => {
    try {
        console.log('📥 [GET ALL] Récupération des réservations...');
        
        const reservations = await ReservationAdmin.findAll({
            order: [["date", "ASC"], ["heure", "ASC"]]
        });
        
        console.log(`✅ [GET ALL] ${reservations.length} réservations récupérées`);
        
        const formatted = reservations.map(formatReservation);
        res.json(formatted);
    } catch (error) {
        console.error('❌ [GET ALL] Erreur:', error);
        res.status(500).json({
            message: "Erreur lors de la récupération des réservations",
            error: error.message
        });
    }
};

/**
 * READ ONE - Récupérer une réservation par ID
 */
exports.getReservationAdminById = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`📥 [GET ONE] Récupération de la réservation ID: ${id}`);
        
        const reservation = await ReservationAdmin.findByPk(id);
        
        if (!reservation) {
            console.log(`❌ [GET ONE] Réservation ID ${id} non trouvée`);
            return res.status(404).json({ 
                message: "Réservation non trouvée",
                id: id 
            });
        }
        
        console.log(`✅ [GET ONE] Réservation ID ${id} récupérée`);
        res.json(formatReservation(reservation));
    } catch (error) {
        console.error('❌ [GET ONE] Erreur:', error);
        res.status(500).json({
            message: "Erreur lors de la récupération de la réservation",
            error: error.message
        });
    }
};

/**
 * UPDATE - Mettre à jour une réservation
 */
exports.updateReservationAdmin = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`📥 [UPDATE] Mise à jour de la réservation ID: ${id}`);
        console.log('📥 [UPDATE] Body reçu:', JSON.stringify(req.body, null, 2));
        
        const reservation = await ReservationAdmin.findByPk(id);
        
        if (!reservation) {
            console.log(`❌ [UPDATE] Réservation ID ${id} non trouvée`);
            return res.status(404).json({ 
                message: "Réservation non trouvée",
                id: id 
            });
        }

        // Fusion des données existantes avec les nouvelles
        const existingData = reservation.toJSON();
        const mergedData = { ...existingData, ...req.body };
        
        // Construire le payload avec les données fusionnées
        const payload = buildPayload(mergedData);
        
        // Valider le paiement
        const paymentError = validatePayment(payload);
        if (paymentError) {
            console.log('❌ [UPDATE] Erreur validation:', paymentError);
            return res.status(400).json({ 
                message: paymentError,
                received: req.body 
            });
        }

        console.log('✅ [UPDATE] Payload validé, mise à jour en cours...');
        
        // Mettre à jour la réservation
        await reservation.update(payload);
        
        // Recharger les données fraîches
        await reservation.reload();
        
        console.log(`✅ [UPDATE] Réservation ID ${id} mise à jour avec succès`);
        
        res.json(formatReservation(reservation));
    } catch (error) {
        console.error('❌ [UPDATE] Erreur:', error);
        console.error('📄 [UPDATE] Stack:', error.stack);
        
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: "Erreur de validation des données",
                errors: error.errors.map(e => e.message)
            });
        }
        
        res.status(500).json({
            message: "Erreur lors de la mise à jour de la réservation",
            error: error.message
        });
    }
};

/**
 * DELETE - Supprimer une réservation
 */
exports.deleteReservationAdmin = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`📥 [DELETE] Suppression de la réservation ID: ${id}`);
        
        const reservation = await ReservationAdmin.findByPk(id);
        
        if (!reservation) {
            console.log(`❌ [DELETE] Réservation ID ${id} non trouvée`);
            return res.status(404).json({ 
                message: "Réservation non trouvée",
                id: id 
            });
        }

        console.log(`🗑️ [DELETE] Suppression de la réservation ID: ${id}`);
        await reservation.destroy();
        
        console.log(`✅ [DELETE] Réservation ID ${id} supprimée avec succès`);
        res.json({ 
            message: "Réservation supprimée avec succès",
            id: id 
        });
    } catch (error) {
        console.error('❌ [DELETE] Erreur:', error);
        res.status(500).json({
            message: "Erreur lors de la suppression de la réservation",
            error: error.message
        });
    }
};

/**
 * PATCH - Mettre à jour partiellement une réservation (ex: statut paiement)
 */
exports.patchReservationAdmin = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`📥 [PATCH] Mise à jour partielle ID: ${id}`);
        console.log('📥 [PATCH] Body:', JSON.stringify(req.body, null, 2));
        
        const reservation = await ReservationAdmin.findByPk(id);
        
        if (!reservation) {
            return res.status(404).json({ 
                message: "Réservation non trouvée",
                id: id 
            });
        }

        // Construire le payload avec les données existantes + les patchs
        const existingData = reservation.toJSON();
        const mergedData = { ...existingData, ...req.body };
        const payload = buildPayload(mergedData);
        
        await reservation.update(payload);
        await reservation.reload();
        
        console.log(`✅ [PATCH] Réservation ID ${id} mise à jour partiellement`);
        res.json(formatReservation(reservation));
    } catch (error) {
        console.error('❌ [PATCH] Erreur:', error);
        res.status(500).json({
            message: "Erreur lors de la mise à jour partielle",
            error: error.message
        });
    }
};

// ============================================================
// EXPORT DES FONCTIONS ADDITIONNELLES
// ============================================================

/**
 * Récupérer les réservations par date
 */
exports.getReservationsByDate = async (req, res) => {
    try {
        const { date } = req.params;
        console.log(`📥 [GET BY DATE] Récupération des réservations pour le ${date}`);
        
        const reservations = await ReservationAdmin.findAll({
            where: { date: date },
            order: [["heure", "ASC"]]
        });
        
        console.log(`✅ [GET BY DATE] ${reservations.length} réservations trouvées`);
        res.json(reservations.map(formatReservation));
    } catch (error) {
        console.error('❌ [GET BY DATE] Erreur:', error);
        res.status(500).json({
            message: "Erreur lors de la récupération par date",
            error: error.message
        });
    }
};

/**
 * Récupérer les réservations par activité
 */
exports.getReservationsByActivity = async (req, res) => {
    try {
        const { activite } = req.params;
        console.log(`📥 [GET BY ACTIVITY] Récupération des réservations pour l'activité: ${activite}`);
        
        const reservations = await ReservationAdmin.findAll({
            where: { activite: activite },
            order: [["date", "ASC"], ["heure", "ASC"]]
        });
        
        console.log(`✅ [GET BY ACTIVITY] ${reservations.length} réservations trouvées`);
        res.json(reservations.map(formatReservation));
    } catch (error) {
        console.error('❌ [GET BY ACTIVITY] Erreur:', error);
        res.status(500).json({
            message: "Erreur lors de la récupération par activité",
            error: error.message
        });
    }
};

/**
 * Récupérer les statistiques des réservations
 */
exports.getReservationsStats = async (req, res) => {
    try {
        console.log('📥 [GET STATS] Calcul des statistiques...');
        
        const allReservations = await ReservationAdmin.findAll();
        
        const stats = {
            total: allReservations.length,
            byActivity: {},
            today: allReservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length,
            totalRevenue: 0,
            totalPaid: 0,
            totalRemaining: 0
        };
        
        allReservations.forEach(res => {
            // Par activité
            stats.byActivity[res.activite] = (stats.byActivity[res.activite] || 0) + 1;
            
            // Revenus
            const total = parseFloat(res.totalAPayer) || 0;
            const versement = parseFloat(res.versement) || 0;
            const reste = parseFloat(res.resteAPayer) || 0;
            
            stats.totalRevenue += total;
            stats.totalPaid += versement;
            stats.totalRemaining += reste;
        });
        
        console.log('✅ [GET STATS] Statistiques calculées:', JSON.stringify(stats, null, 2));
        res.json(stats);
    } catch (error) {
        console.error('❌ [GET STATS] Erreur:', error);
        res.status(500).json({
            message: "Erreur lors du calcul des statistiques",
            error: error.message
        });
    }
};

// ============================================================
// GESTION DES ERREURS GLOBALES POUR CE CONTROLLER
// ============================================================

/**
 * Middleware de gestion d'erreurs spécifique aux réservations
 */
exports.handleReservationError = (err, req, res, next) => {
    console.error('🔴 [RESERVATION ERROR]', err);
    
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            message: "Validation des données échouée",
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message,
                value: e.value
            }))
        });
    }
    
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            message: "Conflit de données",
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }
    
    res.status(500).json({
        message: "Erreur interne du serveur",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

module.exports = exports;