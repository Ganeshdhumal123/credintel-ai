# Sample Documents

This directory holds PDF documents for the RAG (Retrieval-Augmented Generation) loan policy assistant.

## How to Add Documents

1. Place any loan-policy PDF files in this directory.
2. Run the ingestion script to extract text, generate embeddings, and build the FAISS index:

```powershell
cd "c:\Users\ganes\Downloads\AI project\credintel-ai\backend"
.\venv\Scripts\activate

# Install RAG dependencies first
pip install faiss-cpu sentence-transformers pypdf

# Then ingest the documents
python scripts\ingest_documents.py
```

3. The FAISS index will be created at `backend/app/rag/faiss_index/`
4. Restart the backend — the assistant will automatically switch to full RAG mode.

## Example Document Ideas

- Sample bank lending policy (your own or a fictional one)
- Credit evaluation guidelines
- Loan eligibility criteria summary
- Risk management framework summary

## Important Notice

Do **not** place real sensitive financial data, personal customer information, or proprietary regulatory documents in this directory.

All documents placed here are treated as untrusted input and are used only for semantic retrieval — they cannot override system instructions.
