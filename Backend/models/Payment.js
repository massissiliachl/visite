// models/Payment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // adapte le chemin selon ta structure

const Payment = sequelize.define('Payment', {
  // DÉFINITION DES CHAMPS
  reservation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'reservations',
      key: 'id'
    }
  },
  payment_method: {
    type: DataTypes.ENUM('BaridiMob', 'CCP', 'Espèces', 'Carte'),
    defaultValue: 'BaridiMob',
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  transaction_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    validate: {
      is: /^[0-9]{10,}$/
    }
  },
  ccp_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: '123 456 789'
  },
  beneficiary: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'VISIT BEJAIA SARL'
  },
  client_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  client_email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: { isEmail: true }
  },
  client_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  receipt_image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_status: {
    type: DataTypes.ENUM('En attente', 'En vérification', 'Confirmé', 'Rejeté', 'Remboursé'),
    defaultValue: 'En attente',
    allowNull: false
  },
  verified_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  // OPTIONS DU MODÈLE (timestamps, tableName, hooks, etc.)
  tableName: 'payments',
  timestamps: true, // ajoute createdAt et updatedAt automatiquement
  
  // HOOKS (ici c'est correct)
  hooks: {
    beforeValidate: (payment) => {
      if (payment.transaction_number) {
        payment.transaction_number = payment.transaction_number.replace(/\s/g, '');
      }
    },
    
    afterUpdate: async (payment) => {
      if (payment.changed('payment_status') && payment.payment_status === 'Confirmé') {
        try {
          const Reservation = require('./Reservation'); // Attention au require circulaire
          await Reservation.update(
            { reservation_status: 'confirmée' },
            { where: { id: payment.reservation_id } }
          );
          console.log(`Réservation ${payment.reservation_id} confirmée suite au paiement`);
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la réservation:', error);
        }
      }
    }
  }
});

// =====================================================
// MÉTHODES D'INSTANCE (à mettre APRÈS la définition)
// =====================================================

// Méthode pour vérifier/confirmer un paiement
Payment.prototype.verify = async function(adminEmail) {
  this.payment_status = 'Confirmé';
  this.verified_by = adminEmail;
  this.verified_at = new Date();
  await this.save();
  return this;
};

// Méthode pour rejeter un paiement
Payment.prototype.reject = async function(adminEmail, reason) {
  this.payment_status = 'Rejeté';
  this.verified_by = adminEmail;
  this.verified_at = new Date();
  this.admin_notes = reason;
  await this.save();
  return this;
};

// Méthode pour marquer comme "En vérification"
Payment.prototype.markAsChecking = async function(adminEmail) {
  this.payment_status = 'En vérification';
  this.verified_by = adminEmail;
  await this.save();
  return this;
};

// Méthode pour obtenir les infos formatées
Payment.prototype.getFormattedAmount = function() {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0
  }).format(this.amount);
};

// =====================================================
// MÉTHODES STATIQUES (optionnel)
// =====================================================

// Trouver tous les paiements en attente
Payment.findPending = function() {
  return this.findAll({
    where: { payment_status: 'En attente' },
    order: [['payment_date', 'ASC']]
  });
};

// Trouver par numéro de transaction
Payment.findByTransaction = function(transactionNumber) {
  return this.findOne({
    where: { transaction_number: transactionNumber }
  });
};

// Statistiques des paiements
Payment.getStats = async function() {
  const stats = await this.findAll({
    attributes: [
      'payment_status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
    ],
    group: ['payment_status']
  });
  return stats;
};

module.exports = Payment;