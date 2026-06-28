require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { sequelize } = require("./models");
const { ensurePropertyColumns } = require("./utils/ensurePropertyColumns");
const { ensureReservationAdminColumns } = require("./utils/ensureReservationAdminColumns");


// ROUTES
const adminRoutes = require("./routes/adminRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const propertyReservationRoutes = require("./routes/propertyReservationRoutes");
const authRoutes = require("./routes/authRoutes");
const emailRoutes = require("./routes/emailRoutes");
const ReservationAdminRoute = require("./routes/ReservationAdminRoute");


const app = express();


/* =========================
   MIDDLEWARES
========================= */

app.use(cors({
  origin: "*"
}));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended:true, limit:"25mb" }));


app.use(express.static(path.join(__dirname,"public")));


const clientDir = path.join(__dirname,"..","Client");



/* =========================
   UPLOAD IMAGES
========================= */

const uploadDir = path.join(
  clientDir,
  "assets",
  "images",
  "properties"
);


if(!fs.existsSync(uploadDir)){
  fs.mkdirSync(uploadDir,{recursive:true});
  console.log("📁 Dossier créé:",uploadDir);
}



const storage = multer.diskStorage({

 destination:(req,file,cb)=>{
   cb(null,uploadDir);
 },

 filename:(req,file,cb)=>{

   const unique =
   Date.now()+"-"+Math.round(Math.random()*1e9);

   cb(null,unique+path.extname(file.originalname));

 }

});



const fileFilter=(req,file,cb)=>{

 const allowed=/jpeg|jpg|png|webp/;

 const ext =
 allowed.test(
 path.extname(file.originalname).toLowerCase()
 );

 const mime =
 allowed.test(file.mimetype);


 if(ext && mime){

   cb(null,true);

 }else{

   cb(new Error("Images seulement"));

 }

};



const upload = multer({

 storage,

 limits:{
  fileSize:5*1024*1024
 },

 fileFilter

});




/* =========================
   AUTH UPLOAD
========================= */


const auth=(req,res,next)=>{


const header=req.headers.authorization;


if(!header || !header.startsWith("Bearer ")){

 return res.status(401).json({
  error:"Token manquant"
 });

}


const token=header.split(" ")[1];


try{

const jwt=require("jsonwebtoken");


const decoded =
jwt.verify(
 token,
 process.env.JWT_SECRET
);


if(decoded.email !== "admin@visitbejaia.com"){

 return res.status(403).json({
  error:"Interdit"
 });

}


req.admin=decoded;


next();



}catch(e){

return res.status(401).json({
 error:"Token invalide"
});


}


};




/* =========================
   UPLOAD ROUTE
========================= */


app.post(
"/api/upload",
auth,
upload.single("image"),
(req,res)=>{


if(!req.file){

 return res.status(400).json({
  error:"Aucune image"
 });

}



const url =
`assets/images/properties/${req.file.filename}`;


console.log("✅ Image:",url);


res.json({
 url
});


});





/* =========================
   API ROUTES
========================= */


app.use(express.static(clientDir));


app.use(
"/api/reservations",
reservationRoutes
);


app.use(
"/api/availability",
availabilityRoutes
);


app.use(
"/api/property-reservations",
propertyReservationRoutes
);


app.use(
"/api/admin",
adminRoutes
);


app.use(
"/api/auth",
authRoutes
);



console.log("✅ ROUTE ADMIN CHARGÉE");


app.use(
"/api/reservations-admin",
ReservationAdminRoute
);




/* TEST */

app.get("/api/test",(req,res)=>{

res.json({
 message:"API OK"
});

});





/* =========================
   EMAIL
========================= */


console.log(
"EMAIL_USER:",
process.env.EMAIL_USER ? "Défini":"MANQUANT"
);


console.log(
"EMAIL_PASS:",
process.env.EMAIL_PASS ? "Défini":"MANQUANT"
);



app.use("/",emailRoutes);






/* =========================
   FRONT
========================= */


app.get("/",(req,res)=>{

res.sendFile(
path.join(clientDir,"index.html")
);

});





/* =========================
   ERREURS
========================= */


app.use((error,req,res,next)=>{


if(error instanceof multer.MulterError){

 return res.status(400).json({
  error:error.message
 });

}


if(error.message){

 return res.status(400).json({
  error:error.message
 });

}


next(error);


});






/* =========================
   START SERVER
========================= */


const PORT =
process.env.PORT || 3000;



async function startServer(){


try{


console.log("🔄 Connexion DB...");



await sequelize.authenticate();


console.log("✅ DB connectée");





// IMPORTANT POUR SUPABASE
// NE PAS UTILISER sync()
// sinon Sequelize peut modifier la table

// await sequelize.sync();




await ensurePropertyColumns(sequelize);


await ensureReservationAdminColumns(sequelize);



console.log("✅ Tables vérifiées");




const server =
app.listen(PORT,()=>{


console.log(
`🚀 Serveur démarré sur http://localhost:${PORT}`
);


console.log(
`📁 Upload images vers: ${uploadDir}`
);



});



server.keepAliveTimeout=65000;

server.headersTimeout=66000;




}catch(err){


console.error(
"❌ ERREUR START SERVER:",
err
);


}



}




process.on("SIGINT",()=>{

console.log("⚠️ arrêt serveur");

process.exit(0);

});



process.on("uncaughtException",(err)=>{

console.error(
"❌ Exception:",
err
);

});



process.on("unhandledRejection",(err)=>{

console.error(
"❌ Rejection:",
err
);

});





startServer();