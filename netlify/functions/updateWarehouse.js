// netlify/functions/updateWarehouse.js (Node 18+)

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'твое_имя_пользователя/имя_репозитория'; // пример: 'itogiv/admin-panel'
const FILE_PATH = 'warehouse.json';
const BRANCH = 'main';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let warehouse;
  try {
    const body = JSON.parse(event.body);
    warehouse = body.warehouse;
    if (!warehouse) throw new Error('No warehouse data provided');
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message })
    };
  }

  try {
    // Получаем SHA текущего файла
    const getResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!getResponse.ok) {
      const text = await getResponse.text();
      throw new Error(`Failed to get file info: ${text}`);
    }

    const getData = await getResponse.json();
    const sha = getData.sha;

    // PUT запрос для обновления файла
    const putResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: `Обновление warehouse.json через Node.js`,
          content: Buffer.from(JSON.stringify(warehouse, null, 2)).toString('base64'),
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
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: putData })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};