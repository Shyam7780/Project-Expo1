import io
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from PIL import Image
from transformers import pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="FoundIT ML Service")

# Pehli baar run par model download hoga
classifier = pipeline("image-classification", model="google/vit-base-patch16-224")


@app.get("/")
def root():
    return {"status": "ok"}


@app.post("/tags")
async def tags(file: UploadFile = File(...)):
    img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    preds = classifier(img, top_k=5)
    words = []
    for p in preds:
        words += [w.strip().lower() for w in p["label"].split(",")]
    return {"tags": list(dict.fromkeys(words))}


class Item(BaseModel):
    id: str
    tags: str


class MatchReq(BaseModel):
    query: str
    items: list[Item]


@app.post("/match")
def match(req: MatchReq):
    if not req.items:
        return {"results": []}
    docs = [i.tags for i in req.items]
    vec = TfidfVectorizer()
    mat = vec.fit_transform(docs + [req.query.lower()])
    scores = cosine_similarity(mat[-1], mat[:-1])[0]
    return {"results": [{"id": i.id, "score": float(s)} for i, s in zip(req.items, scores)]}
