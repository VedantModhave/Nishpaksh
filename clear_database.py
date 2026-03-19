"""
Clear all face embeddings from the database.
"""

import sys
from backend.face import get_storage

def main():
    print("=" * 70)
    print("Clearing Face Embeddings Database")
    print("=" * 70)
    print()
    
    storage = get_storage()
    
    # Get all voters first
    voters = storage.list_all_voters()
    
    if not voters:
        print("Database is already empty.")
        return
    
    print(f"Found {len(voters)} registered voter(s):")
    for voter in voters:
        print(f"  - {voter['voter_id']} ({voter['full_name']})")
    print()
    
    # Check for --yes flag to skip confirmation
    skip_confirm = '--yes' in sys.argv or '-y' in sys.argv
    
    if not skip_confirm:
        print("To delete all entries, run with --yes flag:")
        print("  python clear_database.py --yes")
        return
    
    print("Deleting all entries...")
    
    deleted_count = 0
    for voter in voters:
        success, error = storage.delete_embedding(voter['voter_id'])
        if success:
            print(f"  [OK] Deleted: {voter['voter_id']}")
            deleted_count += 1
        else:
            print(f"  [FAIL] Failed to delete {voter['voter_id']}: {error}")
    
    print()
    print("=" * 70)
    print(f"Deletion complete! Deleted {deleted_count} out of {len(voters)} entries.")
    print("=" * 70)

if __name__ == "__main__":
    main()
