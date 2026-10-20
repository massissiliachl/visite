async function ensureOwnerSchema(sequelize) {
  // Étendre l'ENUM role (PostgreSQL)
  try {
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'enum_users_role' AND e.enumlabel = 'proprietaire'
        ) THEN
          ALTER TYPE "enum_users_role" ADD VALUE 'proprietaire';
        END IF;
      EXCEPTION WHEN undefined_object THEN
        -- Si le type n'existe pas encore, Sequelize le créera via le modèle
        NULL;
      END $$;
    `);
  } catch (err) {
    console.warn("ensureOwnerSchema ENUM:", err.message);
  }

  await sequelize.query(`
    ALTER TABLE public."properties"
    ADD COLUMN IF NOT EXISTS "ownerId" INTEGER NULL
  `);

  await sequelize.query(`
    ALTER TABLE public."properties"
    ADD COLUMN IF NOT EXISTS "approvalStatus" VARCHAR(32) NOT NULL DEFAULT 'approved'
  `);

  // item_id doit stocker des UUID de propriétés
  try {
    await sequelize.query(`
      ALTER TABLE public.blocked
      ALTER COLUMN item_id TYPE VARCHAR(255)
      USING item_id::text
    `);
  } catch (err) {
    // Colonne déjà VARCHAR ou table absente
    console.warn("ensureOwnerSchema blocked.item_id:", err.message);
  }

  console.log("✅ Schéma propriétaires / ownerId / approvalStatus / blocked.item_id vérifié");
}

module.exports = { ensureOwnerSchema };
