const { addonBuilder } = require("stremio-addon-sdk");

const manifest = {
  id: "com.appleman.webshare",
  version: "1.0.0",
  name: "Webshare Doplnok",
  description: "Sledujte filmy a seriály z Webshare cez Stremio.",
  logo: "https://via.placeholder.com/150",
  resources: ["catalog", "stream"],
  types: ["movie", "series"],
  catalogs: [
    { type: "movie", id: "webshare_movies", name: "Webshare Filmy" },
    { type: "movie", id: "webshare_new", name: "Nové Filmy" }
  ],
  config: [
    { key: "login", type: "text", title: "Webshare Prihlasovacie meno", required: true },
    { key: "password", type: "password", title: "Webshare Heslo", required: true }
  ],
  behaviorHints: { configurable: true, configurationRequired: true }
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ id }) => {
    if (id === "webshare_new") {
        return Promise.resolve({
            metas: [
                {
                    id: "new-movie-1",
                    name: "Novinka: The Example",
                    type: "movie",
                    poster: "https://via.placeholder.com/200x300?text=New+Movie+1",
                    description: "Ukážkový nový film."
                },
                {
                    id: "new-movie-2",
                    name: "Novinka: Second Test",
                    type: "movie",
                    poster: "https://via.placeholder.com/200x300?text=New+Movie+2",
                    description: "Ďalší testovací film v knižnici noviniek."
                }
            ]
        });
    }

    return Promise.resolve({
        metas: [
            {
                id: "test-movie",
                name: "Testovací film",
                type: "movie",
                poster: "https://via.placeholder.com/200x300",
                description: "Toto je ukážkový film z doplnku."
            }
        ]
    });
});

builder.defineStreamHandler(({ id }) => {
    const streams = [];

    if (id === "test-movie") {
        streams.push({
            title: "Webshare stream",
            url: "https://webshare.cz/test-stream.mp4"
        });
    } else if (id === "new-movie-1") {
        streams.push({
            title: "Nový film stream",
            url: "https://webshare.cz/new-movie-1.mp4"
        });
    } else if (id === "new-movie-2") {
        streams.push({
            title: "Druhý nový film stream",
            url: "https://webshare.cz/new-movie-2.mp4"
        });
    }

    return Promise.resolve({ streams });
});

module.exports = builder.getInterface();
