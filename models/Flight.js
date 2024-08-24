const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FlightSchema = new Schema({
  fromEN: { type: String, required: true },
  fromUA: { type: String, required: true },
  fromLocationEN: { type: String, required: true },
  fromLocationUA: { type: String, required: true },
  toEN: { type: String, required: true },
  toUA: { type: String, required: true },
  toLocationEN: { type: String, required: true },
  toLocationUA: { type: String, required: true },
  typeEN: { type: String, required: true },
  typeUA: { type: String, required: true },
  passengers: { type: String, required: true },
  priceEN: { type: Number, required: true },
  priceUA: { type: Number, required: true },
  date_departure: { type: Date, required: true },
  departure: { type: String, required: true },
  duration: { type: Number, required: true },
  date_arrival: { type: Date, required: true },
  arrival: { type: String, required: true },
  baggage: {
    smallBaggage: { type: Number },
    largeBaggage: { type: Number }
  },
  isDaily: { type: Boolean, default: false }  // Новое поле для ежедневных поездок
});

module.exports = mongoose.model('Flight', FlightSchema);
