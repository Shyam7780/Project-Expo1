import io
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from PIL import Image
from ultralytics import YOLO
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="FoundIT ML Service")

# पहली बार रन होने पर yolov8n.pt ऑटोमैटिक डाउनलोड हो जाएगा
model = YOLO("yolov8n.pt")

SYNONYMS = {
    "phone": "cell phone cellular telephone mobile smartphone iphone",
    "iphone": "cell phone cellular telephone mobile smartphone phone",
    "mobile": "cell phone cellular telephone phone smartphone",
    "bag": "backpack rucksack handbag purse suitcase",
    "backpack": "bag rucksack handbag",
    "wallet": "purse billfold handbag",
    "laptop": "notebook computer",
    "watch": "wristwatch analog clock digital watch",
    "keys": "key padlock",
    "glasses": "sunglasses spectacles",
    "earphones": "headphones earbuds headset",
}


def expand(q: str) -> str:
    words = q.lower().split()
    extra = [SYNONYMS[w] for w in words if w in SYNONYMS]
    return " ".join(words + extra)


@app.get("/")
def root():
    return {"status": "ok"}


@app.post("/tags")
async def tags(file: UploadFile = File(...)):
    img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    results = model.predict(source=img, conf=0.25, verbose=False)
    
    words = []
    for r in results:
        for box in r.boxes:
            class_id = int(box.cls[0])
            label = model.names[class_id].strip().lower()
            words.append(label)
            
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
    docs = [i.tags.lower() for i in req.items]
    vec = TfidfVectorizer()
    mat = vec.fit_transform(docs + [expand(req.query)])
    scores = cosine_similarity(mat[-1], mat[:-1])[0]
    return {"results": [{"id": i.id, "score": float(s)} for i, s in zip(req.items, scores)]}