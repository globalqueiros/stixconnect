export async function getZoomToken() {
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;
  const accountId = process.env.ZOOM_ACCOUNT_ID!;

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error("Erro ao gerar token Zoom: " + JSON.stringify(data));
  return data.access_token;
}
