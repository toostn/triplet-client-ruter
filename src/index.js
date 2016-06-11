var Client = require('triplet-core/client.js')
var parsers = require('./parsers.js')
var urlParams = require('./url-params')

var BASE_URL = 'https://reisapi.ruter.no'

function ruterUrl (endpoint) {
  return BASE_URL + endpoint
}

module.exports = function rutClientFactory (http) {
  return new Client(http, {
    shortName: 'rut',
    fullName: 'Ruter AS',
    params: urlParams,
    parsers: parsers,
    stations: ruterUrl('/Place/GetPlaces'),
    trips: ruterUrl('/Travel/GetTravels'),
    nearbyStations: ruterUrl('/Place/GetClosestStops'),
    geojson: require('./area.json'),
    supports: {
      realtime: false,
      coordinateSearch: true,
      quickMode: true
    }
  })
}
