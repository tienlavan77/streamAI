import { BACKEND_ENDPOINTS } from "@/lib/backend";

export async function POST(request) {
  const body = await request.json();
  const message = (body?.message ?? "").toString();

  const backendUrl = BACKEND_ENDPOINTS.chat;

  try {
    const backendRes = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!backendRes.ok) {
      throw new Error(`Backend trả về lỗi ${backendRes.status}`);
    }

    const data = await backendRes.json();

    return Response.json({ reply: data.reply ?? data.message ?? JSON.stringify(data) });
  } catch (error) {
    console.error("[api/chat] Lỗi gọi backend:", error.message);

    return Response.json(
      { reply: `Không gọi được backend: ${error.message}` },
      { status: 502 }
    );
  }
}