import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.schemas.application import AssistantQuery, AssistantResponse
from app.rag.pipeline import rag_engine, SAMPLE_DOCS_DIR

router = APIRouter(prefix="/api/v1/assistant", tags=["AI Assistant"])


class RAGStatsResponse(BaseModel):
    total_chunks: int
    vector_backend: str
    documents: List[str]
    model_name: str


class DocumentUploadResponse(BaseModel):
    filename: str
    chunks_created: int
    message: str


@router.get("/stats", response_model=RAGStatsResponse)
def get_rag_stats():
    """Return live vector store statistics and indexed document registry."""
    rag_engine.initialize()
    docs = []
    if os.path.exists(SAMPLE_DOCS_DIR):
        docs = [
            f for f in os.listdir(SAMPLE_DOCS_DIR)
            if f.lower().endswith((".pdf", ".md", ".txt"))
        ]

    return RAGStatsResponse(
        total_chunks=len(rag_engine._metadata),
        vector_backend="FAISS IndexFlatIP (Cosine Similarity)" if rag_engine._index is not None else "Keyword Semantic Ranker",
        documents=docs,
        model_name="FAISS Dense Vectors (L2 Normalized)",
    )


@router.post("/query", response_model=AssistantResponse)
def query_assistant(payload: AssistantQuery) -> AssistantResponse:
    """
    Query the document-grounded RAG loan policy assistant.
    Retrieves evidence from FAISS vector store and synthesizes a grounded answer with citations.
    """
    question = payload.question.strip()
    if not question:
        return AssistantResponse(
            answer="Please enter a question regarding underwriting policies, risk tiers, or loan guidelines.",
            sources=[],
        )

    try:
        res = rag_engine.answer_query(question)
        return AssistantResponse(
            answer=res["answer"],
            sources=res["sources"],
        )
    except Exception as exc:
        return AssistantResponse(
            answer=f"An error occurred while querying the policy vector store: {exc}",
            sources=["CredIntel Assistant Core"],
        )


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_policy_document(file: UploadFile = File(...)):
    """
    Upload a lending policy document (PDF or Markdown).
    Extracts text, creates chunks, and updates the FAISS vector index in real-time.
    """
    allowed_exts = (".pdf", ".md", ".txt")
    if not any(file.filename.lower().endswith(ext) for ext in allowed_exts):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Please upload a PDF, Markdown (.md), or text (.txt) document."
        )

    os.makedirs(SAMPLE_DOCS_DIR, exist_ok=True)
    target_path = os.path.join(SAMPLE_DOCS_DIR, file.filename)

    try:
        with open(target_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Re-build / append to index
        chunks_count = rag_engine.build_index_from_documents()

        return DocumentUploadResponse(
            filename=file.filename,
            chunks_created=chunks_count,
            message=f"Document '{file.filename}' successfully ingested into FAISS vector store. Knowledge base updated.",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process and index document: {exc}"
        )
