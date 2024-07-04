const express = require('express');
const admin = require('firebase-admin');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');

const serviceAccount = require('./serviceAccountKey.json');
const keys = require('./oauth2.keys.json'); // Your OAuth2 keys file

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const STOP_TWEET_DOC = 'config/stopTweet'; // Set your document path here

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize OAuth2 client
const redirectUri = 'default-redirect-uri';
const oAuth2Client = new OAuth2Client(
    process.env.WEB_CLIENT_ID,
    process.env.WEB_CLIENT_SECRET,
    redirectUri
);


// Generate the OAuth2 consent URL
const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/userinfo.profile',
});

// Endpoint to initiate OAuth2 flow
app.get('/auth/google', (req, res) => {
    res.redirect(authorizeUrl);
});

// Callback endpoint for OAuth2 authorization
app.get('/oauth2callback', async (req, res) => {
    try {
        const code = req.query.code;
        const r = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(r.tokens);

        // Store tokens securely, for example, in Firebase Firestore
        await db.doc('users/userId/tokens').set({
            access_token: r.tokens.access_token,
            refresh_token: r.tokens.refresh_token,
            expiry_date: oAuth2Client.credentials.expiry_date, // Set this appropriately
        });

        res.send('Authentication successful! You can now close this window.');
    } catch (error) {
        console.error('Error retrieving access token:', error);
        res.status(500).send('Error retrieving access token');
    }
});

// Middleware to verify OAuth2 token
async function verifyOAuth2Token(req, res, next) {
    try {
        // Check if there's a valid OAuth2 token in Firestore
        const doc = await db.doc('users/userId/tokens').get();
        const tokens = doc.data();

        if (!tokens || !tokens.access_token) {
            res.status(401).send('Unauthorized: Missing OAuth2 token');
            return;
        }

        // Verify the OAuth2 token
        const ticket = await oAuth2Client.verifyIdToken({
            idToken: tokens.access_token,
            audience: keys.web.client_id, // Your client ID
        });

        req.user = ticket.getPayload();
        next();
    } catch (error) {
        console.error('Error verifying OAuth2 token:', error);
        res.status(401).send('Unauthorized: Invalid OAuth2 token');
    }
}

// Example endpoint to toggle Tweeting status with OAuth2 authentication
app.post('/toggleTweetingMrg', verifyOAuth2Token, async (req, res) => {
    const allowTweeting = req.body.allowTweetingMrg;

    if (typeof allowTweeting === 'boolean') {
        try {
            // Use the OAuth2 token to make authenticated requests
            const headers = {
                Authorization: `Bearer ${req.user.sub}`, // Using verified user's sub as access token
                'Content-Type': 'application/json',
            };

            // Example API request using the OAuth2 token
            const apiUrl = 'https://us-central1-wakeup-automation.cloudfunctions.net/toggleTweetingMrg';
            const apiResponse = await axios.post(apiUrl, req.body, { headers });

            // Update Firestore with the new status
            await db.doc(STOP_TWEET_DOC).set({ allowTweetingMrg: allowTweeting }, { merge: true });

            res.status(200).send(`Tweeting has been ${allowTweeting ? 'enabled' : 'disabled'}.`);
        } catch (error) {
            console.error('Error toggling Tweeting:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(400).send('Invalid request: "allowTweetingMrg" must be a boolean.');
    }
});

// Example endpoint to toggle Tweeting status with OAuth2 authentication
app.post('/toggleTweetingNyt', verifyOAuth2Token, async (req, res) => {
    const allowTweeting = req.body.allowTweetingNyt;

    if (typeof allowTweeting === 'boolean') {
        try {
            // Use the OAuth2 token to make authenticated requests
            const headers = {
                Authorization: `Bearer ${req.user.sub}`, // Using verified user's sub as access token
                'Content-Type': 'application/json',
            };

            // Example API request using the OAuth2 token
            const apiUrl = 'https://us-central1-wakeup-automation.cloudfunctions.net/toggleTweetingNyt';
            const apiResponse = await axios.post(apiUrl, req.body, { headers });

            // Update Firestore with the new status
            await db.doc(STOP_TWEET_DOC).set({ allowTweetingNyt: allowTweeting }, { merge: true });

            res.status(200).send(`Tweeting has been ${allowTweeting ? 'enabled' : 'disabled'}.`);
        } catch (error) {
            console.error('Error toggling Tweeting:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(400).send('Invalid request: "allowTweetingNyt" must be a boolean.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
