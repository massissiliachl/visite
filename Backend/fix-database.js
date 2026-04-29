require("dotenv").config();

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function fix() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connecté !");

    await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS acompte_30pct INTEGER DEFAULT 0`);
    await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS mode_paiement VARCHAR(50) DEFAULT 'BaridiMob'`);
    await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(255)`);
    await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS paiement_statut VARCHAR(50) DEFAULT 'non_saisi'`);
    await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS demandes_speciales TEXT`);
    await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_proof TEXT`);

    console.log("✅ Base corrigée !");
  } catch (err) {
    console.error("❌ Erreur:", err.message);
  }

  process.exit();
}

fix();