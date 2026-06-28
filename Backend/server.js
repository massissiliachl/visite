require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { sequelize } = require("./models");

const {
  ensurePropertyColumns
} = require("./utils/ensurePropertyColumns");

const {
  ensureReservationAdminColumns
} = require("./utils/ensureReservationAdminColumns");


// ROUTES
const adminRoutes = require("./routes/adminRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const propertyReservationRoutes = require("./routes/propertyReservationRoutes");
const authRoutes = require("./routes/authRoutes");
const emailRoutes = require("./routes/emailRoutes");
const ReservationAdminRoute = require("./routes/ReservationAdminRoute");


const app = express();


/* =====================
      MIDDLEWARE
===================== */

app.use(cors({
  origin:"*"
}));

app.use(express.json({
  limit:"25mb"
}));

app.use(express.urlencoded({
  extended:true,
  limit:"25mb"
}));



const clientDir =
path.join(__dirname,"..","Client");


app.use(express.static(clientDir));




/* =====================
      UPLOAD IMAGE
===================== */


const uploadDir =
path.join(
 clientDir,
 "assets",
 "images",
 "properties"
);



if(!fs.existsSync(uploadDir)){

 fs.mkdirSync(uploadDir,{
  recursive:true
 });

}



const storage =
multer.diskStorage({

 destination:(req,file,cb)=>{
  cb(null,uploadDir);
 },


 filename:(req,file,cb)=>{

  cb(
   null,
   Date.now()+"-"+file.originalname
  );

 }

});



const upload =
multer({

 storage,

 limits:{
  fileSize:5*1024*1024
 }

});






/* =====================
      AUTH ADMIN
===================== */


const auth=(req,res,next)=>{


const header =
req.headers.authorization;



if(!header ||
!header.startsWith("Bearer ")){

return res.status(401).json({
 error:"Token manquant"
});

}



const token =
header.split(" ")[1];



try{

const jwt=require("jsonwebtoken");


const decoded =
jwt.verify(
 token,
 process.env.JWT_SECRET
);



if(decoded.email !==
"admin@visitbejaia.com"){

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







/* =====================
       UPLOAD API
===================== */


app.post(
"/api/upload",
auth,
upload.single("image"),
(req,res)=>{


if(!req.file){

return res.status(400).json({
 error:"image manquante"
});

}



res.json({

url:
`assets/images/properties/${req.file.filename}`

});


});







/* =====================
        ROUTES
===================== */


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




app.get(
"/api/test",
(req,res)=>{

res.json({
 message:"API OK"
});

});





/* EMAIL */

console.log(
"EMAIL_USER:",
process.env.EMAIL_USER ?
"Défini":"MANQUANT"
);


console.log(
"EMAIL_PASS:",
process.env.EMAIL_PASS ?
"Défini":"MANQUANT"
);


app.use("/",emailRoutes);







/* FRONT */


app.get(
"/",
(req,res)=>{

res.sendFile(
 path.join(clientDir,"index.html")
);

});






/* =====================
        START
===================== */


const PORT =
process.env.PORT || 3000;



async function startServer(){


try{


console.log(
"🔄 Connexion DB..."
);



await sequelize.authenticate();


console.log(
"✅ DB connectée"
);



// IMPORTANT:
// PAS DE sequelize.sync()


await ensurePropertyColumns(sequelize);


await ensureReservationAdminColumns(sequelize);



console.log(
"✅ Tables vérifiées sans modification destructive"
);



app.listen(
PORT,
()=>{


console.log(
`🚀 Serveur démarré ${PORT}`
);


});


}catch(err){


console.error(
"❌ ERREUR:",
err
);


}

}



process.on(
"uncaughtException",
err=>{

console.error(
"❌ Exception",
err
);

});


process.on(
"unhandledRejection",
err=>{

console.error(
"❌ Rejection",
err
);

});



startServer();