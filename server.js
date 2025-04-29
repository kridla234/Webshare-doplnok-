const express = require('express');
const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');

const app = express();
app.use(express.urlencoded({ extended: true }));

let email = null;
let password = null;
let token = null;

async function loginToWebshare() {
    if (!email || !password) return null;
    try {
        const response = await axios.post('https://webshare.cz/api/login', {
            username: email,
            password: password
        });
        if (response.data && response.data.token) {
            console.log("✅ Webshare login OK");
            token = response.data.token;
            return token;
        } else {
            throw new Error("❌ Login failed: token not received");
        }
    } catch (err) {
        console.error("❌ Webshare login error:", err.message);
        return null;
    }
}

async function searchVideo(query) {
    if (!token) await loginToWebshare();
    if (!token) return null;
    try {
        const response = await axios.get('https://webshare.cz/api/search', {
            params: { query: query, page: 1 },
            headers: { Authorization: 'Bearer ' + token }
        });
        if (!response.data || !response.data.data) return null;
        const videos = response.data.data.filter(item => {
            const name = item.name.toLowerCase();
            return name.endsWith('.mp4') || name.endsWith('.mkv') || name.endsWith('.avi') || name.endsWith('.mov');
        });
        if (videos.length === 0) return null;
        const best = videos.reduce((prev, current) => (prev.size > current.size) ? prev : current);
        return `https://webshare.cz/file/${best.ident}`;
    } catch (err) {
        console.error("❌ Webshare search error:", err.message);
        return null;
    }
}

const manifest = {
    id: "org.webshare.dynamic",
    version: "1.0.0",
    name: "Webshare Dynamic Addon",
    description: "Streamuj filmy a seriály z Webshare.cz dynamicky!",
    types: ["movie", "series"],
    catalogs: [{ type: "movie", id: "popular" }],
    resources: ["catalog", "stream"]
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id }) => {
    const tmdbApiKey = "c1d2d3f00e6645022a3fdbe3fcba1be5";
    if (id !== "popular") return { metas: [] };
    const response = await axios.get(`https://api.themoviedb.org/3/movie/popular`, {
        params: { api_key: tmdbApiKey, language: "en-US", page: 1 }
    });
    const metas = response.data.results.map(movie => ({
        id: movie.title.replace(/ /g, "_"),
        name: movie.title,
        poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        type: "movie"
    }));
    return { metas };
});

builder.defineStreamHandler(async ({ type, id }) => {
    const query = decodeURIComponent(id).replace(/_/g, ' ');
    const videoUrl = await searchVideo(query);
    if (!videoUrl) return { streams: [] };
    return { streams: [{ title: "Webshare Stream", url: videoUrl }] };
});

const port = process.env.PORT || 7000;

// OPRAVA: správne poskytovanie manifest.json
app.get('/manifest.json', (req, res) => {
    res.type('application/json');
    res.send(builder.manifest);
});

app.get('/configure', (req, res) => {
    res.send(`<form method="post">
        <h2>Configure Webshare Login</h2>
        <input type="text" name="email" placeholder="Email" required/><br/><br/>
        <input type="password" name="password" placeholder="Password" required/><br/><br/>
        <button type="submit">Save</button>
    </form>`);
});

app.post('/configure', (req, res) => {
    email = req.body.email;
    password = req.body.password;
    res.send("✅ Configuration saved! You can now close this page.");
});

// Routing na katalóg a stream
app.get('/:resource/:type/:id.json', (req, res) => {
    builder.getInterface().get(req, res);
});

app.listen(port, () => {
    console.log(`Webshare addon running on port ${port}`);
});
