# Uber Simulation - Dynamic Pricing Algorithm

This document provides a detailed explanation of the dynamic pricing algorithm implemented in the Uber simulation system. The algorithm is designed to balance supply and demand, optimize driver availability, and ensure fair pricing for both customers and drivers.

## Overview

The dynamic pricing algorithm in our Uber simulation is based on the actual Uber pricing model, which combines several factors:

1. **Base Fare Calculation**: Starting with a base fare and adding time and distance components.
2. **Historical Data & Demand Analysis**: Using historical patterns to predict demand.
3. **Machine Learning Predictions**: Implementing predictive models to anticipate demand spikes.
4. **Real-time Supply-Demand Balancing**: Adjusting prices based on current driver availability and ride requests.

## Algorithm Components

### 1. Base Fare Calculation

The base fare is calculated using the following formula:

```
Base Fare = Base Rate + (Time Component) + (Distance Component) + Booking Fee
```

Where:
- **Base Rate**: A fixed amount to start the fare calculation (currently $2.50)
- **Time Component**: Cost per minute × estimated trip duration
- **Distance Component**: Cost per mile × estimated trip distance
- **Booking Fee**: A fixed fee added to every trip (currently $2.00)

The algorithm also enforces a minimum fare (currently $7.00) to ensure trips are economically viable for drivers.

### 2. Surge Pricing Mechanism

Surge pricing is implemented to balance supply and demand during peak periods. The surge multiplier is calculated based on several factors:

#### a. Time of Day Factor (0.8 to 1.5)
- Morning Rush Hour (7-9 AM): 1.3x
- Evening Rush Hour (4-7 PM): 1.4x
- Late Night (10 PM-2 AM): 1.2x
- Normal Hours: 1.0x

#### b. Day of Week Factor (0.9 to 1.3)
- Weekends (Friday-Saturday): 1.2x
- Weekdays: 1.0x

#### c. Special Events Factor (1.0 to 1.5)
- Major events (concerts, sports games, etc.): 1.3x
- Normal conditions: 1.0x

#### d. Weather Factor (1.0 to 1.4)
- Bad weather (rain, snow): 1.2x
- Normal weather: 1.0x

#### e. Supply-Demand Imbalance Factor (0.9 to 2.0)
- Based on the ratio of active ride requests to available drivers in a given area

The final surge multiplier is calculated by multiplying these factors together and then rounding to the nearest predefined surge level:
- No Surge: 1.0x
- Low Surge: 1.2x
- Medium Surge: 1.5x
- High Surge: 2.0x
- Very High Surge: 2.5x
- Extreme Surge: 3.0x

### 3. Distance Calculation

Distance between pickup and dropoff locations is calculated using the Haversine formula, which accounts for the Earth's curvature:

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlong/2)
c = 2 × atan2(√a, √(1−a))
distance = R × c
```

Where:
- R is Earth's radius (3958.8 miles)
- lat1, long1 are the coordinates of the pickup location
- lat2, long2 are the coordinates of the dropoff location

### 4. Travel Time Estimation

Travel time is estimated based on the calculated distance and average speed, which varies by time of day:
- Morning Rush Hour: 20 mph
- Afternoon: 25 mph
- Evening Rush Hour: 18 mph
- Night: 30 mph

## Machine Learning Integration

While our current implementation uses rule-based algorithms with randomization for simulation purposes, a production system would integrate machine learning models trained on historical data. Here's how we would enhance the algorithm with ML:

### 1. Demand Prediction Model

A time-series forecasting model would predict demand patterns based on:
- Historical ride data
- Time of day
- Day of week
- Weather conditions
- Special events
- Seasonal trends

This model would use techniques such as:
- ARIMA (AutoRegressive Integrated Moving Average)
- Prophet (Facebook's time series forecasting tool)
- LSTM (Long Short-Term Memory) neural networks

### 2. Driver Supply Prediction

A separate model would predict driver availability based on:
- Historical driver activity patterns
- Current active drivers
- Time until drivers typically end their shifts
- Earnings goals of drivers

### 3. Dynamic Pricing Optimization

An optimization model would determine the optimal surge multiplier to:
- Maximize ride completions
- Minimize wait times
- Ensure fair driver compensation
- Maintain reasonable prices for riders

This would use techniques such as:
- Reinforcement Learning
- Multi-armed Bandit algorithms
- Bayesian Optimization

## Kaggle Dataset Integration

The [Uber Fares Dataset](https://www.kaggle.com/datasets/yasserh/uber-fares-dataset) from Kaggle is used to calibrate and validate our pricing model. This dataset contains:

- Fare amounts for trips
- Pickup and dropoff coordinates
- Passenger counts
- Pickup datetime

We use this dataset in several ways:

### 1. Base Rate Calibration

The dataset helps us determine appropriate base rates, per-minute, and per-mile costs by analyzing the relationship between:
- Trip distance
- Trip duration
- Final fare amount

### 2. Geographical Pricing Patterns

By analyzing pickup and dropoff coordinates, we identify areas with consistently higher or lower fares, which informs our geospatial pricing model.

### 3. Time-based Pricing Patterns

The pickup datetime field allows us to analyze how fares vary by:
- Time of day
- Day of week
- Month of year

This helps calibrate our time-based surge factors.

### 4. Model Validation

We validate our pricing algorithm by comparing its predictions against actual fares in the dataset, using metrics such as:
- Mean Absolute Error (MAE)
- Root Mean Square Error (RMSE)
- R-squared value

## Performance Optimization

To ensure the pricing algorithm performs efficiently at scale, we implement several optimizations:

### 1. Redis Caching

Surge multipliers for specific areas and times are cached in Redis with a 5-minute expiration to reduce recalculation frequency.

### 2. Geospatial Indexing

For large-scale deployments, we would implement geospatial indexing to efficiently query drivers and demand within specific areas.

### 3. Batch Processing

Historical data analysis and model training would be performed in batch processes, with the resulting models deployed for real-time inference.

## Ethical Considerations

Our pricing algorithm is designed with several ethical considerations:

1. **Fairness**: Ensuring prices remain reasonable even during high demand
2. **Transparency**: Clearly communicating surge pricing to users
3. **Accessibility**: Maintaining affordable options for essential transportation
4. **Driver Compensation**: Ensuring drivers receive fair compensation for their time and expenses

## Conclusion

The dynamic pricing algorithm balances multiple factors to optimize the marketplace for both riders and drivers. It uses a combination of base fare calculation, surge pricing based on multiple factors, and would be enhanced with machine learning models in a production environment.

By leveraging historical data, real-time conditions, and predictive modeling, the algorithm aims to:
- Match supply with demand
- Reduce wait times for riders
- Maximize earnings opportunities for drivers
- Ensure the overall efficiency of the transportation network