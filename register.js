exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER   = process.env.REPO_OWNER;
  const REPO_NAME    = process.env.REPO_NAME;

  if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfigured" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { uid, firstName, lastName, phone, university, studentId } = payload;
  if (!uid || !firstName || !lastName || !phone || !university) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
  }

  const data = {
    uid, firstName, lastName, phone, university,
    studentId: studentId || "N/A",
    timestamp: new Date().toISOString(),
    admitted: false,
  };

  const base64Content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

  const ghRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/data/${uid}.json`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Registration: ${firstName} ${lastName}`,
        content: base64Content,
      }),
    }
  );

  if (!ghRes.ok) {
    const err = await ghRes.text();
    return { statusCode: 500, body: JSON.stringify({ error: "GitHub error", detail: err }) };
  }

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ success: true, uid }),
  };
};
