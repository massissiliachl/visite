const QRCode = require("qrcode");

QRCode.toFile(
  "visitebejaia.png",
  "https://visitbejaia.org/",
  {
    width: 800,
    margin: 2
  },
  (err) => {
    if (err) throw err;
    console.log("QR Code créé !");
  }
);