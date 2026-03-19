import { NextRequest, NextResponse } from 'next/server'

// Disable caching for this API route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// State code mapping
const STATE_CODES: Record<string, string> = {
  'maharashtra': 'S13',
  'delhi': 'S07',
  'karnataka': 'S10',
  'tamil nadu': 'S22',
  'west bengal': 'S25',
  'uttar pradesh': 'S24',
  'gujarat': 'S06',
  'rajasthan': 'S20',
  'madhya pradesh': 'S12',
  'kerala': 'S11',
  'andhra pradesh': 'S01',
  'telangana': 'S29',
  'bihar': 'S04',
  'odisha': 'S18',
  'punjab': 'S19',
  'haryana': 'S08',
  'assam': 'S03',
  'jharkhand': 'S09',
  'chhattisgarh': 'S26',
  'uttarakhand': 'S28',
  'himachal pradesh': 'S02',
  'goa': 'S05',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { epicNumber, state, captchaText, captchaId } = body

    if (!epicNumber || !captchaText || !captchaId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get state code
    const stateCd = state ? STATE_CODES[state.toLowerCase()] : undefined

    // Establish session first with cache-busting
    const sessionResponse = await fetch(`https://electoralsearch.eci.gov.in/?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    })

    const cookies = sessionResponse.headers.get('set-cookie')

    // Prepare request body
    const requestBody: any = {
      isPortal: true,
      epicNumber: epicNumber.toUpperCase(),
      captchaData: captchaText.toLowerCase(),
      captchaId: captchaId,
      securityKey: 'na',
    }

    if (stateCd) {
      requestBody.stateCd = stateCd
    }

    // Call search API with cache-busting
    const searchResponse = await fetch(
      'https://gateway-voters.eci.gov.in/api/v1/elastic/search-by-epic-from-national-display',
      {
        method: 'POST',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'en-IN,en;q=0.9',
          'applicationname': 'ELECTORAL-SEARCH',
          'appname': 'ELECTORAL-SEARCH',
          'channelidobo': 'ELECTORAL-SEARCH',
          'content-type': 'application/json',
          'origin': 'https://electoralsearch.eci.gov.in',
          'referer': 'https://electoralsearch.eci.gov.in/',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
          'cache-control': 'no-cache, no-store, must-revalidate',
          'pragma': 'no-cache',
          ...(cookies && { 'cookie': cookies }),
        },
        body: JSON.stringify(requestBody),
        cache: 'no-store',
      }
    )

    const responseData = await searchResponse.json()

    if (searchResponse.status === 200) {
      // Parse response
      if (Array.isArray(responseData) && responseData.length > 0) {
        const voterData = responseData[0].content || responseData[0]
        
        return NextResponse.json(
          {
            success: true,
            data: voterData,
          },
          {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          }
        )
      } else {
        return NextResponse.json(
          { success: false, message: 'No voter details found for this EPIC number' },
          { status: 404 }
        )
      }
    } else {
      // Handle specific error cases
      let errorMessage = 'Failed to fetch voter details'
      
      if (searchResponse.status === 400) {
        errorMessage = 'Invalid CAPTCHA or EPIC number. Please try again with a new CAPTCHA.'
      } else if (searchResponse.status === 401) {
        errorMessage = 'Session expired. Please refresh the page.'
      } else if (searchResponse.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.'
      }
      
      console.error('Search API error:', searchResponse.status, responseData)
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: searchResponse.status }
      )
    }
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

