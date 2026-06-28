async function ensureReservationAdminColumns(sequelize) {

  const columns = [
  
  `
  ALTER TABLE public."ReservationAdmins"
  ADD COLUMN IF NOT EXISTS totalapayer NUMERIC(10,2)
  DEFAULT 0 NOT NULL
  `,
  
  `
  ALTER TABLE public."ReservationAdmins"
  ADD COLUMN IF NOT EXISTS versement NUMERIC(10,2)
  DEFAULT 0 NOT NULL
  `,
  
  `
  ALTER TABLE public."ReservationAdmins"
  ADD COLUMN IF NOT EXISTS resteapayer NUMERIC(10,2)
  DEFAULT 0 NOT NULL
  `,
  
  `
  ALTER TABLE public."ReservationAdmins"
  ADD COLUMN IF NOT EXISTS note TEXT
  `
  
  ];
  
  
  for(const sql of columns){
  
   await sequelize.query(sql);
  
  }
  
  
  console.log(
  "✅ Colonnes paiement ReservationAdmins OK"
  );
  
  
  }
  
  
  module.exports={
   ensureReservationAdminColumns
  };