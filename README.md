# Voter ID Checker - Election Commission of India

> **Nishpaksh** (निष्पक्ष - Impartial) - Open Election Voting System v1.0
> 
> **Documentation Version**: 1.0.0  
> **Last Updated**: March 2026  
> **Author**: Nishpaksh Team  
> **Status**: Production Ready ✅

A comprehensive voter ID verification system that fetches voter details from the **Election Commission of India (ECI)** APIs. Available in both Python CLI and Next.js web interface implementations.

## 🎯 Project Overview

This application reverse-engineers the ECI website's API endpoints to provide a clean, user-friendly interface for checking voter details using EPIC (Electoral Photo Identity Card) numbers.

### Two Implementations:
1. **Python CLI Script** (`main.py`) - Terminal-based application
2. **Next.js Web App** (`voter-checker/`) - Modern web interface with React

---

## 🚀 Quick Start

### Python Version
```bash
pip install -r requirements.txt
python main.py
```

### Next.js Web App
```bash
cd voter-checker
npm install
npm run dev
# Open http://localhost:3000
```

---

## 🏗️ Architecture

### Core Workflow
```
1. Establish Session → 2. Generate CAPTCHA → 3. User Solves CAPTCHA → 4. Search Voter → 5. Display Results
```

### Key ECI APIs Used
- **CAPTCHA API**: `https://gateway-voters.eci.gov.in/api/v1/captcha-service/generateCaptcha`
- **Search API**: `https://gateway-voters.eci.gov.in/api/v1/elastic/search-by-epic-from-national-display`

---

## 📂 Project Structure

```
Hacksync/
├── main.py                                    # Python CLI implementation
├── requirements.txt                           # Python dependencies (Pillow, requests)
├── README.md                                  # This file
└── voter-checker/                            # Next.js web app
    ├── src/
    │   ├── app/
    │   │   ├── api/
    │   │   │   ├── generate-captcha/route.ts  # Backend: CAPTCHA generation
    │   │   │   └── search-voter/route.ts      # Backend: Voter search
    │   │   ├── page.tsx                       # Frontend: Main page with search logic
    │   │   ├── layout.tsx                     # App layout
    │   │   └── globals.css                    # Tailwind CSS styles
    │   └── components/
    │       ├── VoterForm.tsx                  # Search form with CAPTCHA
    │       └── VoterDetails.tsx               # Results display
    ├── package.json                           # Node dependencies
    ├── tailwind.config.ts                     # Tailwind configuration
    └── tsconfig.json                          # TypeScript configuration
```

---

## 🐍 Python Implementation (`main.py`)

### Class: `VoterIDFetcher`

#### Key Methods:

**1. `establish_session()`**
- Visits `https://electoralsearch.eci.gov.in/` to get session cookies (JSESSIONID)
- Required before API calls work

**2. `generate_captcha()`**
- Fetches CAPTCHA from ECI API
- Decodes base64 image → saves as `captcha.png`
- Auto-opens image for user
- Returns `captcha_id` for later use

**3. `get_captcha_input()`**
- Prompts user to manually enter CAPTCHA text

**4. `call_search_api()`**
- Sends search request with EPIC number, CAPTCHA, and state code
- Returns nested JSON response

**5. `extract_voter_details()`**
- Parses response: `response[0].content` contains actual voter data
- Maps 20+ fields (name, age, polling station, etc.)
- Returns clean JSON

### State Code Mapping

The script supports 22 states with their respective codes:

| State | Code | State | Code |
|-------|------|-------|------|
| Maharashtra | S13 | Delhi | S07 |
| Karnataka | S10 | Gujarat | S06 |
| Tamil Nadu | S22 | West Bengal | S25 |
| Uttar Pradesh | S24 | Rajasthan | S18 |
| Madhya Pradesh | S12 | Andhra Pradesh | S01 |
| Telangana | S23 | Bihar | S04 |
| Odisha | S17 | Kerala | S11 |
| Punjab | S16 | Haryana | S08 |
| Assam | S03 | Jharkhand | S34 |
| Chhattisgarh | S36 | Uttarakhand | S35 |
| Himachal Pradesh | S09 | Goa | S05 |

### Usage Example

```bash
$ python main.py
Enter EPIC number: XWC9340241
Enter state (optional): Maharashtra
[CAPTCHA image opens]
Enter CAPTCHA text: abc123

Voter Details:
{
  "epicNumber": "XWC9340241",
  "fullName": "jatin gorana",
  "age": 19,
  "gender": "M",
  "stateName": "Maharashtra",
  ...
}
```

---

## 🌐 Next.js Web Implementation

### Frontend Components

#### 1. **`page.tsx`** (Main Page)
- **State Management:**
  - `voterData` - Stores search results
  - `loading` - Shows loading state
  - `error` - Displays error messages

- **`handleSearch()` Function:**
  - Calls `/api/search-voter` with form data
  - Handles success/error responses
  - Passes data to `VoterDetails` component

#### 2. **`VoterForm.tsx`** (Search Form Component)

**Features:**
- EPIC number input (auto-uppercase)
- State dropdown (22 states)
- **CAPTCHA Section:**
  - Auto-loads on mount via `useEffect`
  - Displays base64 CAPTCHA image
  - **Refresh button** with cache-busting (`?t=${Date.now()}`)
  - Shows "Fresh CAPTCHA" badge with pulse animation
- CAPTCHA text input (auto-lowercase)

**Key Implementation (CAPTCHA Refresh):**
```typescript
const fetchCaptcha = async () => {
  const response = await fetch(`/api/generate-captcha?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache, no-store' }
  })
  const data = await response.json()
  setCaptchaImage(data.captcha)
  setCaptchaId(data.id)
  setShowFreshBadge(true)
}
```

#### 3. **`VoterDetails.tsx`** (Results Display Component)

**InfoCard Component:**
- Icon + Label + Value layout
- 16+ cards for different voter details

**Displayed Fields:**
- **Personal**: Name, Age, Gender, Relative's name
- **Location**: State, District, Constituency
- **Electoral**: Part number, Serial number, EPIC number
- **Polling**: Station name, Address, Room details

**Raw JSON View:**
- Collapsible `<details>` element
- Shows complete API response for debugging

### Backend API Routes

#### 1. **`/api/generate-captcha/route.ts`**

```typescript
export const dynamic = 'force-dynamic'  // Disable Next.js caching
export const revalidate = 0             // No revalidation

export async function GET(request: NextRequest) {
  // 1. Establish session (visit main ECI website)
  const sessionResponse = await fetch('https://electoralsearch.eci.gov.in/...')
  const cookies = sessionResponse.headers.get('set-cookie')
  
  // 2. Fetch CAPTCHA with session cookies
  const captchaResponse = await fetch(
    'https://gateway-voters.eci.gov.in/api/v1/captcha-service/generateCaptcha?t=...',
    { headers: { cookie: cookies } }
  )
  
  // 3. Return with no-cache headers
  return NextResponse.json(
    { success: true, captcha: base64Image, id: sessionId },
    { headers: { 'Cache-Control': 'no-cache, no-store, max-age=0' } }
  )
}
```

**Cache-Busting Techniques:**
- URL timestamp: `?t=${Date.now()}`
- HTTP headers: `Cache-Control: no-cache, no-store, must-revalidate`
- Fetch options: `cache: 'no-store'`
- Next.js config: `dynamic = 'force-dynamic'`

#### 2. **`/api/search-voter/route.ts`**

```typescript
export async function POST(request: NextRequest) {
  const { epicNumber, state, captchaText, captchaId } = await request.json()
  
  // 1. Map state name to code (Maharashtra → S13)
  const stateCd = STATE_CODES[state.toLowerCase()]
  
  // 2. Call ECI search API
  const response = await fetch(
    'https://gateway-voters.eci.gov.in/api/v1/elastic/search-by-epic-from-national-display',
    {
      method: 'POST',
      body: JSON.stringify({
        isPortal: true,
        epicNumber: epicNumber.toUpperCase(),
        captchaData: captchaText.toLowerCase(),
        captchaId,
        securityKey: "na",
        stateCd
      })
    }
  )
  
  // 3. Parse response
  const data = await response.json()
  const voterData = data[0]?.content  // Extract from nested structure
  
  return NextResponse.json({ success: true, data: voterData })
}
```

---

## 🔑 API Technical Details

### Request Format (Critical!)

```json
{
  "isPortal": true,           // Required boolean
  "epicNumber": "XWC9340241", // Uppercase
  "captchaData": "abc123",    // Lowercase
  "captchaId": "52E9F...",    // From CAPTCHA generation
  "securityKey": "na",        // Fixed value
  "stateCd": "S13"            // Optional, improves speed
}
```

### Response Structure

```json
[
  {
    "index": "national-electoral-display",
    "id": "52481130_XWC9340241_S13",
    "content": {                      // ← Actual data is here!
      "epicNumber": "XWC9340241",
      "fullName": "jatin gorana",
      "applicantFirstName": "JATIN",
      "applicantLastName": "GORANA",
      "relativeFullName": "bhuraram gorana",
      "relationType": "FTHR",
      "age": 19,
      "gender": "M",
      "stateName": "Maharashtra",
      "districtValue": "Mumbai Suburban",
      "asmblyName": "Borivali",
      "acNumber": 152,
      "prlmntName": "Mumbai North",
      "prlmntNo": "26",
      "partNumber": "221",
      "partSerialNumber": 1008,
      "sectionNo": 21,
      "psbuildingName": "Priyadarshni Primary School",
      "buildingAddress": "Charkop Sector 7...",
      "psRoomDetails": "Ground Floor Room No. 8",
      "partName": "Charkop Sector 7..."
    }
  }
]
```

### Session Management

- Must visit `https://electoralsearch.eci.gov.in/` first
- Extract `JSESSIONID` cookie
- Include cookie in CAPTCHA and search requests
- Cookie expires after ~30 minutes

---

## 🎨 Styling (Tailwind CSS)

### Key Design Elements

**Layout Classes:**
- `flex`, `grid`, `gap-4`, `p-8`
- Responsive: `md:grid-cols-2`, `md:col-span-2`

**Component Styling:**
- Cards: `rounded-2xl`, `shadow-xl`, `bg-white`
- Buttons: `bg-blue-600`, `hover:bg-blue-700`, `disabled:bg-gray-400`
- Forms: `focus:ring-2`, `focus:ring-blue-500`
- Animations: `animate-pulse` (for Fresh CAPTCHA badge)

### Color Scheme

- **Background**: `bg-gradient-to-br from-blue-50 to-indigo-100`
- **Primary**: Blue (`blue-600`, `blue-700`)
- **Success**: Green (`green-400`, `green-600`)
- **Error**: Red (`red-50`, `red-800`)
- **Neutral**: Gray (`gray-50` to `gray-900`)

---

## 🐛 Common Issues & Solutions

### 1. CAPTCHA Not Refreshing

**Problem**: Same CAPTCHA appears after clicking refresh

**Fixed via:**
- Added `?t=${Date.now()}` to all requests
- Set `cache: 'no-store'` in fetch options
- Added `Cache-Control: no-cache` headers
- Disabled Next.js route caching with `dynamic = 'force-dynamic'`

### 2. 400 Error on Search

**Causes:**
- Wrong CAPTCHA text (case-sensitive)
- Missing `isPortal: true` in request
- Wrong field names (was `epic`, now `epicNumber`)
- Missing `securityKey: "na"`

**Solution**: Ensure exact request format as documented above

### 3. Empty Results or Null Data

**Causes:**
- Data is nested in `response[0].content`, not root
- Field names have changed over time

**Solution**: Always access `data[0]?.content` for voter details

### 4. Session Expired Error

**Causes:**
- JSESSIONID cookie expired
- More than 30 minutes between CAPTCHA generation and search

**Solution:**
- Re-establish session before each CAPTCHA generation
- Generate fresh CAPTCHA if more than 5 minutes have passed

---

## 📊 Data Flow Diagram

```
┌─────────────────────┐
│   User Input        │
│ (EPIC + CAPTCHA)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  VoterForm.tsx      │
│  (validates input)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  page.tsx           │
│  (handleSearch)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ /api/search-voter   │
│  (POST request)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ECI Search API     │
│  (external call)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Parse response      │
│ [0].content         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Return to page.tsx │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ VoterDetails.tsx    │
│  (display results)  │
└─────────────────────┘
```

---

## 🎯 Features Implemented

✅ Auto-generate CAPTCHA from ECI API  
✅ Refresh CAPTCHA without page reload  
✅ Visual feedback (Fresh CAPTCHA badge)  
✅ State-based search optimization  
✅ 20+ voter detail fields displayed  
✅ Mobile responsive design  
✅ Comprehensive error handling  
✅ Loading states with spinners  
✅ Raw JSON debug view  
✅ Icon-based info cards  
✅ No caching issues  
✅ Session management  
✅ Both CLI and web interfaces  

---

## 🚀 Deployment

### Development

**Python:**
```bash
python main.py
```

**Next.js:**
```bash
cd voter-checker
npm run dev
# Visit http://localhost:3000
```

### Production

**Next.js Build:**
```bash
npm run build
npm start
```

**Deploy to Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd voter-checker
vercel
```

Vercel auto-detects Next.js and requires zero configuration.

---

## 📋 Requirements

### Python Version
- Python 3.7+
- Pillow (image handling)
- requests (HTTP library)

### Next.js Version
- Node.js 18+
- React 18
- Next.js 14
- TypeScript
- Tailwind CSS
- Lucide React (icons)

---

## 🔒 Important Notes

1. **Legal Compliance**: This tool uses publicly accessible ECI APIs. Ensure compliance with terms of service.

2. **Rate Limiting**: Be mindful of API rate limits. Don't make excessive requests.

3. **CAPTCHA Validity**: CAPTCHAs expire quickly. Use fresh CAPTCHAs for each search.

4. **Data Privacy**: Voter information is public data, but handle responsibly.

5. **Session Cookies**: Required for API access. Automatically managed by both implementations.

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Add more state codes
- Implement CAPTCHA solving automation (OCR)
- Add batch search functionality
- Export results to PDF/CSV
- Add search by name functionality
- Improve error messages
- Add unit tests

---

## 📝 License

This project is for educational purposes. The data belongs to the Election Commission of India.

---

## 📧 Support

For issues or questions:
1. Check the Common Issues section above
2. Review the API documentation
3. Ensure dependencies are correctly installed
4. Verify network connectivity to ECI servers

---

## 🙏 Acknowledgments

- Election Commission of India for providing public APIs
- Next.js team for the excellent framework
- Tailwind CSS for the utility-first CSS framework
- Lucide for the beautiful icon set

---

**Built with ❤️ for transparent electoral processes**
   - Polling Station
   - And other available details

## Example Output

```json
{
  "name": "JOHN DOE",
  "relative_name": "FATHER NAME",
  "state": "Maharashtra",
  "district": "Mumbai",
  "assembly_constituency": "Andheri West",
  "polling_station": "ABC School",
  "epic_number": "ABC1234567",
  "age": "25",
  "gender": "Male"
}
```

## API Endpoints Used

- **CAPTCHA Generation**: `GET https://gateway-voters.eci.gov.in/api/v1/captcha-service/generateCaptcha`
- **Search by EPIC**: `POST https://gateway-voters.eci.gov.in/api/v1/elastic/search-by-epic-from-national-display`

## Notes

- The script automatically opens the CAPTCHA image in your default image viewer
- CAPTCHA images are saved as `captcha.png` in the current directory
- The script includes proper headers to match browser requests
- Rate limiting may apply - the API has rate limits configured

## Troubleshooting

If the API structure changes:
1. Check the request body format in the `call_search_api()` method
2. Update field mappings in the `extract_voter_details()` method
3. The script prints raw API responses for debugging

## Requirements

- Python 3.7+
- Pillow (for image handling)
- requests (for API calls)

