// Generate a bill for a completed ride
const generateBill = async (ride) => {
  if (ride.status !== 'completed') return null;
  
  const baseFare = 2.5;
  const distanceFare = parseFloat((ride.distance * 1.5).toFixed(2));
  const timeFare = parseFloat((ride.duration * 0.2).toFixed(2));
  const surge = Math.random() > 0.7 ? parseFloat((Math.random() * 0.5 + 1.1).toFixed(1)) : 1.0;
  const subtotal = (baseFare + distanceFare + timeFare) * surge;
  const tax = parseFloat((subtotal * 0.0825).toFixed(2));
  const tip = Math.random() > 0.3 ? parseFloat((subtotal * (Math.random() * 0.2 + 0.1)).toFixed(2)) : 0;
  const amount = parseFloat((subtotal + tax + tip).toFixed(2));
  
  // Generate a billId in the format B000001
  const billNumber = Math.floor(Math.random() * 900000) + 100000;
  const billId = `B${billNumber}`;
  
  return {
    billId,  // Use the billId field instead of _id
    rideId: ride._id,
    customerId: ride.customerId,
    driverId: ride.driverId,
    date: ride.dropoffTime,
    pickupTime: ride.pickupTime,
    dropoffTime: ride.dropoffTime,
    distance: ride.distance,
    duration: ride.duration,
    baseFare,
    distanceFare,
    timeFare,
    surge,
    tax,
    tip,
    amount,
    status: 'paid',
    paymentMethod: getRandomItem(paymentMethods),
    source: `${ride.pickup.city}, ${ride.pickup.state}`,
    destination: `${ride.dropoff.city}, ${ride.dropoff.state}`
  };
}; 