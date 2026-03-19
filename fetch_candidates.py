import requests
import json

url = "https://kvixkemyrydjihzqwaat.supabase.co/rest/v1/bmc_candidates"
params = {
    "select": "*,case_info:bmc_candidate_case_info!bmc_candidate_case_info_candidate_id_fkey(education,active_cases,closed_cases)",
    "ward_no": "eq.100"
}
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aXhrZW15cnlkamloenF3YWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzU2MTEsImV4cCI6MjA4MzExMTYxMX0.3CaKW2n-IH9uOJOB_RJU8cSAF-Toq1wCc43u5QLTJCQ",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aXhrZW15cnlkamloenF3YWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzU2MTEsImV4cCI6MjA4MzExMTYxMX0.3CaKW2n-IH9uOJOB_RJU8cSAF-Toq1wCc43u5QLTJCQ",
    "content-profile": "public"
}

try:
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    with open('candidates.json', 'w', encoding='utf-8') as f:
        json.dump(response.json(), f, indent=2)
    print("Successfully saved to candidates.json")
except Exception as e:
    print(f"Error: {e}")
