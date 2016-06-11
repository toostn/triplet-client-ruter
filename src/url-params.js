var LocalTime = require('triplet-core/local-time.js')
var UtmUtil = require('triplet-core/util/utm-util.js')
var dtString = require('triplet-core/util/client-util.js').dtString
var PAST_TRIP_SEARCH_TIME = 300000

exports.trips = function trips (query) {
  var params = {
    isAfter: 'True',
    proposals: query.maxResults || 6
  }
  var from = query.from
  var to = query.to

  if (from.id !== null && from.id !== undefined) {
    params.fromplace = from.id
  } else if (from.location) {
    params.fromplace = coordinateString(from.location)
  }

  if (to.id !== null && to.id !== undefined) {
    params.toplace = to.id
  } else if (to.location) {
    params.toplace = coordinateString(to.location)
  }

  var localDate = LocalTime.get()
  var date = query.date || new Date(localDate.getTime() - PAST_TRIP_SEARCH_TIME)

  params.time = [
    dtString(date.getDate()),
    dtString(date.getMonth() + 1),
    date.getFullYear(),
    dtString(date.getHours()),
    dtString(date.getMinutes())
  ].join('')

  if (query.quickMode) {
    params.changemargin = 1
    params.walkingfactor = 120
    params.changepunish = 3
  }

  return params
}

exports.nearbyStations = function nearbyStations (query) {
  var params = {}
  var location = query.location

  if (location) {
    params.coordinates = coordinateString(location)
  }

  params.maxdistance = query.radius || 3000
  params.proposals = query.resultMaxCount || 15

  return params
}

exports.stations = function stations (query) {
  return {id: query.queryString}
}

function coordinateString (location) {
  var utmCoords = UtmUtil.fromWGS84(location)
  return '(x=' + utmCoords.x.toFixed(0) + ',y=' + utmCoords.y.toFixed(0) + ')'
}
