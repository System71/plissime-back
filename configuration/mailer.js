const nodemailer = require("nodemailer");

const subject = "Bienvenue sur Plissime - Crée ton espace personnel !";
const text = (firstName, finalisationUrl) => {
  return `
Salut ${firstName},

Ton coach vient de te rajouter à notre plateforme Plissime !

Tu peux dès maintenant créer ton espace personnel pour suivre tes entraînements, échanger avec ton coach et suivre tes progrès.

Pour finaliser ton inscription, clique sur ce lien :
${finalisationUrl}

Une fois connecté(e), tu seras automatiquement rattaché(e) à ton coach et tu pourras commencer à profiter de tout ce que la plateforme a à t’offrir.

Si tu rencontres le moindre souci, n’hésite pas à nous écrire.

Bienvenue chez Plissime 💪
A très vite!
  `;
};
const html = (firstName, finalisationUrl) => {
  return `
        <p>Salut ${firstName},</p>
        <p>Ton coach vient de te rajouter à notre plateforme Plissime !</p>
        <p>Tu peux dès maintenant créer ton espace personnel pour suivre tes entraînements, échanger avec ton coach et suivre tes progrès.</p>
        <a href="${finalisationUrl}" style="display:inline-block;background-color:#007bff;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">Finaliser mon inscription</a>
        <p>Une fois connecté(e), tu seras automatiquement rattaché(e) à ton coach et tu pourras commencer à profiter de tout ce que la plateforme a à t’offrir.</p>
        <p>Si tu rencontres le moindre souci, n’hésite pas à nous écrire.</p>
        <p>Bienvenue chez Plissime 💪</p>
        <p>A très vite!</p>
    `;
};

// Crée le transporter SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_EMAIL_ID,
    pass: process.env.GOOGLE_EMAIL_PASS,
  },
});

// Fonction pour envoyer un email
const sendEmail = async (to, firstName, finalisationUrl) => {
  const mailOptions = {
    from: `"PLISSIME" <${process.env.GOOGLE_EMAIL_ID}>`,
    to,
    subject,
    text: text(firstName, finalisationUrl),
    html: html(firstName, finalisationUrl),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé :", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Erreur d’envoi :", error);
    throw error;
  }
};

module.exports = sendEmail;
