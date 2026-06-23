/**
 * Colonnes paiement / note pour ReservationAdmins (PostgreSQL = noms en minuscules).
 */
async function ensureReservationAdminColumns(sequelize) {
  const statements = [
    `ALTER TABLE "ReservationAdmins" ADD COLUMN IF NOT EXISTS totalapayer DECIMAL(10,2) DEFAULT 0 NOT NULL`,
    `ALTER TABLE "ReservationAdmins" ADD COLUMN IF NOT EXISTS versement DECIMAL(10,2) DEFAULT 0 NOT NULL`,
    `ALTER TABLE "ReservationAdmins" ADD COLUMN IF NOT EXISTS resteapayer DECIMAL(10,2) DEFAULT 0 NOT NULL`,
    `ALTER TABLE "ReservationAdmins" ADD COLUMN IF NOT EXISTS note TEXT`,
    `ALTER TABLE "ReservationAdmins" ADD COLUMN IF NOT EXISTS bateau VARCHAR(255)`,
    `ALTER TABLE "ReservationAdmins" ADD COLUMN IF NOT EXISTS duree VARCHAR(255)`,
    `ALTER TABLE "ReservationAdmins" ADD COLUMN IF NOT EXISTS slot VARCHAR(255)`,
    `ALTER TABLE "ReservationAdmins" ADD COLUMN IF NOT EXISTS subslot VARCHAR(255)`,
  ];

  for (const sql of statements) {
    await sequelize.query(sql);
  }

  console.log("✅ Colonnes ReservationAdmins vérifiées / créées si besoin");
}

module.exports = { ensureReservationAdminColumns };
