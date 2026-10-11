import os
import re
import pickle
from typing import List, Dict, Any, Optional
import numpy as np

RAG_DIR = os.path.dirname(__file__)
FAISS_INDEX_DIR = os.path.join(RAG_DIR, "faiss_index")
SAMPLE_DOCS_DIR = os.path.join(RAG_DIR, "..", "..", "..", "sample_documents")

INDEX_FILE = os.path.join(FAISS_INDEX_DIR, "index.faiss")
META_FILE = os.path.join(FAISS_INDEX_DIR, "index.pkl")
VEC_FILE = os.path.join(FAISS_INDEX_DIR, "vectorizer.pkl")

CHUNK_SIZE = 450
CHUNK_OVERLAP = 50


class RAGPipeline:
    """Production RAG Engine for CredIntel Underwriting Policy Documents using FAISS."""

    def __init__(self):
        self._index = None
        self._vectorizer = None
        self._metadata: List[Dict[str, Any]] = []
        self._initialized = False

    def initialize(self):
        """Loads FAISS vector index, TF-IDF vectorizer, and metadata from disk."""
        if self._initialized:
            return

        os.makedirs(FAISS_INDEX_DIR, exist_ok=True)

        if os.path.exists(INDEX_FILE) and os.path.exists(META_FILE) and os.path.exists(VEC_FILE):
            try:
                import faiss  # type: ignore
                self._index = faiss.read_index(INDEX_FILE)
                with open(META_FILE, "rb") as f:
                    self._metadata = pickle.load(f)
                with open(VEC_FILE, "rb") as f:
                    self._vectorizer = pickle.load(f)
                print(f"[RAG Engine] FAISS vector store loaded with {self._index.ntotal} vectors.")
                self._initialized = True
                return
            except Exception as e:
                print(f"[RAG Engine] Error reading saved FAISS index: {e}")

        # If not on disk, run ingestion
        self.build_index_from_documents()
        self._initialized = True

    def extract_chunks_from_pdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        from pypdf import PdfReader  # type: ignore
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

    def extract_chunks_from_md(self, md_path: str) -> List[Dict[str, Any]]:
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

    def build_index_from_documents(self) -> int:
        """Scan sample_documents/ and build or update the FAISS vector index."""
        import faiss  # type: ignore
        from sklearn.feature_extraction.text import TfidfVectorizer

        os.makedirs(FAISS_INDEX_DIR, exist_ok=True)
        all_chunks: List[Dict[str, Any]] = []

        if os.path.exists(SAMPLE_DOCS_DIR):
            for fname in os.listdir(SAMPLE_DOCS_DIR):
                fpath = os.path.join(SAMPLE_DOCS_DIR, fname)
                if os.path.isfile(fpath):
                    if fname.lower().endswith(".pdf"):
                        all_chunks.extend(self.extract_chunks_from_pdf(fpath))
                    elif fname.lower().endswith((".md", ".txt")):
                        all_chunks.extend(self.extract_chunks_from_md(fpath))

        if not all_chunks:
            all_chunks = [
                {
                    "chunk_id": "core_1",
                    "text": "CredIntel Underwriting Standards (POL-2026-V1.0): Minimum age is 18 years; maximum age 70. Credit amounts range from 500 DM to 200,000 DM. Terms span 1 to 72 months.",
                    "source": "credintel_lending_policy.md",
                    "page": 1,
                }
            ]

        self._metadata = all_chunks
        texts = [c["text"] for c in all_chunks]

        vectorizer = TfidfVectorizer(max_features=512, ngram_range=(1, 2))
        embeddings = vectorizer.fit_transform(texts).toarray().astype("float32")
        faiss.normalize_L2(embeddings)

        dim = embeddings.shape[1]
        index = faiss.IndexFlatIP(dim)
        index.add(embeddings)

        self._index = index
        self._vectorizer = vectorizer

        faiss.write_index(index, INDEX_FILE)
        with open(META_FILE, "wb") as f:
            pickle.dump(all_chunks, f)
        with open(VEC_FILE, "wb") as f:
            pickle.dump(vectorizer, f)

        print(f"[RAG Engine] FAISS index rebuilt with {index.ntotal} vectors.")
        return index.ntotal

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieve most relevant chunks using FAISS cosine similarity vector search."""
        self.initialize()
        if not self._index or not self._vectorizer or not self._metadata:
            return []

        try:
            import faiss  # type: ignore
            q_vec = self._vectorizer.transform([query]).toarray().astype("float32")
            faiss.normalize_L2(q_vec)

            k = min(top_k, self._index.ntotal)
            distances, indices = self._index.search(q_vec, k)

            results = []
            for score, idx in zip(distances[0], indices[0]):
                if idx < len(self._metadata) and score > 0.05:
                    item = dict(self._metadata[idx])
                    item["similarity_score"] = float(score)
                    results.append(item)
            return results
        except Exception as e:
            print(f"[RAG Engine] Vector search error: {e}")
            return []

    def answer_query(self, question: str) -> Dict[str, Any]:
        """Runs vector retrieval and synthesizes a document-grounded response."""
        q_clean = question.strip()
        lower_q = q_clean.lower()

        # Handle greetings naturally
        if lower_q in ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "help"]:
            return {
                "answer": (
                    "Hello! Welcome to the **CredIntel AI Policy Assistant**.\n\n"
                    "I am powered by our document-grounded RAG (Retrieval-Augmented Generation) engine with FAISS vector indexing.\n"
                    "I retrieve live evidence from our lending policy documents to answer questions regarding:\n"
                    "• **Eligibility Standards**: Age limits (18–70 yrs), credit amounts (500 to 200,000 DM), terms (1–72 mos)\n"
                    "• **Risk Scoring Tiers**: Low risk (<40% default probability), Medium (40–70%), High (≥70%)\n"
                    "• **Debt Burden**: Allowable installment rates and debt-to-income caps\n"
                    "• **Collateral & Guarantor Policy**: Real estate security and co-applicant rules\n\n"
                    "You can also upload custom lending policy PDFs using the upload button above!"
                ),
                "sources": ["CredIntel Underwriting Standards (POL-2026-V1.0) §1. Overview"],
                "chunks_retrieved": 0,
            }

        retrieved = self.retrieve(q_clean, top_k=3)

        if not retrieved:
            return {
                "answer": (
                    f"Based on the indexed lending policy documents, the available records do not establish "
                    f"a conclusive rule regarding \"{question}\".\n\n"
                    "Under CredIntel guidelines, applications with unlisted parameters require senior underwriter review."
                ),
                "sources": ["CredIntel Underwriting Core"],
                "chunks_retrieved": 0,
            }

        # Format context with exact page citations
        evidence_blocks = []
        sources = []
        for i, chunk in enumerate(retrieved, 1):
            source_citation = f"{chunk['source']} (Page {chunk.get('page', 1)})"
            if source_citation not in sources:
                sources.append(source_citation)
            evidence_blocks.append(
                f"**[Evidence {i}]** — *{source_citation}* (Relevance: {chunk['similarity_score']:.2f}):\n"
                f"{chunk['text']}"
            )

        context_str = "\n\n".join(evidence_blocks)

        answer = (
            f"Based on evidence retrieved via FAISS vector search across CredIntel policy documents:\n\n"
            f"{context_str}\n\n"
            f"**Underwriting Policy Determination**: The requirements and criteria above govern the requested inquiry."
        )

        return {
            "answer": answer,
            "sources": sources,
            "chunks_retrieved": len(retrieved),
        }


# Global singleton instance
rag_engine = RAGPipeline()
