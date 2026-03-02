// Design IQ — OpenAI Vision Proxy
// Sends room photos to OpenAI's image editing API for redesign mockups

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY not set. Add it in your Vercel project settings under Environment Variables.",
    });
  }

  try {
    const { image, prompt } = req.body;

    if (!image || !prompt) {
      return res.status(400).json({ error: "Missing 'image' or 'prompt' in request body" });
    }

    // Convert base64 to Blob for multipart upload
    const imageBuffer = Buffer.from(image, "base64");
    const imageBlob = new Blob([imageBuffer], { type: "image/png" });

    const formData = new FormData();
    formData.append("image", imageBlob, "room.png");
    formData.append("prompt", prompt);
    formData.append("model", "gpt-image-1.5");
    formData.append("n", "1");
    formData.append("size", "1024x1024");
    formData.append("quality", "medium");
    formData.append("output_format", "jpeg");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
