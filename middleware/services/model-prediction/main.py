from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class FareRequest(BaseModel):
    distance: float
    duration: float
    # Add more fields as needed

@app.post("/predict")
def predict_fare(request: FareRequest):
    # Placeholder logic, replace with model prediction
    predicted_fare = request.distance * 2 + request.duration * 0.5
    return {"predicted_fare": predicted_fare}
