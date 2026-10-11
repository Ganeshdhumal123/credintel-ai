"""
Production Ingestion Script for CredIntel RAG Pipeline.
Extracts text from PDFs and Markdown documents in sample_documents/,
splits into chunks, generates L2-normalized embeddings, and stores in FAISS.
"""

import os
import sys
import re
import pickle
import numpy as np

DOCS_DIR = os.path.join(os.path.dirname(__file__), "../../sample_documents")
INDEX_DIR = os.path.join(os.path.dirname(__file__), "../app/rag/faiss_index")
VEC_FILE = os.path.join(INDEX_DIR, "vectorizer.pkl")
INDEX_FILE = os.path.join(INDEX_DIR, "index.faiss")
META_FILE = os.path.join(INDEX_DIR, "index.pkl")

CHUNK_SIZE = 450
CHUNK_OVERLAP = 50


def extract_chunks_from_pdf(pdf_path: str):
    from pypdf import PdfReader
    reader = PdfReader(pdf_path)
    chunks = []
    fname = os.path.basename(pdf_path)
    for p_idx, page in enumerate(reader.pages):
        raw_text = page.extract_text() or ""
        clean_text = re.sub(r'\s+', ' ', raw_text).strip()
        start = 0
        c_id = 0
        while start < len(clean_text):
            end = min(start + CHUNK_SIZE, len(clean_text))
            chunk = clean_text[start:end].strip()
            if len(chunk) > 30:
                chunks.append({
                    "chunk_id": f"{fname}_p{p_idx+1}_c{c_id}",
                    "text": chunk,
                    "source": fname,
                    "page": p_idx + 1
                })
                c_id += 1
            if end >= len(clean_text):
                break
            start += (CHUNK_SIZE - CHUNK_OVERLAP)
    return chunks


def extract_chunks_from_md(md_path: str):
    chunks = []
    fname = os.path.basename(md_path)
    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()
    sections = re.split(r'\n(?=##\s+)', content)
    for s_idx, sec in enumerate(sections):
        s_clean = re.sub(r'\s+', ' ', sec).strip()
        if len(s_clean) > 30:
            chunks.append({
                "chunk_id": f"{fname}_s{s_idx}",
                "text": s_clean,
                "source": fname,
                "page": 1
            })
    return chunks


def ingest():
    import faiss
    from sklearn.feature_extraction.text import TfidfVectorizer

    os.makedirs(INDEX_DIR, exist_ok=True)
    all_chunks = []

    files = [f for f in os.listdir(DOCS_DIR) if f.lower().endswith((".pdf", ".md", ".txt"))]
    print(f"[RAG Ingest] Found {len(files)} policy documents in {DOCS_DIR}: {files}")

    for fname in files:
        fpath = os.path.join(DOCS_DIR, fname)
        if fname.lower().endswith(".pdf"):
            c = extract_chunks_from_pdf(fpath)
            all_chunks.extend(c)
            print(f"  Processed PDF: {fname} -> {len(c)} chunks")
        elif fname.lower().endswith((".md", ".txt")):
            c = extract_chunks_from_md(fpath)
            all_chunks.extend(c)
            print(f"  Processed Doc: {fname} -> {len(c)} chunks")

    print(f"\nTotal extracted chunks across all documents: {len(all_chunks)}")

    texts = [c["text"] for c in all_chunks]
    
    # Try SentenceTransformer first, otherwise use TF-IDF dense embedding
    use_st = False
    embedder = None
    try:
        from sentence_transformers import SentenceTransformer
        print("Using SentenceTransformer (all-MiniLM-L6-v2) for 384-d dense embeddings...")
        embedder = SentenceTransformer("all-MiniLM-L6-v2")
        embeddings = embedder.encode(texts, convert_to_numpy=True).astype("float32")
        use_st = True
    except Exception:
        print("Using Scikit-Learn TF-IDF normalized vectorizer for dense embeddings...")
        vectorizer = TfidfVectorizer(max_features=512, ngram_range=(1, 2))
        embeddings = vectorizer.fit_transform(texts).toarray().astype("float32")
        with open(VEC_FILE, "wb") as f:
            pickle.dump(vectorizer, f)

    # Normalize vectors for cosine similarity search
    faiss.normalize_L2(embeddings)
    dim = embeddings.shape[1]

    print(f"Building FAISS IndexFlatIP (Cosine Similarity, dim={dim})...")
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    faiss.write_index(index, INDEX_FILE)
    with open(META_FILE, "wb") as f:
        pickle.dump(all_chunks, f)

    print(f"\n[SUCCESS] FAISS vector index saved:")
    print(f"  - Vectors: {index.ntotal}")
    print(f"  - Metadata: {len(all_chunks)} chunks")
    print(f"  - Index file: {INDEX_FILE}")
    print(f"  - Meta file: {META_FILE}")


if __name__ == "__main__":
    ingest()
