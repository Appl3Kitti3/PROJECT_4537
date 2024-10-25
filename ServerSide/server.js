const http = require('http');
const jwt = require('jsonwebtoken');
const url = require('url');

const API_EndPoints = [
    "/api/register",
    "/api/login",
    "/api/logout",

]

// Used for CORS, change when Static HTML is hosted
const staticHTMLURLLINK = "*";

http.createServer((req, res) => {
    console.log("hi");
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>Hello World</h1>');
}
).listen(8080);

class Server {
    constructor(port) {
        this.port = port;
        this.server = http.createServer(this.handleRequest.bind(this));
    }

    handleRequest(req, res)
    {
        res.setHeader("Access-Control-Allow-Origin", staticHTMLURLLINK);
        // Probably all HTTP Methods
        res.setHeader('Access-Control-Allow-Methods', "GET, POST, OPTIONS");
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        const parsedUrl = url.parse(req.url, true);
        const method = req.method;

        // Preflight request
        if (method === "OPTIONS")
        {
            res.writeHead(200);
            res.end();
            return;
        }

        // 

        const postMethod = (method === "POST");
        const getMethod = (method === "GET");

        switch (parsedUrl.pathname)
        {
            case "/api/register":
                    if (postMethod) this.register(req, res);
                break;
            case "/api/login":
                    if (postMethod) this.login(req, res);
                break;
            case "/api/logout":
                    if (postMethod) this.logout(req, res);
                break;
            default:
                res.writeHead(404);
                res.end();
        }
    }

    start()
    {
        this.server.listen(this.port);
    }
}

