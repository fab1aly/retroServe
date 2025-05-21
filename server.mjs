// server.mjs


import WebTorrent from 'webtorrent';

// --- Définissez votre port d'écoute fixe ici ---
// Choisissez un port non privilégié (supérieur à 1023) qui n'est pas déjà utilisé
// par d'autres applications sur votre serveur.
// 6881 est un port BitTorrent standard, mais vous pouvez en choisir un autre comme 8000, 50000, etc.
const WEBTORRENT_LISTEN_PORT = 58693; // Exemple de port fixe // Ou un autre port de votre choix
////////////// fonctionne pas !!


const client = new WebTorrent({
    // L'option 'listen' prend un tableau de ports ou d'adresses:ports.
    // En spécifiant juste le port, le client écoutera sur toutes les interfaces disponibles.
    listen: WEBTORRENT_LISTEN_PORT
});


// --- Gestion des événements du client et des torrents (laissez ces logs, ils sont très utiles) ---
client.on('add', function (torrent) {
    console.log('Client added torrent:', torrent.infoHash);

    torrent.on('infoHash', function () {
        console.log('Torrent infoHash:', torrent.infoHash);
    });
    torrent.on('metadata', function () {
        console.log('Torrent metadata received/created');
    });
    torrent.on('ready', function () {
        console.log('Torrent ready (metadata loaded):', torrent.name);
        // Ici, le torrent est prêt, les fichiers sont connus.
        // C'est le moment de désélectionner tout, puis de sélectionner ce qui nous intéresse.

        // IMPORTANT: Désélectionnez tous les fichiers par défaut
        torrent.files.forEach(file => {
            file.deselect();
            // console.log(`Deselected: ${file.name}`); // Pour déboguer les sélections
        });

        // Sélectionnez le fichier spécifique que vous voulez diffuser
        const fileToDownload = torrent.files.find(f => f.name.endsWith(file_name)); // Utilisez la constante file_name

        if (fileToDownload) {
            fileToDownload.select(); // Sélectionnez ce fichier
            console.log(`Selected for download/seeding: ${fileToDownload.name}`);
            // torrent.select(fileToDownload._startPiece, fileToDownload._endPiece); // Alternative si vous avez besoin des indices de pièce
        } else {
            console.error(`ERROR: File '${file_name}' not found in torrent.`);
            // Gérer le cas où le fichier n'est pas trouvé
        }
    });
    torrent.on('warning', function (err) {
        console.warn('Torrent warning:', err.message);
    });
    torrent.on('error', function (err) {
        console.error('Torrent error:', err.message);
    });
    torrent.on('wire', function (wire, addr) {
        console.log('Connected to peer via wire:', wire.peerId.substring(0, 8) + ' (' + addr + ')');
    });
    torrent.on('noPeers', function (announceType) {
        console.log('No peers found for announce type:', announceType);
    });

    torrent.on('download', function (bytes) {
        // Surveillez la progression du téléchargement
        const progress = (torrent.downloaded / torrent.length) * 100;
        console.log(`Downloading: ${progress.toFixed(2)}% (${torrent.downloaded} / ${torrent.length} bytes)`);
    });

    torrent.on('done', () => {
        console.log('Torrent download (selected parts) finished!');
        console.log('Now seeding the selected parts.');
        // À ce stade, votre serveur est un seeder pour les parties qu'il a.
    });

    torrent.on('upload', function (bytes) {
        console.log('Uploaded data to peer:', bytes);
    });

    setInterval(() => {
        console.log(`Number of peers for ${torrent.infoHash}: ${torrent.numPeers}`);
    }, 5000);
});

client.on('listening', () => {
    console.log(`WebTorrent client is listening on port ${client.address().port}`);
    console.log(`Client is listening: ${client.listening}`); // Devrait être true
});

client.on('error', function (err) {
    console.error('WebTorrent client error:', err.message);
    // Ajoutez plus de détails si l'erreur est liée à l'écoute du port
    if (err.message.includes('EADDRINUSE')) {
        console.error('Port is already in use. Try a different port.');
    }
});

// --- Configuration du torrent à télécharger depuis archive.org ---
const archiveOrgTorrentUrl = 'https://archive.org/download/THX-1138_Original_Cut.mkv/THX-1138_Original_Cut.mkv_archive.torrent';
const file_name = "THX-1138_Original_Cut.mp4"; // Le nom exact du fichier que vous voulez.

const webtorrentTrackers = [
    'wss://tracker.webtorrent.io',
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.btorrent.xyz',
    // 'wss://tracker.fastcast.nz' // Un autre tracker populaire
];

// Ajouter le torrent au client pour le télécharger
client.add(archiveOrgTorrentUrl, { announce: webtorrentTrackers }, (torrent) => {
    // Ce callback est appelé quand le torrent est PRÊT (métadonnées chargées).
    // Les logs de 'ready' ci-dessus vont aussi s'activer.
    console.log('Client added torrent from Archive.org. InfoHash:', torrent.infoHash);
    console.log('Torrent name:', torrent.name); // Le nom du torrent (peut être différent du nom du fichier sélectionné)
    console.log('Torrent total size:', torrent.length); // Taille totale du torrent, pas seulement le fichier sélectionné

    // Vous pouvez maintenant utiliser le torrent.infoHash et torrent.magnetURI pour votre page web
    // torrent.magnetURI contient déjà l'infoHash et les trackers par défaut que vous avez passés.
    console.log('Magnet URI for this torrent:', torrent.magnetURI);

    console.log('Torrent path:', torrent.path); // Chemin où le torrent est téléchargé
});

// IMPORTANT : Affichez le statut après un court délai pour être sûr que l'initialisation a eu lieu
setTimeout(() => {
    console.log(`Current client listening status (after timeout): ${client.listening}`);
    if (client.listening && client.address()) {
        console.log(`Client listening on address: ${client.address().address}:${client.address().port}`);
    } else {
        console.error('Client failed to listen or address not available.');
    }
}, 3000); // Donnez un peu de temps pour l'initialisation du client