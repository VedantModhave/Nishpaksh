import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

// Disable caching for this API route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Load ward data from public folder
    const wardDataPath = path.join(process.cwd(), 'public', 'ward-data.geojson')

    let raw: string | null = null
    try {
      raw = await readFile(wardDataPath, 'utf8')
    } catch (error) {
      console.error('Failed to read ward-data.geojson:', error)
      return NextResponse.json(
        { error: 'Ward GeoJSON not found. Please ensure ward-data.geojson exists in the public folder.' },
        { status: 404 }
      )
    }

    if (!raw) {
      return NextResponse.json(
        { error: 'Ward GeoJSON file is empty' },
        { status: 404 }
      )
    }

    const json = JSON.parse(raw)

    return NextResponse.json(json, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error('ward-data error:', error)
    return NextResponse.json(
      { error: 'Failed to load ward data' },
      { status: 500 }
    )
  }
}

