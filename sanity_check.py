"""
Quick sanity check for face embeddings database.

Checks:
1. Number of registered voters
2. Embedding lengths (should be ~1000-4000 chars for JSON string)
3. Embedding uniqueness (should be different for each voter)
"""

import sqlite3
from backend.face import get_storage

def main():
    print("=" * 70)
    print("Face Embeddings Database Sanity Check")
    print("=" * 70)
    print()
    
    # Get storage instance
    storage = get_storage()
    conn = storage._get_connection()
    cursor = conn.cursor()
    
    # Query: SELECT voter_id, LENGTH(embedding) FROM face_embeddings;
    cursor.execute("""
        SELECT voter_id, LENGTH(embedding) as embedding_length, embedding
        FROM face_embeddings
        ORDER BY voter_id
    """)
    
    rows = cursor.fetchall()
    
    print(f"Total registered voters: {len(rows)}")
    print()
    
    if len(rows) == 0:
        print("⚠️  No embeddings found in database!")
        print("   Run register_faces.py to register faces first.")
        return
    
    if len(rows) != 3:
        print(f"⚠️  Expected 3 rows, but found {len(rows)} rows")
        print()
    
    print("Embedding Details:")
    print("-" * 70)
    print(f"{'Voter ID':<20} {'Length':<10} {'Status'}")
    print("-" * 70)
    
    embeddings = []
    all_same = True
    first_embedding = None
    
    for row in rows:
        voter_id = row['voter_id']
        length = row['embedding_length']
        embedding_json = row['embedding']
        
        # Check length
        if 1000 <= length <= 4000:
            status = "✓ OK"
        elif length < 1000:
            status = "⚠️  Too short"
        else:
            status = "⚠️  Too long"
        
        print(f"{voter_id:<20} {length:<10} {status}")
        
        # Store for uniqueness check
        embeddings.append(embedding_json)
        if first_embedding is None:
            first_embedding = embedding_json
        elif embedding_json != first_embedding:
            all_same = False
    
    print("-" * 70)
    print()
    
    # Check uniqueness
    print("Uniqueness Check:")
    print("-" * 70)
    
    if len(embeddings) < 2:
        print("⚠️  Need at least 2 embeddings to check uniqueness")
    elif all_same:
        print("❌ ERROR: All embeddings are IDENTICAL!")
        print("   This indicates a problem with embedding generation.")
        print("   Each voter should have a unique embedding.")
    else:
        print("✓ All embeddings are unique (different from each other)")
    
    print()
    
    # Additional check: Compare first few characters
    if len(embeddings) >= 2:
        print("Sample Comparison (first 100 chars of each embedding):")
        print("-" * 70)
        for i, (row, emb) in enumerate(zip(rows, embeddings), 1):
            print(f"{row['voter_id']}: {emb[:100]}...")
            if i < len(embeddings):
                print()
    
    print()
    print("=" * 70)
    print("Sanity Check Complete")
    print("=" * 70)

if __name__ == "__main__":
    main()

