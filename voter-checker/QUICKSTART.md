# 🚀 Quick Start - Voter ID Checker

## Get Started in 3 Steps!

### Step 1: Install Dependencies
```bash
cd voter-checker
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open Browser
Visit: **http://localhost:3000**

---

## 📱 Using the App

### 1. Enter Details
- **EPIC Number**: Your Voter ID (e.g., XWC9340241)
- **State**: Select from dropdown
- **CAPTCHA**: Enter the text you see

### 2. Click "Search Voter Details"

### 3. View Results
You'll see:
- 👤 Full Name
- 🆔 EPIC Number
- 👨‍👦 Relative's Name
- 🎂 Age
- ⚧ Gender
- 📍 State & District
- 🏛️ Assembly Constituency
- 🗳️ Polling Station
- And more...

---

## 🎨 Features

✨ **Beautiful UI** - Modern, clean design
📱 **Mobile Friendly** - Works on all devices
🔄 **Auto CAPTCHA** - Generates automatically
⚡ **Real-time** - Direct ECI API integration
🎯 **Accurate** - Official government data

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **API**: ECI Gateway

---

## 📝 Example

### Input:
- EPIC: `XWC9340241`
- State: `Maharashtra`
- CAPTCHA: `abc123`

### Output:
```
Name: JATIN GORANA
Age: 19
District: Mumbai Suburban
Polling Station: Priyadarshni Primary School
```

---

## 🚨 Common Issues

### CAPTCHA not loading?
→ Refresh the page or click the refresh button

### Wrong results?
→ Check EPIC number spelling
→ Verify CAPTCHA is entered correctly (lowercase)

### Page not loading?
→ Make sure you're on `localhost:3000`
→ Check if `npm run dev` is running

---

## 🎉 That's It!

You're ready to check voter details!

For more details, see [COMPLETE_SETUP.md](../COMPLETE_SETUP.md)

