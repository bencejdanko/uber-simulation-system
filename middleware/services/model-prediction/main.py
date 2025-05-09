from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import os

app = FastAPI()

MODEL_PATH = os.getenv("MODEL_PATH", "model.joblib")
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

class FarePredictionRequest(BaseModel):
    pickup_latitude: float
    pickup_longitude: float
    dropoff_latitude: float
    dropoff_longitude: float
    pickup_hour: int
    pickup_weekday: int
    passenger_count: int

@app.post("/predict")
def predict_fare(request: FarePredictionRequest):
    features = [[
        request.pickup_latitude,
        request.pickup_longitude,
        request.dropoff_latitude,
        request.dropoff_longitude,
        request.pickup_hour,
        request.pickup_weekday,
        request.passenger_count
    ]]
    predicted_fare = model.predict(features)[0]
    return {"predicted_fare": float(predicted_fare)}
