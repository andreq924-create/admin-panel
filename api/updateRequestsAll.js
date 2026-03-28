// netlify/functions/updateRequestsAll.js

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'andreq924-create/admin-panel'; // username/repo
const FILE_PATH = 'requests_all.json'; // Путь до файла с заявками
const BRANCH = 'main';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { requests } = JSON.parse(event.body);
    if (!requests || !Array.isArray(requests)) {
      return { statusCode: 400, body: 'Invalid requests data' };
    }

    // 1️⃣ Получаем SHA текущего файла requests_all.json
    const getResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
        },
      }
    );

    if (!getResponse.ok) {
      const text = await getResponse.text();
      throw new Error(`Failed to get file info: ${text}`);
    }

    const getData = await getResponse.json();
    const sha = getData.sha;

    // 2️⃣ Обновляем файл с заявками на GitHub
    const putResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
        },
        body: JSON.stringify({
          message: 'Обновление заявок в requests_all.json через Netlify Functions',
          content: Buffer.from(JSON.stringify(requests, null, 2)).toString('base64'),
          sha: sha,
          branch: BRANCH,
        }),
      }
    );

    if (!putResponse.ok) {
      const text = await putResponse.text();
      throw new Error(`Failed to update file: ${text}`);
    }

    const putData = await putResponse.json();
    return { statusCode: 200, body: JSON.stringify(putData) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};