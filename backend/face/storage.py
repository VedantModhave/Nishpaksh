"""
Face Embedding Storage Module

Stores face embeddings in SQLite database.
- Stores voter_id, full_name, embedding, timestamp
- Enforces one voter_id → one embedding (unique constraint)
- Rejects duplicate registrations
- Serializes embeddings as JSON
"""

import sqlite3
import json
import numpy as np
from typing import Optional, Dict, List, Tuple
from datetime import datetime
import os


class FaceStorage:
    """
    SQLite-based storage for face embeddings.
    
    Schema:
    - voter_id: TEXT PRIMARY KEY (unique, one embedding per voter)
    - full_name: TEXT (voter's full name)
    - embedding: TEXT (JSON-serialized embedding vector)
    - timestamp: TEXT (ISO format timestamp)
    """
    
    def __init__(self, db_path: str = "face_embeddings.db"):
        """
        Initialize the face storage with SQLite database.
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self.conn = None
        self._initialize_database()
    
    def _get_connection(self) -> sqlite3.Connection:
        """Get or create database connection."""
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row  # Enable column access by name
        return self.conn
    
    def _initialize_database(self):
        """Create database table if it doesn't exist."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Create table with unique constraint on voter_id
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS face_embeddings (
                voter_id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                embedding TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        """)
        
        # Create index on voter_id for faster lookups (though PRIMARY KEY already creates one)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_voter_id ON face_embeddings(voter_id)
        """)
        
        conn.commit()
    
    def _serialize_embedding(self, embedding: np.ndarray) -> str:
        """
        Serialize numpy embedding array to JSON string.
        
        Args:
            embedding: numpy array representing face embedding
            
        Returns:
            JSON string representation of the embedding
        """
        # Convert numpy array to Python list
        embedding_list = embedding.tolist()
        
        # Serialize to JSON
        return json.dumps(embedding_list)
    
    def _deserialize_embedding(self, embedding_json: str) -> np.ndarray:
        """
        Deserialize JSON string to numpy embedding array.
        
        Args:
            embedding_json: JSON string representation of embedding
            
        Returns:
            numpy array representing face embedding
        """
        # Deserialize from JSON
        embedding_list = json.loads(embedding_json)
        
        # Convert to numpy array
        return np.array(embedding_list, dtype=np.float32)
    
    def store_embedding(
        self, 
        voter_id: str, 
        full_name: str, 
        embedding: np.ndarray
    ) -> Tuple[bool, Optional[str]]:
        """
        Store face embedding for a voter.
        
        Enforces one voter_id → one embedding constraint.
        Rejects duplicate registrations (returns error if voter_id already exists).
        
        Args:
            voter_id: Unique voter identifier (EPIC number or similar)
            full_name: Full name of the voter
            embedding: Face embedding vector as numpy array
            
        Returns:
            Tuple of (success, error_message)
            - success: True if stored successfully, False if duplicate or error
            - error_message: None if success, error description if failed
        """
        # Validate inputs
        if not voter_id or not voter_id.strip():
            return False, "voter_id cannot be empty"
        
        if not full_name or not full_name.strip():
            return False, "full_name cannot be empty"
        
        if embedding is None or embedding.size == 0:
            return False, "embedding cannot be empty"
        
        # Check if voter_id already exists (duplicate check)
        if self.voter_exists(voter_id):
            return False, f"Duplicate registration: voter_id '{voter_id}' already exists in database"
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Serialize embedding to JSON
            embedding_json = self._serialize_embedding(embedding)
            
            # Get current timestamp
            timestamp = datetime.utcnow().isoformat()
            
            # Insert into database
            cursor.execute("""
                INSERT INTO face_embeddings (voter_id, full_name, embedding, timestamp)
                VALUES (?, ?, ?, ?)
            """, (voter_id.strip(), full_name.strip(), embedding_json, timestamp))
            
            conn.commit()
            return True, None
            
        except sqlite3.IntegrityError as e:
            # This should not happen due to our check, but handle it anyway
            return False, f"Database integrity error: {str(e)}"
        except Exception as e:
            return False, f"Error storing embedding: {str(e)}"
    
    def get_embedding(self, voter_id: str) -> Optional[Dict]:
        """
        Retrieve face embedding for a voter.
        
        Args:
            voter_id: Unique voter identifier
            
        Returns:
            Dictionary with keys: voter_id, full_name, embedding (numpy array), timestamp
            Returns None if voter_id not found
        """
        if not voter_id or not voter_id.strip():
            return None
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT voter_id, full_name, embedding, timestamp
                FROM face_embeddings
                WHERE voter_id = ?
            """, (voter_id.strip(),))
            
            row = cursor.fetchone()
            
            if row is None:
                return None
            
            # Deserialize embedding
            embedding = self._deserialize_embedding(row['embedding'])
            
            return {
                'voter_id': row['voter_id'],
                'full_name': row['full_name'],
                'embedding': embedding,
                'timestamp': row['timestamp']
            }
            
        except Exception as e:
            print(f"Error retrieving embedding: {str(e)}")
            return None
    
    def voter_exists(self, voter_id: str) -> bool:
        """
        Check if a voter_id already exists in the database.
        
        Args:
            voter_id: Unique voter identifier
            
        Returns:
            True if voter_id exists, False otherwise
        """
        if not voter_id or not voter_id.strip():
            return False
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM face_embeddings
                WHERE voter_id = ?
            """, (voter_id.strip(),))
            
            result = cursor.fetchone()
            return result['count'] > 0
            
        except Exception as e:
            print(f"Error checking voter existence: {str(e)}")
            return False
    
    def update_embedding(
        self, 
        voter_id: str, 
        full_name: Optional[str] = None,
        embedding: Optional[np.ndarray] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Update existing face embedding for a voter.
        
        Args:
            voter_id: Unique voter identifier
            full_name: New full name (optional, only updates if provided)
            embedding: New embedding vector (optional, only updates if provided)
            
        Returns:
            Tuple of (success, error_message)
        """
        if not voter_id or not voter_id.strip():
            return False, "voter_id cannot be empty"
        
        if not self.voter_exists(voter_id):
            return False, f"voter_id '{voter_id}' does not exist. Use store_embedding() for new registrations."
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            updates = []
            params = []
            
            if full_name is not None:
                updates.append("full_name = ?")
                params.append(full_name.strip())
            
            if embedding is not None:
                embedding_json = self._serialize_embedding(embedding)
                updates.append("embedding = ?")
                params.append(embedding_json)
            
            if not updates:
                return False, "No fields to update"
            
            # Update timestamp
            timestamp = datetime.utcnow().isoformat()
            updates.append("timestamp = ?")
            params.append(timestamp)
            
            # Add voter_id for WHERE clause
            params.append(voter_id.strip())
            
            query = f"""
                UPDATE face_embeddings
                SET {', '.join(updates)}
                WHERE voter_id = ?
            """
            
            cursor.execute(query, params)
            conn.commit()
            
            return True, None
            
        except Exception as e:
            return False, f"Error updating embedding: {str(e)}"
    
    def delete_embedding(self, voter_id: str) -> Tuple[bool, Optional[str]]:
        """
        Delete face embedding for a voter.
        
        Args:
            voter_id: Unique voter identifier
            
        Returns:
            Tuple of (success, error_message)
        """
        if not voter_id or not voter_id.strip():
            return False, "voter_id cannot be empty"
        
        if not self.voter_exists(voter_id):
            return False, f"voter_id '{voter_id}' does not exist"
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                DELETE FROM face_embeddings
                WHERE voter_id = ?
            """, (voter_id.strip(),))
            
            conn.commit()
            return True, None
            
        except Exception as e:
            return False, f"Error deleting embedding: {str(e)}"
    
    def list_all_voters(self) -> List[Dict]:
        """
        List all registered voters (without embeddings).
        
        Returns:
            List of dictionaries with keys: voter_id, full_name, timestamp
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT voter_id, full_name, timestamp
                FROM face_embeddings
                ORDER BY timestamp DESC
            """)
            
            rows = cursor.fetchall()
            
            return [
                {
                    'voter_id': row['voter_id'],
                    'full_name': row['full_name'],
                    'timestamp': row['timestamp']
                }
                for row in rows
            ]
            
        except Exception as e:
            print(f"Error listing voters: {str(e)}")
            return []
    
    def get_count(self) -> int:
        """
        Get total number of stored embeddings.
        
        Returns:
            Number of registered voters
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) as count FROM face_embeddings")
            result = cursor.fetchone()
            
            return result['count'] if result else 0
            
        except Exception as e:
            print(f"Error getting count: {str(e)}")
            return 0
    
    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None


# Global storage instance (lazy loading)
_storage_instance: Optional[FaceStorage] = None


def get_storage(db_path: str = "face_embeddings.db") -> FaceStorage:
    """
    Get or create the global face storage instance.
    Uses singleton pattern for efficiency.
    
    Args:
        db_path: Path to SQLite database file (default: "face_embeddings.db")
    
    Returns:
        FaceStorage instance
    """
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = FaceStorage(db_path=db_path)
    return _storage_instance

