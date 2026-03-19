import { NextRequest, NextResponse } from 'next/server'

// Disable caching for this API route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper function to extract cookies from set-cookie header
function extractCookies(setCookieHeader: string | null): string {
  if (!setCookieHeader) return ''
  
  // Extract JSESSIONID and other cookies
  const cookies: string[] = []
  const cookieStrings = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  
  for (const cookieStr of cookieStrings) {
    // Extract cookie name and value (before first semicolon)
    const match = cookieStr.match(/^([^=]+=[^;]+)/)
    if (match) {
      cookies.push(match[1])
    }
  }
  
  return cookies.join('; ')
}

export async function GET(request: NextRequest) {
  let retryCount = 0
  const maxRetries = 3

  while (retryCount < maxRetries) {
    try {
      // Step 1: Establish session with ECI website
      const sessionUrl = `https://electoralsearch.eci.gov.in/?t=${Date.now()}&retry=${retryCount}`
      const sessionResponse = await fetch(sessionUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
        redirect: 'follow',
      })

      if (!sessionResponse.ok) {
        throw new Error(`Session establishment failed: ${sessionResponse.status} ${sessionResponse.statusText}`)
      }

      // Extract cookies properly
      const setCookieHeader = sessionResponse.headers.get('set-cookie')
      const cookies = extractCookies(setCookieHeader)
      
      // Also get cookies from response if available
      const allCookies = sessionResponse.headers.get('cookie') || cookies

      // Step 2: Generate CAPTCHA with proper session
      const captchaUrl = `https://gateway-voters.eci.gov.in/api/v1/captcha-service/generateCaptcha?t=${Date.now()}&r=${retryCount}`
      const captchaResponse = await fetch(captchaUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'en-IN,en;q=0.9,hi;q=0.8,mr;q=0.7',
          'applicationname': 'ELECTORAL-SEARCH',
          'appname': 'ELECTORAL-SEARCH',
          'channelidobo': 'ELECTORAL-SEARCH',
          'content-type': 'application/json',
          'origin': 'https://electoralsearch.eci.gov.in',
          'referer': 'https://electoralsearch.eci.gov.in/',
          'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
          'cache-control': 'no-cache, no-store, must-revalidate',
          'pragma': 'no-cache',
          ...(allCookies && { 'cookie': allCookies }),
        },
        cache: 'no-store',
        redirect: 'follow',
      })

      // Check if response is OK
      if (!captchaResponse.ok) {
        const errorText = await captchaResponse.text()
        console.error(`CAPTCHA API returned ${captchaResponse.status}:`, errorText.substring(0, 200))
        
        // If 400 or 500, retry
        if (captchaResponse.status >= 400 && retryCount < maxRetries - 1) {
          retryCount++
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          continue
        }
        
        throw new Error(`CAPTCHA API error: ${captchaResponse.status} ${captchaResponse.statusText}`)
      }

      // Parse response - handle both JSON and text
      let data: any
      const contentType = captchaResponse.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        data = await captchaResponse.json()
      } else {
        const text = await captchaResponse.text()
        try {
          data = JSON.parse(text)
        } catch {
          throw new Error(`Invalid response format: ${text.substring(0, 100)}`)
        }
      }

      // Check for success
      if (data.status === 'Success' && data.statusCode === 200 && data.captcha && data.id) {
        // Return response with no-cache headers
        return NextResponse.json(
          {
            success: true,
            captcha: data.captcha,
            id: data.id,
            timestamp: Date.now(),
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
        // Check if we should retry
        if (retryCount < maxRetries - 1) {
          retryCount++
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          continue
        }
        
        console.error('CAPTCHA generation failed - Response:', JSON.stringify(data, null, 2))
        return NextResponse.json(
          { 
            success: false, 
            error: data.message || data.error || 'Failed to generate CAPTCHA. Please try refreshing the page.' 
          },
          { status: 400 }
        )
      }
    } catch (error: any) {
      console.error(`CAPTCHA API error (attempt ${retryCount + 1}/${maxRetries}):`, error)
      
      // Retry on network errors
      if (retryCount < maxRetries - 1 && (
        error.message?.includes('fetch') || 
        error.message?.includes('network') ||
        error.message?.includes('timeout')
      )) {
        retryCount++
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        continue
      }
      
      // Final error after all retries
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Error while generating the captcha. Please try again.' 
        },
        { status: 500 }
      )
    }
  }

  // Should never reach here, but just in case
  return NextResponse.json(
    { success: false, error: 'Failed to generate CAPTCHA after multiple attempts. Please refresh the page.' },
    { status: 500 }
  )
}

