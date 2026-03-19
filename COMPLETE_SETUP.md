# Complete Voter ID Checker Setup Guide

## 📁 Project Structure

```
Hacksync/
├── main.py                    # Python CLI script
├── requirements.txt           # Python dependencies
├── README.md                  # Python script docs
└── voter-checker/             # Next.js web app
    ├── src/
    │   ├── app/
    │   │   ├── api/
    │   │   │   ├── generate-captcha/route.ts
    │   │   │   └── search-voter/route.ts
    │   │   ├── page.tsx
    │   │   └── layout.tsx
    │   └── components/
    │       ├── VoterForm.tsx
    │       └── VoterDetails.tsx
    └── package.json
```

## 🐍 Python CLI Script

### Setup
```bash
pip install -r requirements.txt
```

### Usage
```bash
python main.py
```

### Features
- ✅ Generate CAPTCHA from ECI API
- ✅ Display CAPTCHA image automatically
- ✅ Search voter by EPIC number
- ✅ Extract and display all voter details
- ✅ JSON formatted output

### Example Output
```json
{
  "epic_number": "XWC9340241",
  "name": "jatin gorana",
  "first_name": "JATIN",
  "last_name": "GORANA",
  "relative_name": "bhuraram gorana",
  "relation_type": "FTHR",
  "age": "19",
  "gender": "M",
  "state": "Maharashtra",
  "district": "Mumbai Suburban",
  "assembly_constituency": "Borivali",
  "ac_number": "152",
  "parliament_constituency": "Mumbai North",
  "parliament_number": "26",
  "part_number": "221",
  "part_name": "Charkop Sector 7, Kandivali (West), Mumbai 400 067.",
  "serial_number": "1008",
  "section_number": "21",
  "polling_station": "Priyadarshni Primary School",
  "polling_station_address": "Charkop Sector 7, Kandivali (West), Mumbai 400 067.",
  "polling_station_room": "Ground Floor Room No. 8"
}
```

---

## 🌐 Next.js Web Application

### Setup
```bash
cd voter-checker
npm install
```

### Development
```bash
npm run dev
```

Open http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

### Features
- ✅ Beautiful, responsive UI
- ✅ Auto-generate CAPTCHA
- ✅ Search by EPIC number
- ✅ Real-time voter details
- ✅ Mobile-friendly
- ✅ State selection dropdown
- ✅ CAPTCHA refresh button
- ✅ Detailed voter information cards
- ✅ Raw JSON data view

### Screenshots

**Search Form:**
- EPIC number input
- State dropdown (Maharashtra, Delhi, etc.)
- CAPTCHA image with refresh button
- CAPTCHA text input
- Search button

**Results Display:**
- Full name with icon
- EPIC number
- Relative's name and relation
- Age and gender
- State and district
- Assembly constituency
- Parliament constituency
- Part number and serial number
- Polling station details with address
- Raw JSON data (expandable)

### API Endpoints

#### Generate CAPTCHA
```
GET /api/generate-captcha
```

Response:
```json
{
  "success": true,
  "captcha": "base64_image_string",
  "id": "captcha_session_id"
}
```

#### Search Voter
```
POST /api/search-voter
```

Request Body:
```json
{
  "epicNumber": "XWC9340241",
  "state": "Maharashtra",
  "captchaText": "abc123",
  "captchaId": "session_id"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "fullName": "jatin gorana",
    "epicNumber": "XWC9340241",
    "age": 19,
    "gender": "M",
    // ... more fields
  }
}
```

---

## 🔧 How It Works

### 1. Session Establishment
- Visits `https://electoralsearch.eci.gov.in/`
- Gets `JSESSIONID` cookie

### 2. CAPTCHA Generation
- Calls `https://gateway-voters.eci.gov.in/api/v1/captcha-service/generateCaptcha`
- Returns base64 image and session ID

### 3. Search Voter
- Calls `https://gateway-voters.eci.gov.in/api/v1/elastic/search-by-epic-from-national-display`
- Sends:
  - `isPortal`: true
  - `epicNumber`: voter ID
  - `captchaData`: CAPTCHA text
  - `captchaId`: CAPTCHA session ID
  - `securityKey`: "na"
  - `stateCd`: state code (e.g., "S13" for Maharashtra)

### 4. Parse Response
- Response is array with `content` field
- Extract voter details from nested structure
- Display in formatted view

---

## 🗺️ State Codes

| State | Code |
|-------|------|
| Maharashtra | S13 |
| Delhi | S07 |
| Karnataka | S10 |
| Tamil Nadu | S22 |
| West Bengal | S25 |
| Uttar Pradesh | S24 |
| Gujarat | S06 |
| Rajasthan | S20 |
| Madhya Pradesh | S12 |
| Kerala | S11 |
| Andhra Pradesh | S01 |
| Telangana | S29 |
| Bihar | S04 |
| Odisha | S18 |
| Punjab | S19 |
| Haryana | S08 |
| Assam | S03 |
| Jharkhand | S09 |
| Chhattisgarh | S26 |
| Uttarakhand | S28 |
| Himachal Pradesh | S02 |
| Goa | S05 |

---

## 🚀 Deployment

### Deploy Next.js to Vercel

1. Push code to GitHub
2. Import to Vercel
3. Deploy automatically

```bash
cd voter-checker
npm run build
vercel
```

### Deploy Next.js to Other Platforms

- **Netlify**: `npm run build` → Deploy `./next` folder
- **AWS**: Use Amplify or S3 + CloudFront
- **Docker**: Create Dockerfile with Next.js

---

## 📝 Notes

- CAPTCHA is case-sensitive (enter lowercase)
- EPIC number should be uppercase
- API has rate limits (X-RateLimit headers)
- Session cookies are important for API calls
- State code improves search speed

---

## 🐛 Troubleshooting

### Python Script

**CAPTCHA 400 Error:**
- Session not established
- Fix: Script now establishes session first

**No Results:**
- Wrong EPIC number
- Wrong CAPTCHA text
- Try different state

### Next.js App

**CAPTCHA Not Loading:**
- Check internet connection
- ECI API might be down
- Try refreshing

**Build Errors:**
- Run `npm install` again
- Delete `node_modules` and `.next`
- Clear npm cache: `npm cache clean --force`

**CORS Errors:**
- API routes handle CORS automatically
- Don't call ECI APIs from client-side

---

## 📚 Tech Stack

### Python
- `requests`: HTTP client
- `Pillow`: Image handling

### Next.js
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Runtime**: Node.js

---

## ✅ Testing

### Python
```bash
python main.py
# Enter: XWC9340241
# State: Maharashtra
# CAPTCHA: <from image>
```

### Next.js
```bash
cd voter-checker
npm run dev
# Open http://localhost:3000
# Fill form and search
```

---

## 🎯 Features Comparison

| Feature | Python CLI | Next.js Web |
|---------|------------|-------------|
| CAPTCHA Display | ✅ Auto-open | ✅ Inline |
| Search | ✅ Terminal | ✅ Web Form |
| Results | ✅ JSON | ✅ Beautiful UI |
| Mobile | ❌ N/A | ✅ Responsive |
| Deployment | ❌ Local | ✅ Vercel/Cloud |
| User Friendly | ⚠️ Technical | ✅ Everyone |

---

## 📄 License

MIT License - Feel free to use and modify!

---

## 🙏 Credits

Data source: Election Commission of India (eci.gov.in)

