import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const API_BASE =
  process.env.INTERNAL_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { voter_id, image, full_name } = body

    if (!voter_id || !image) {
      return NextResponse.json(
        { success: false, error: 'voter_id and image are required' },
        { status: 400 }
      )
    }

    if (!API_BASE) {
      throw new Error('API base URL not configured. Set INTERNAL_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL in .env.local')
    }

    // Temporary log to verify env value
    console.log('API BASE:', process.env.NEXT_PUBLIC_API_BASE_URL)

    const response = await fetch(`${API_BASE}/face/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        voter_id,
        image,
        full_name,
      }),
    })

    const text = await response.text()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Backend returned empty response. The service might be starting up. Please try again in a moment.' },
        { status: response.status || 500 }
      )
    }

    let data: any
    try {
      data = JSON.parse(text)
    } catch (parseError) {
      console.error('Failed to parse backend response:', text.substring(0, 200))
      return NextResponse.json(
        { success: false, error: `Backend returned invalid response: ${text.substring(0, 100)}` },
        { status: response.status || 500 }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || data.message || data.error || 'Registration failed' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      ...data,
    })
  } catch (error: any) {
    console.error('Face registration error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
