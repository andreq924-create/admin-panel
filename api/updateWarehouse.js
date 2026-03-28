export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = 'andreq924-create/admin-panel';
  const FILE_PATH = 'warehouse.json';
  const BRANCH = 'main';

  try {
    const { warehouse } = req.body;

    if (!warehouse) {
      return res.status(400).json({ error: 'No warehouse data provided' });
    }

    // 1️⃣ Получаем SHA текущего файла
    const getResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    if (!getResponse.ok) {
      const text = await getResponse.text();
      throw new Error(`Failed to get file info: ${text}`);
    }

    const getData = await getResponse.json();
    const sha = getData.sha;

    // 2️⃣ Обновляем файл
    const putResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({
          message: 'Обновление warehouse.json через Vercel API',
          content: Buffer.from(
            JSON.stringify(warehouse, null, 2)
          ).toString('base64'),
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

    return res.status(200).json(putData);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}