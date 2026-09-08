const nodemailer = require("nodemailer");

/**
 * Transporteur Gmail avec IPv4 forcé.
 * Sur certains réseaux Windows, smtp.gmail.com résout en IPv6 et timeout (ETIMEDOUT).
 */
function createMailTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 20000,
    // Forcer IPv4 pour éviter ETIMEDOUT sur adresses 2a00:...
    family: 4
  });
}

module.exports = { createMailTransporter };
