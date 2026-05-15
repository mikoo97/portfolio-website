const https = require('https');

exports.handler = async (event) => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = 'mikoo97/portfolio-data';
  const FILE = 'data.json';

  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'portfolio-website'
  };

  // GET data
  if (event.httpMethod === 'GET') {
    return new Promise((resolve) => {
      https.get({
        hostname: 'api.github.com',
        path: `/repos/${REPO}/contents/${FILE}`,
        headers
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const json = JSON.parse(data);
          const content = JSON.parse(Buffer.from(json.content, 'base64').toString());
          resolve({
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ data: content, sha: json.sha })
          });
        });
      });
    });
  }

  // PUT data
  if (event.httpMethod === 'PUT') {
    const { data, sha } = JSON.parse(event.body);
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const body = JSON.stringify({ message: 'update portfolio data', content, sha });

    return new Promise((resolve) => {
      const req = https.request({
        hostname: 'api.github.com',
        path: `/repos/${REPO}/contents/${FILE}`,
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': body.length }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ ok: res.statusCode === 200 || res.statusCode === 201 })
        }));
      });
      req.write(body);
      req.end();
    });
  }

  return { statusCode: 405, body: 'Method not allowed' };
};