import os
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from raganything import RAGAnything
from raganything.config import RAGAnythingConfig

from lightrag.utils import EmbeddingFunc

from openai import AsyncOpenAI

from dotenv import load_dotenv

load_dotenv()

# =========================================================
# ENV VARIABLES
# =========================================================

SUMOPOD_API_KEY = os.getenv("SUMOPOD_API_KEY")
SUMOPOD_BASE_URL = os.getenv("SUMOPOD_BASE_URL")
SUMOPOD_MODEL = os.getenv("SUMOPOD_MODEL")

# Embedding model
EMBEDDING_MODEL = "text-embedding-3-small"

if not SUMOPOD_API_KEY:
    raise ValueError("SUMOPOD_API_KEY is missing")

if not SUMOPOD_BASE_URL:
    raise ValueError("SUMOPOD_BASE_URL is missing")

if not SUMOPOD_MODEL:
    raise ValueError("SUMOPOD_MODEL is missing")

# =========================================================
# OPENAI CLIENT (SUMOPOD COMPATIBLE)
# =========================================================

client = AsyncOpenAI(
    api_key=SUMOPOD_API_KEY,
    base_url=SUMOPOD_BASE_URL,
)

# =========================================================
# FASTAPI
# =========================================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# FOLDERS
# =========================================================

UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"

Path(UPLOAD_DIR).mkdir(exist_ok=True)
Path(PROCESSED_DIR).mkdir(exist_ok=True)
Path("./rag_storage").mkdir(exist_ok=True)

# =========================================================
# LLM FUNCTION
# =========================================================

async def llm_model_func(prompt, system_prompt=None, history_messages=None, **kwargs):

    messages = []

    if system_prompt:
        messages.append({
            "role": "system",
            "content": system_prompt
        })

    if history_messages:
        messages.extend(history_messages)

    messages.append({
        "role": "user",
        "content": prompt
    })

    response = await client.chat.completions.create(
        model=SUMOPOD_MODEL,
        messages=messages,
        temperature=0.3,
    )

    return response.choices[0].message.content

# =========================================================
# EMBEDDING FUNCTION
# =========================================================

async def embedding_func(texts):

    if isinstance(texts, str):
        texts = [texts]

    response = await client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )

    return [item.embedding for item in response.data]

# =========================================================
# RAG CONFIG
# =========================================================

config = RAGAnythingConfig(

    # STORAGE
    working_dir="./rag_storage",

    # IMPORTANT PERFORMANCE OPTIMIZATION
    parse_method="txt",

    # DISABLE HEAVY MULTIMODAL FEATURES
    enable_image_processing=False,
    enable_table_processing=False,
    enable_equation_processing=False,

    # LOWER RESOURCE USAGE
    max_concurrent_files=1,
)

# =========================================================
# RAG INSTANCE
# =========================================================

rag = RAGAnything(
    llm_model_func=llm_model_func,

    embedding_func=EmbeddingFunc(
        embedding_dim=1536,
        max_token_size=8192,
        func=embedding_func,
    ),

    config=config,
)

# =========================================================
# ROOT
# =========================================================

@app.get("/")
async def root():
    return {
        "message": "RAGAnything API Running"
    }

# =========================================================
# PDF UPLOAD
# =========================================================

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    try:

        # ---------------------------------------------
        # VALIDATION
        # ---------------------------------------------

        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are allowed"
            )

        # ---------------------------------------------
        # DUPLICATE CHECK
        # ---------------------------------------------

        processed_marker = os.path.join(
            PROCESSED_DIR,
            file.filename + ".done"
        )

        if os.path.exists(processed_marker):
            return {
                "status": "skipped",
                "message": f"{file.filename} already processed"
            }

        # ---------------------------------------------
        # SAVE FILE
        # ---------------------------------------------

        file_path = os.path.join(UPLOAD_DIR, file.filename)

        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        # ---------------------------------------------
        # PROCESS DOCUMENT
        # ---------------------------------------------

        print(f"Processing: {file.filename}")

        await rag.process_document_complete(file_path)

        # ---------------------------------------------
        # MARK AS PROCESSED
        # ---------------------------------------------

        with open(processed_marker, "w") as f:
            f.write("done")

        return {
            "status": "success",
            "filename": file.filename,
            "message": "PDF processed successfully"
        }

    except Exception as e:

        print("UPLOAD ERROR:")
        print(str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================================================
# ASK QUESTION
# =========================================================

@app.post("/ask")
async def ask_question(question: str):

    try:

        response = await rag.aquery(question)

        return {
            "question": question,
            "answer": response
        }

    except Exception as e:

        print("QUERY ERROR:")
        print(str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )