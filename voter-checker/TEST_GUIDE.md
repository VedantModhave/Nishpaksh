# 🧪 Complete Testing Guide

## Quick Test (2 minutes)

```bash
cd voter-checker
npm install
npm run dev
```

Open http://localhost:3000

### ✅ Checklist:
1. [ ] CAPTCHA loads automatically
2. [ ] Click "🔄 Refresh" - new CAPTCHA appears
3. [ ] Enter EPIC: `XWC9340241`
4. [ ] State: `Maharashtra`
5. [ ] Enter CAPTCHA text
6. [ ] Click "Search Voter Details"
7. [ ] Voter details appear

---

## Detailed Testing

### Test 1: CAPTCHA Generation
**Steps:**
1. Open app
2. Wait 2 seconds

**Expected:**
- ✅ CAPTCHA image appears
- ✅ "Fresh CAPTCHA" badge shows (green with pulse)
- ✅ Image is clear and readable

**Console Check:**
```
CAPTCHA loaded successfully: <unique-id>
```

---

### Test 2: CAPTCHA Refresh
**Steps:**
1. Click "🔄 Refresh" button
2. Wait 1 second
3. Click again
4. Repeat 3 more times

**Expected Each Time:**
- ✅ Button shows "⏳ Loading..."
- ✅ New CAPTCHA appears (different image)
- ✅ CAPTCHA text input clears
- ✅ "Fresh CAPTCHA" badge updates

**Network Tab:**
```
/api/generate-captcha?t=1234567890  →  200
/api/generate-captcha?t=1234567891  →  200
/api/generate-captcha?t=1234567892  →  200
```
Each should have unique timestamp!

---

### Test 3: Successful Search
**Test Data:**
```
EPIC Number: XWC9340241
State: Maharashtra
CAPTCHA: <from image>
```

**Steps:**
1. Fill all fields
2. Click "Search Voter Details"

**Expected:**
- ✅ Loading state appears
- ✅ Results card appears with:
  - Name: JATIN GORANA
  - Age: 19
  - Gender: Male
  - District: Mumbai Suburban
  - Polling Station: Priyadarshni Primary School
  - 15+ other fields

---

### Test 4: Wrong CAPTCHA
**Steps:**
1. Enter EPIC: `XWC9340241`
2. Enter wrong CAPTCHA: `abcdef`
3. Click search

**Expected:**
- ✅ Error message appears
- ✅ Suggests refreshing CAPTCHA
- ✅ Form remains filled (EPIC, state)
- ✅ Can click refresh and try again

---

### Test 5: Invalid EPIC
**Steps:**
1. Enter EPIC: `INVALID123`
2. Solve CAPTCHA correctly
3. Click search

**Expected:**
- ✅ Error: "No voter details found"
- ✅ Can try different EPIC

---

### Test 6: Network Conditions

#### Slow Network
**Steps:**
1. Chrome DevTools → Network
2. Set throttling to "Slow 3G"
3. Refresh CAPTCHA

**Expected:**
- ✅ Loading indicator shows
- ✅ Eventually loads
- ✅ No timeout errors

#### Offline
**Steps:**
1. Turn off internet
2. Click refresh

**Expected:**
- ✅ Error message: "Error generating CAPTCHA"
- ✅ Can retry when online

---

### Test 7: Mobile Responsive
**Steps:**
1. Chrome DevTools → Device toolbar
2. Select "iPhone 12 Pro"
3. Test all features

**Expected:**
- ✅ Layout looks good
- ✅ CAPTCHA is readable
- ✅ Buttons are tappable
- ✅ Forms work properly

---

### Test 8: Multiple States
**Test Each State:**
```
Maharashtra  →  Should work
Delhi        →  Should work
Karnataka    →  Should work
Tamil Nadu   →  Should work
```

**Expected:**
- ✅ Each state code maps correctly
- ✅ Search works for each state

---

### Test 9: Browser Compatibility
**Test In:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Each Should:**
- ✅ CAPTCHA loads
- ✅ Refresh works
- ✅ Search works
- ✅ No console errors

---

### Test 10: Cache Verification

**Steps:**
1. Open DevTools → Network
2. Click refresh 3 times
3. Check "Size" column

**Expected:**
- ✅ All show actual size (e.g., "2.5 KB")
- ❌ None show "disk cache" or "memory cache"

**Headers Check:**
```
Response Headers:
  Cache-Control: no-cache, no-store, must-revalidate, max-age=0
  Pragma: no-cache
  Expires: 0
```

---

## Performance Testing

### Load Time
**Expected:**
- CAPTCHA: < 2 seconds
- Search: < 3 seconds
- Total page load: < 1 second

### Memory
**Check:**
1. Chrome Task Manager (Shift+Esc)
2. Find "Voter ID Checker" tab
3. Memory should be < 50 MB

---

## Security Testing

### 1. XSS Protection
**Test:**
```javascript
// Try entering in EPIC field:
<script>alert('XSS')</script>
```

**Expected:**
- ✅ No alert appears
- ✅ Input is sanitized

### 2. CAPTCHA Reuse
**Test:**
1. Use same CAPTCHA ID twice
2. Second attempt should fail

**Expected:**
- ✅ Error: "Invalid CAPTCHA"

---

## API Testing

### Direct API Calls

**Generate CAPTCHA:**
```bash
curl http://localhost:3000/api/generate-captcha
```

**Expected:**
```json
{
  "success": true,
  "captcha": "base64...",
  "id": "unique-id",
  "timestamp": 1234567890
}
```

**Search Voter:**
```bash
curl -X POST http://localhost:3000/api/search-voter \
  -H "Content-Type: application/json" \
  -d '{
    "epicNumber": "XWC9340241",
    "state": "Maharashtra",
    "captchaText": "abc123",
    "captchaId": "captcha-id"
  }'
```

---

## Error Scenarios

### Test Each:
1. [ ] Empty EPIC number → "Please fill all fields"
2. [ ] Empty CAPTCHA → "Please fill all fields"
3. [ ] Wrong CAPTCHA → "Invalid CAPTCHA..."
4. [ ] Invalid EPIC → "No voter details found"
5. [ ] Network error → "Error generating CAPTCHA"
6. [ ] API down → Appropriate error message

---

## Regression Testing

### After Changes:
1. [ ] CAPTCHA still loads
2. [ ] Refresh still works
3. [ ] Search still works
4. [ ] No console errors
5. [ ] No TypeScript errors
6. [ ] Build succeeds: `npm run build`

---

## Acceptance Criteria

### Must Have (All Green):
- ✅ CAPTCHA generates from ECI API
- ✅ Refresh fetches new CAPTCHA
- ✅ No caching issues
- ✅ Search works end-to-end
- ✅ All voter details display
- ✅ Mobile responsive
- ✅ Error handling works
- ✅ Visual feedback present

### Nice to Have:
- ✅ Fast performance
- ✅ Good error messages
- ✅ Console logging for debugging
- ✅ Loading states

---

## Production Checklist

Before deploying:
- [ ] All tests pass
- [ ] `npm run build` succeeds
- [ ] No console errors
- [ ] No linting errors
- [ ] Tested on mobile
- [ ] Tested on multiple browsers
- [ ] Environment variables set (if any)
- [ ] CAPTCHA refresh verified in production

---

## Test Results Template

```
Date: _____________
Tester: ___________

Test 1: CAPTCHA Generation      [PASS / FAIL]
Test 2: CAPTCHA Refresh          [PASS / FAIL]
Test 3: Successful Search        [PASS / FAIL]
Test 4: Wrong CAPTCHA            [PASS / FAIL]
Test 5: Invalid EPIC             [PASS / FAIL]
Test 6: Network Conditions       [PASS / FAIL]
Test 7: Mobile Responsive        [PASS / FAIL]
Test 8: Multiple States          [PASS / FAIL]
Test 9: Browser Compatibility    [PASS / FAIL]
Test 10: Cache Verification      [PASS / FAIL]

Overall: [PASS / FAIL]

Notes:
_______________________________________
_______________________________________
```

---

## Automated Testing (Future)

### E2E Tests (Playwright/Cypress)
```javascript
test('CAPTCHA refresh works', async () => {
  await page.goto('http://localhost:3000')
  const firstCaptcha = await page.screenshot({ selector: '.captcha-image' })
  await page.click('.refresh-button')
  const secondCaptcha = await page.screenshot({ selector: '.captcha-image' })
  expect(firstCaptcha).not.toBe(secondCaptcha)
})
```

---

**Happy Testing! 🎉**

