const { google } = require("googleapis");
const dotenv = require("dotenv");
dotenv.config();

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid",
];

const createOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

//Fonction qui check si besoin de refresh le token
const refreshTokenIfNeeded = async (user) => {
  const oauth2Client = createOAuthClient();

  oauth2Client.setCredentials({
    access_token: user.oauth.accessToken,
    refresh_token: user.oauth.refreshToken,
    expiry_date: user.oauth.expiryDate,
  });

  const isExpired =
    !user.oauth.expiryDate || user.oauth.expiryDate <= Date.now();

  if (!isExpired) {
    return oauth2Client; // rien à faire, token encore valide
  }

  console.log("🔁 Refresh du token Google en cours...");

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    await User.findByIdAndUpdate(
      user._id,
      {
        "oauth.accessToken": credentials.access_token,
        "oauth.expiryDate": credentials.expiry_date,
        ...(credentials.refresh_token && {
          "oauth.refreshToken": credentials.refresh_token,
        }),
      },
      { new: true }
    );

    oauth2Client.setCredentials(credentials);

    console.log("✅ Token Google mis à jour !");
    return oauth2Client;
  } catch (err) {
    console.error("❌ Erreur lors du rafraîchissement:", err);
    throw new Error("Google token refresh failed");
  }
};

module.exports = { createOAuthClient, SCOPES, refreshTokenIfNeeded };
