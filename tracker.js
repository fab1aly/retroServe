const Server = require('bittorrent-tracker').Server;

const server = new Server({
    udp: true, // enable udp server? (default=true)
    http: true, // enable http server? (default=true)
    ws: true, // enable websocket server? (default=true)
    stats: true, // enable web-based statistics? (default=true)
    filter: function (infoHash, params, cb) {
        // Blacklist/whitelist function for allowing/disallowing torrents. If this option is
        // omitted, all torrents are allowed. It is possible to interface with a database or
        // external system before deciding to allow/deny, because this function is async.
        //
        // It is possible to block by peer id (for example, bad peers that have uploaded bad data in the past).
        //
        // To block a peer, pass back a string or Error (any truthy value)
        //
        // `params.info_hash` is a 20-byte hex string (Buffer in node.js)
        // `params.peer_id` is a 20-byte hex string (Buffer in node.js)
        // `params.ip` is an IP string (IPv6 or IPv4, possibly with port)
        // `params.port` is a peer port
        // `params.numwant` is the number of peers the client is requesting from the tracker
        // `params.uploaded` is the total amount uploaded (bytes)
        // `params.downloaded` is the total amount downloaded (bytes)
        // `params.left` is the number of bytes this peer still has to download
        // `params.event` is one of: 'started', 'completed', 'stopped', or undefined
        // `params.numwant` is the number of peers requested by the client
        // `params.key` is a unique ID that the client must generate on start and should
        // remain constant for all requests
        // `params.trackerid` is an opaque ID that the client must obtain from the tracker
        // in it's first request, and should send back on each request
        //
        // Call `cb` with no arguments if the torrent is allowed
        cb(null);
    }
});

server.on('error', function (err) {
    console.error('Server error:', err.message);
});

server.on('warning', function (err) {
    console.warn('Server warning:', err.message);
});

server.on('listening', function () {
    console.log('Server is listening on port ' + server.http.address().port);
});

server.listen(6969, function () {
    console.log('Server is listening on port 6969');
});