async function ensureReservationAdminColumns(sequelize) {

  const queries = [

    `
    ALTER TABLE public."ReservationAdmins"
    ADD COLUMN IF NOT EXISTS totalapayer DECIMAL(10,2) DEFAULT 0;
    `,

    `
    ALTER TABLE public."ReservationAdmins"
    ADD COLUMN IF NOT EXISTS versement DECIMAL(10,2) DEFAULT 0;
    `,

    `
    ALTER TABLE public."ReservationAdmins"
    ADD COLUMN IF NOT EXISTS resteapayer DECIMAL(10,2) DEFAULT 0;
    `,

    `
    ALTER TABLE public."ReservationAdmins"
    ADD COLUMN IF NOT EXISTS note TEXT;
    `,

    `
    ALTER TABLE public."ReservationAdmins"
    ADD COLUMN IF NOT EXISTS created_by_id INTEGER;
    `,

    `
    ALTER TABLE public."ReservationAdmins"
    ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255);
    `

  ];


  for(const q of queries){
    await sequelize.query(q);
  }


  console.log(
    "✅ Colonnes paiement ReservationAdmins vérifiées"
  );

}


module.exports={
 ensureReservationAdminColumns
};