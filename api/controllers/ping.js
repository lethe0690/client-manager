function ping(req, res) {
    res.json(JSON.stringify({version: process.env.version ? process.env.version : 'v1'}));
}


module.exports = {ping};