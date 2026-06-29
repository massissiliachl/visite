async function ensurePropertyColumns(sequelize) {
  const queries = [
    `
    ALTER TABLE public."properties"
    ADD COLUMN IF NOT EXISTS "longDescription" TEXT
    `,
    `
    ALTER TABLE public."properties"
    ADD COLUMN IF NOT EXISTS "priceHaute" INTEGER
    `,
    `
    ALTER TABLE public."properties"
    ADD COLUMN IF NOT EXISTS "priceBasse" INTEGER
    `,
    `
    ALTER TABLE public."properties"
    ADD COLUMN IF NOT EXISTS "isDevis" BOOLEAN DEFAULT false
    `,
    `
    ALTER TABLE public."properties"
    ADD COLUMN IF NOT EXISTS "ambiance" TEXT DEFAULT '[]'
    `,
    `
    ALTER TABLE public."properties"
    ADD COLUMN IF NOT EXISTS "features" TEXT DEFAULT '[]'
    `,
    `
    ALTER TABLE public."properties"
    ADD COLUMN IF NOT EXISTS "images" TEXT DEFAULT '[]'
    `
  ];

  for (const query of queries) {
    await sequelize.query(query);
  }

  console.log("✅ Colonnes properties vérifiées");
}

module.exports = {
  ensurePropertyColumns
};