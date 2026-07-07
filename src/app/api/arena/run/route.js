/**
 * API route proxy: forwards arena quiz generation requests to the Python backend.
 * This eliminates hardcoded localhost:8000 URLs from frontend components.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export async function POST(request) {
  try {
    const body = await request.json()

    const res = await fetch(`${BACKEND_URL}/arena/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (error) {
    return Response.json(
      { success: false, error: 'Could not reach the backend. Make sure it is running.' },
      { status: 502 }
    )
  }
}
