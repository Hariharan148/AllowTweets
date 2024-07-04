const express = require('express');
const admin = require("firebase-admin");
const axios = require('axios');

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const STOP_TWEET_DOC = 'config/stopTweet';// Set your document path here

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/toggleTweetingMrg', async (req, res) => {
    const allowTweeting = req.body.allowTweetingMrg;

    if (typeof allowTweeting === 'boolean') {
        try {
            await db.doc(STOP_TWEET_DOC).set({ allowTweetingMrg: allowTweeting }, { merge: true });
            res.status(200).send(`Tweeting has been ${allowTweeting ? 'enabled' : 'disabled'}.`);
        } catch (error) {
            console.error('Error writing document: ', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(400).send('Invalid request: "allowTweetingMrg" must be a boolean.');
    }
});

app.post('/toggleTweetingNyt', async (req, res) => {
    const allowTweeting = req.body.allowTweetingNyt;

    if (typeof allowTweeting === 'boolean') {
        try {
            await db.doc(STOP_TWEET_DOC).set({ allowTweetingNyt: allowTweeting }, { merge: true });
            res.status(200).send(`Tweeting has been ${allowTweeting ? 'enabled' : 'disabled'}.`);
        } catch (error) {
            console.error('Error writing document: ', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(400).send('Invalid request: "allowTweetingNyt" must be a boolean.');
    }
});

// // Example endpoint to trigger a Firebase function
// app.post('/callFirebaseFunction', async (req, res) => {
//     const { url, data } = req.body;
//     console.log(url, data);
//     try {
//         const functionUrl = url;
//         const response = await axios.post(functionUrl, data, {
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });

//         res.status(response.status).send(response.data);
//     } catch (error) {
//         console.error('Error calling Firebase function:', error);
//         if (error.response) {
//             // The request was made and the server responded with a status code
//             // that falls out of the range of 2xx
//             console.error('Response data:', error.response.data);
//             console.error('Response status:', error.response.status);
//             console.error('Response headers:', error.response.headers);
//             res.status(error.response.status).send(error.response.data);
//         } else if (error.request) {
//             // The request was made but no response was received
//             console.error('Request data:', error.request);
//             res.status(500).send('No response received from Firebase function');
//         } else {
//             // Something happened in setting up the request that triggered an Error
//             console.error('Error message:', error.message);
//             res.status(500).send('Internal Server Error');
//         }
//     }
// });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
