const BATCH_SIZE = 50;

export async function translateCaiyun(
  lines: string[],
  token: string
): Promise<string[]> {
  const translated: string[] = [];

  for (let i = 0; i < lines.length; i += BATCH_SIZE) {
    const batch = lines.slice(i, i + BATCH_SIZE);
    const resp = await fetch(
      "http://api.interpreter.caiyunai.com/v1/translator",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Authorization": `token ${token}`,
        },
        body: JSON.stringify({
          source: batch,
          trans_type: "ja2zh",
          request_id: `pixiv-web-${i}`,
        }),
      }
    );

    const result = await resp.json();
    translated.push(...(result.target || batch));

    if (i + BATCH_SIZE < lines.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return translated;
}
