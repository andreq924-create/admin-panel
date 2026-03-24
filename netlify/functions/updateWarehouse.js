// netlify/functions/updateWarehouse.js (Node 18+)
import fetch from 'node-fetch';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Fine-grained token
const REPO = 'твое_имя_пользователя/имя_репозитория'; // пример: 'itogiv/admin-panel'
const FILE_PATH = 'warehouse.json';
const BRANCH = 'main';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let warehouse;
  try {
    const body = JSON.parse(event.body);
    warehouse = body.warehouse;
    if (!warehouse) {
      return { statusCode: 400, body: 'No warehouse data provided' };
    }
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  try {
    // 1️⃣ Получаем SHA текущего файла
    const getResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`, // Bearer для fine-grained token
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    const getText = await getResponse.text();
    if (!getResponse.ok) {
      // выводим полный текст ошибки GitHub
      throw new Error(`Failed to get file info: ${getText}`);
    }

    const getData = JSON.parse(getText);
    const sha = getData.sha;

    // 2️⃣ Подготавливаем PUT запрос для обновления файла
    const putResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: `Обновление warehouse.json через Netlify Function`,
          content: Buffer.from(JSON.stringify(warehouse, null, 2)).toString('base64'),
          sha: sha,
          branch: BRANCH,
        }),
      }
    );

    const putText = await putResponse.text();
    if (!putResponse.ok) {
      throw new Error(`Failed to update file: ${putText}`);
    }

    const putData = JSON.parse(putText);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: putData }),
    };

  } catch (err) {
    console.error('GitHub API error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
        stack: err.stack
      }),
    };
  }
}