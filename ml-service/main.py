import io
import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="FoundIT ML Service")

# Frontend/Backend से रिक्वेस्ट अलाउ करने के लिए CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ONNX मॉडल लोड करें (सिर्फ ~12MB, बहुत कम RAM यूज़ करता है)
session = ort.InferenceSession("yolov8n.onnx", providers=["CPUExecutionProvider"])
input_name = session.get_inputs()[0].name

# YOLOv8 के 80 COCO ऑब्जेक्ट क्लासेस
COCO_CLASSES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
    "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator",
    "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
]

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


def detect_tags(img: Image.Image, conf_threshold: float = 0.25) -> list[str]:
    # इमेज को 640x640 में रीसाइज़ और नॉर्मलाइज़ करें
    img_resized = img.resize((640, 640))
    arr = np.array(img_resized, dtype=np.float32) / 255.0
    arr = np.transpose(arr, (2, 0, 1))  # HWC -> CHW
    arr = np.expand_dims(arr, axis=0)   # (1, 3, 640, 640)

    # ONNX से प्रेडिक्शन चलाएं
    outputs = session.run(None, {input_name: arr})
    preds = outputs[0][0]  # shape: (84, 8400)

    class_scores = preds[4:, :]
    max_scores = np.max(class_scores, axis=0)
    class_ids = np.argmax(class_scores, axis=0)

    # 25% से ज़्यादा कॉन्फिडेंस वाले ऑब्जेक्ट्स निकालें
    valid = max_scores >= conf_threshold
    valid_ids = class_ids[valid]
    valid_scores = max_scores[valid]

    # सबसे ज़्यादा कॉन्फिडेंस वाले टैग्स पहले रखें
    order = np.argsort(-valid_scores)
    words = [COCO_CLASSES[int(valid_ids[i])] for i in order]
    return list(dict.fromkeys(words))


@app.get("/")
def root():
    return {"status": "ok"}


@app.post("/tags")
async def tags(file: UploadFile = File(...)):
    img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    detected = detect_tags(img, conf_threshold=0.25)
    return {"tags": detected}


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