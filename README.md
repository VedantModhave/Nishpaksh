> **Nishpaksh** (निष्पक्ष - Impartial) - Open Election Voting System v1.0
> 
> **Documentation Version**: 1.0.0  
> **Last Updated**: March 2026  
> **Author**: Nishpaksh Team  
> **Status**: Production Ready ✅

A comprehensive voter ID verification and blockchain voting system that works with voter registration databases. Available in both Python CLI and Next.js web interface implementations.

### Two Implementations:
1. **Python CLI Script** (main.py) - Terminal-based application
2. **Next.js Web App** (voter-checker) - Modern web interface with React

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
1. User Authentication → 2. Identity Verification → 3. CAPTCHA Security → 4. Voter Data Retrieval → 5. Blockchain Vote Recording → 6. Display Results
```

### Key Components
- **Voter Database Integration**: Real-time voter data lookup
- **CAPTCHA Security**: Prevents unauthorized access
- **Blockchain Recording**: Immutable vote storage
- **Results Dashboard**: Real-time vote aggregation

---

## 📂 Project Structure

```
Nishpaksh/
├── main.py                                    # Python CLI implementation
├── requirements.txt                           # Python dependencies
├── README.md                                  # Documentation
└── voter-checker/                            # Next.js web app
    ├── src/
    │   ├── app/
    │   │   ├── api/
    │   │   │   ├── generate-captcha/route.ts  # CAPTCHA generation
    │   │   │   ├── search-voter/route.ts      # Voter data lookup
    │   │   │   └── face/route.ts              # Face recognition
    │   │   ├── page.tsx                       # Main voting interface
    │   │   ├── layout.tsx                     # App layout
    │   │   └── globals.css                    # Tailwind CSS styles
    │   └── components/
    │       ├── VoterForm.tsx                  # Voter search form
    │       ├── VoterDetails.tsx               # Voter info display
    │       ├── WebcamCapture.tsx              # Face capture
    │       └── ConnectWallet.tsx              # Wallet integration
    ├── contracts/
    │   └── ElectionVoting.sol                 # Smart contract
    ├── scripts/
    │   └── deploy.js                          # Deployment script
    ├── package.json                           # Node dependencies
    ├── tailwind.config.ts                     # Tailwind configuration
    └── tsconfig.json                          # TypeScript configuration
```

---

## 🐍 Python Implementation (main.py)

### Class: `VoterIDFetcher`

**Key Methods:**

**1. `verify_voter()`**
- Verifies voter existence in database
- Retrieves complete voter registration data
- Returns 20+ voter detail fields

**2. `generate_captcha()`**
- Generates security CAPTCHA
- Auto-displays for user entry
- Returns CAPTCHA ID for verification

**3. `validate_captcha()`**
- Validates user CAPTCHA input
- Ensures security check passed
- Returns validation status

**4. `retrieve_voter_data()`**
- Fetches voter information from database
- Maps voter fields (name, age, address, etc.)
- Returns formatted voter data

### Supported States

System supports 22 states with complete voter data access across India.

### Usage Example

```bash
$ python main.py
Enter Voter ID: V123456789
Enter state: Maharashtra
[CAPTCHA image opens]
Enter CAPTCHA text: abc123

Voter Details:
{
  "voterId": "V123456789",
  "fullName": "John Doe",
  "age": 35,
  "gender": "M",
  "state": "Maharashtra",
  "district": "Mumbai",
  "constituency": "Borivali",
  "pollingStation": "ABC School",
  ...
}
```

---

## 🌐 Next.js Web Implementation

### Frontend Components

**1. page.tsx** (Main Voting Interface)
- Voter search and verification
- CAPTCHA validation
- Blockchain vote casting
- Results display

**2. VoterForm.tsx** (Voter Lookup)
- Voter ID input
- State selection
- CAPTCHA entry with refresh
- Form validation

**3. `VoterDetails.tsx`** (Information Display)
- 20+ voter detail fields
- Personal information cards
- Electoral information
- Polling station details

### Backend API Routes

**1. `/api/search-voter` (Voter Data Retrieval)**
- Retrieves voter information from database
- Validates voter status
- Returns complete voter profile

**2. `/api/generate-captcha` (Security)**
- Generates CAPTCHA image
- Caches and manages CAPTCHA state
- Prevents automated access

**3. `/api/face` (Biometric Verification)**
- Processes face recognition
- Compares with registered faces
- Returns verification status

---

## 📊 Voter Data Fields

**Personal Information:**
- Full name
- Age / Date of birth
- Gender
- Relative name & type

**Electoral Information:**
- Voter ID number
- Registration status
- Part number
- Serial number

**Location Data:**
- State
- District
- Constituency
- Polling station
- Building address
- Room details

---

## 🎨 Features Implemented

✅ Voter data verification and retrieval  
✅ CAPTCHA security verification  
✅ Biometric face recognition  
✅ Blockchain vote recording  
✅ Real-time results dashboard  
✅ Multi-state voter database support  
✅ Mobile responsive design  
✅ Error handling and validation  
✅ Loading states with spinners  
✅ Raw data debug view  
✅ Icon-based info cards  
✅ Secure wallet integration  

---

## 🔐 Security Features

- CAPTCHA verification prevents unauthorized access
- Face recognition prevents impersonation
- Blockchain records ensure immutability
- One vote per voter enforcement
- Encrypted data transmission
- Session management
- Rate limiting

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

```bash
npm run build
npm start
```

Deploy to Vercel:
```bash
vercel
```

---

## 📋 Requirements

- Python 3.7+, Node.js 18+
- React 18, Next.js 14, TypeScript
- Smart contract deployment (Hardhat)
- Ethereum wallet integration

---

## 🤝 Contributing

Contributions welcome for:
- Additional voter data fields
- Enhanced verification methods
- Improved face recognition
- Better error handling
- Additional state support

---

**Built with ❤️ for transparent democratic processes**
