const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('visitbejaia', 'postgres', 'massissilia06', {
  host: 'localhost',
  dialect: 'postgres',
});

async function fix() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connecté !');
    
    await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS acompte_30pct INTEGER DEFAULT 0`);
    await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS mode_paiement VARCHAR(50) DEFAULT 'BaridiMob'`);
    await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(255)`);
    await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS paiement_statut VARCHAR(50) DEFAULT 'non_saisi'`);
    await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS demandes_speciales TEXT`);
    await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_proof TEXT`);
    await sequelize.query(`ALTER TABLE reservations ALTER COLUMN payment_proof TYPE TEXT`);
    
    console.log('✅ Base corrigée !');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
  process.exit();
}

fix();