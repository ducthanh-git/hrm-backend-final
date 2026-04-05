export default async function handler(req, res) {
  const url = "https://railway.com/project/287ab9de-1c29-42c6-a6b4-ce59c5a90a8a?" + req.url;

  const response = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: req.headers.authorization || ""
    },
    body: req.method !== "GET"
      ? JSON.stringify(req.body)
      : undefined
  });

  const data = await response.text();

  res.status(response.status).send(data);
}