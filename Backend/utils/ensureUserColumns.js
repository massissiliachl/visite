async function ensureUserColumns(sequelize) {
  const queries = [
    `
    ALTER TABLE public."users"
    ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN DEFAULT false NOT NULL
    `,
    `
    ALTER TABLE public."users"
    ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMP WITH TIME ZONE
    `
  ];

  for (const query of queries) {
    await sequelize.query(query);
  }

  console.log("✅ Colonnes users (isOnline, lastSeen) vérifiées");
}

module.exports = {
  ensureUserColumns
};
