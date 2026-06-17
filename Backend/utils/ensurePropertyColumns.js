/**
 * Ajoute les colonnes manquantes sur "properties" (camelCase, comme le modèle Sequelize).
 * Utile quand sync({ alter: true }) ne les crée pas (pooler Supabase, permissions, etc.).
 */
async function ensurePropertyColumns(sequelize) {
  const statements = [
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "longDescription" TEXT`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "priceHaute" INTEGER`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "priceBasse" INTEGER`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "isDevis" BOOLEAN DEFAULT false`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "capacity" INTEGER`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION DEFAULT 0`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "popular" BOOLEAN DEFAULT false`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "ambiance" TEXT DEFAULT '[]'`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "features" TEXT DEFAULT '[]'`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW()`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW()`,
  ];

  for (const sql of statements) {
    await sequelize.query(sql);
  }

  console.log("✅ Colonnes properties vérifiées / créées si besoin");
}

module.exports = { ensurePropertyColumns };
