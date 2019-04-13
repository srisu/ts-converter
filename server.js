var express = require('express');
var app = express();
app.listen(3000, function (req, res) {
    app.get('/api/timestamp/:ts?', function (req, res) {
        var ts = req.params.ts;
        if (req.params.ts == null) {
            res.json({ "unix": new Date().getTime(), "utc": new Date().toUTCString() });
        }
        else {
            if (!(isNaN(new Date(ts).getTime()))) {
                res.json({ "unix": new Date(ts).getTime(), "utc": new Date(ts).toUTCString() });
            }
            else {
                if (!(ts.includes('-') && !(isNaN(new Date(parseInt(ts)).getTime()))))
                    res.json({ "unix": new Date(parseInt(ts)).getTime(), "utc": new Date(parseInt(ts)).toUTCString() });
                else {
                    res.json({ "error": "Invalid Date" });
                }

            }
        }
    })
    app.get('/whoami', function (req, res) {
        var ip =(req.headers["X-Forwarded-For"] || req.headers["x-forwarded-for"] || '').split(',')[0] || req.client.remoteAddress;
        res.json({ "ipaddress": ip, "language": req.headers['accept-language'], "software": req.get('User-Agent') })
    })
});