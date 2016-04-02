var Station = require('triplet-core/trip-models/station');
var GeoPoint = require('triplet-core/trip-models/geopoint');
var Trip = require('triplet-core/trip-models/trip');
var Leg = require('triplet-core/trip-models/leg');
var LegStop = require('triplet-core/trip-models/leg-stop');
var Carrier = require('triplet-core/trip-models/carrier');
var Line = require('triplet-core/trip-models/line');
var Location = require('triplet-core/trip-models/location');
var Utils = require('triplet-core/util/client-util.js');
var UtmUtil = require('triplet-core/util/utm-util.js');
var forceArray = Utils.forceArray;
var parseDate = Utils.parseLocalDate;

exports.stationsError = function stationsError(json) {
  if (!json || json.constructor !== Array) { return 'roerrorinternal'; }
  return undefined;
};

exports.stations = function stations(json) {
  return forceArray(json)
    .map(station)
    .filter(function(s) { return s.id !== undefined; });
};

exports.nearbyStationsError = exports.stationsError;

exports.nearbyStations = function nearbyStations(json) {
  return forceArray(json).map(station);
};

exports.tripsError = function tripsError(json) {
  return json.ReisError ? json.ReisError.Description : null;
};

exports.trips = function(json) {
  var data = json.TravelProposals;
  return (!data) ? [] : forceArray(data).map(trip);
};

function station(json) {
  var location;

  if (json.X && json.Y) {
    var utmCoord = {x: json.X, y: json.Y};
    location = UtmUtil.toWGS84(utmCoord, 32);
  } else {
    location = new Location();
  }

  if (json.PlaceType === 'Stop' || json.PlaceType === 'Area') {
    return new Station({
      id: json.ID,
      name: json.Name,
      area: json.District,
      location: location,
      clientId: 'rut'
    });
  }

  return new GeoPoint({
    name: json.Name,
    area: json.District,
    location: location,
    clientId: 'rut'
  });
}

function trip(json) {
  return new Trip({
    legs: forceArray(json.Stages).map(leg).filter(function(l) { return l; }),
    messages: messages(json)
  });
}

function leg(json) {
  if (!json.DepartureStop || !json.ArrivalStop) { return null; }

  return new Leg({
    from: legStop(json.DepartureStop, json.DepartureTime),
    to: legStop(json.ArrivalStop, json.ArrivalTime),
    carrier: carrier(json),
    messages: messages(json)
  });
}

function legStop(json, time) {
  return new LegStop({
    point: station(json),
    track: '',
    plannedDate: date(time),
    realTimeDate: undefined,
    messages: messages(json)
  });
}

function carrier(json) {
  return new Carrier({
    name: json.LineName,
    heading: json.Destination,
    type: carrierType(json.Transportation),
    line: line(json),
    cancelled: (json.cancelled === true),
    flags: {
      details: json.JourneyDetailRef,
      accessibility: (json.accessibility === 'wheelChair')
    }
  });
}

function carrierType(type) {
  switch (type) {
    case 0:
      return Carrier.Types.walk;
    case 1:
    case 2:
      return Carrier.Types.bus;
    case 4:
    case 6:
      return Carrier.Types.train;
    case 5:
      return Carrier.Types.boat;
    case 7:
      return Carrier.Types.tram;
    case 8:
      return Carrier.Types.metro;
  }

  return Carrier.Types.unknown;
}

function date(timeString) {
  var components = timeString.split('T');
  return parseDate(components[0], components[1]);
}

function line(json) {
  return new Line({
    name: json.LineName,
    colorFg: '#ffffff',
    colorBg: '#' + json.LineColour
  });
}

function messages(json) {
  var msgs = [];

  if (json.Remarks) {
    msgs = msgs.concat(forceArray(json.Remarks).map(message));
  }

  if (json.Deviations) {
    msgs = msgs.concat(forceArray(json.Deviations).map(message));
  }

  return msgs;
}

function message(json) {
  return json.Header;
}
