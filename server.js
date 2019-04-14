var express = require('express');
var app = express();
var urlparse = require('url');
var bodyParser = require('body-parser');
var dns = require('dns');
var MongoClient = require('mongodb').MongoClient;
// mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]] is the URL format
var mongourl = "mongodb://localhost:27017/";
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
        var ip = (req.headers["X-Forwarded-For"] || req.headers["x-forwarded-for"] || '').split(',')[0] || req.client.remoteAddress;
        res.json({ "ipaddress": ip, "language": req.headers['accept-language'], "software": req.get('User-Agent') })
    })

    app.use(bodyParser.urlencoded({ extended: false }));
    app.post('/api/shorturl/new', function (req, res) {
        url = urlparse.parse(req.body.url, true);
        if (url.host == null) {
            res.json({ "error": "invalid URL" });
            res.end();
        }
        else {
            dns.resolve(url.host, function (err, addresses) {
                if (err) {
                    res.json({ "error": "invalid URL" });
                    res.end();
                }
                else {
                    MongoClient.connect(mongourl, { useNewUrlParser: true }, function (err, db) {
                        if (err) throw err;
                        var dbo = db.db("mydb");
                        dbo.collection("urlshortener").find({ "original_url": req.body.url }).toArray(function (err, rs) {
                            if (err)
                                throw(err)
                            else {

                                if (rs.length == 0) {

                                    dbo.collection("urlshortener").find().sort({ "_id": -1 }).limit(1).toArray(function (err, rs) {
                                        if (rs.length == 0)
                                            var autoIndex = 1;
                                        else
                                            var autoIndex = parseInt(rs[0]._id) + 1;
                                        if (err)
                                            throw err;
                                        else {

                                            // autoIncrement.getNextSequence("mydb", "urlshortener", function (err, autoIndex) {
                                            myobj = { "_id": autoIndex, "original_url": req.body.url }
                                            dbo.collection("urlshortener").insertOne(myobj, function (err) {
                                                if (err)
                                                    throw err;
                                                else {
                                                    var temp = { "original_url": req.body.url, "short_url": autoIndex };
                                                    db.close();
                                                }
                                                res.json(temp);
                                            }
                                            )
                                        }
                                        //  })
                                    })
                                }

                                else
                                    res.json({ "original_url": req.body.url, "short_url": rs[0]._id });
                            }

                        })

                    })
                }
            });
        }
    }
    )

    app.get('/api/shorturl/new/:id?', function (req, res) {
        if (req.params.id == null)
            res.json({ "error": "Wrong Format" })
        else {
            MongoClient.connect(mongourl, { useNewUrlParser: true }, function (err, db) {
                if (err) throw err;
                var dbo = db.db("mydb");
                dbo.collection("urlshortener").find({ "_id": parseInt(req.params.id) }).toArray(function (err, rs) {


                    if (err)
                        throw(err)
                    else
                        res.redirect(rs[0].original_url);
                    res.end();
                })

            })

        }
    })
});