const express = require("express");
const cors = require("cors");
const addonInterface = require("./addon.js");

const app = express();
app.use(cors());

app.get("/manifest.json", (_, res) => {
    res.status(200).json(addonInterface.manifest || {});
});

app.get("/:resource/:type/:id.json", (req, res) => {
    addonInterface.get(req)
        .then(resp => res.status(200).json(resp))
        .catch(err => {
            console.error("Stream/catalog error", err);
            res.status(500).send("Internal server error");
        });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Doplnok beží na porte ${PORT}`);
});
