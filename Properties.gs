var props = {
  playlists: [{
      title: 'Title 1',
      id: 'PLlICHAB9ActuR7I-CJltvTXenb',
      dateAfter: getDateAgo('P1WT')
    }, {
      title: 'Title 2',
      id: 'PLlICHAB9ActFenIaT4VL6pkVlNRJ',
      dateAfter: getDateAgo('P1WT')
  }],
  channels: [{
      title: 'Channel Name',
      id: 'UCiAv2GdtlNzptHocsw',
      dateAfter: getDateAgo('P1MT')
  }]
};

var mainPlaylist = {
  id: 'PLLwLMzgSySobRExtotvPJlM7S',
  maxDuration: parseISO8601Duration('PT12H').toMilliseconds(),
  duration: 0,
  items: []
};


function quotaTest() {
  Logger.log('Quota Test');
  quota.initiate();
  quota.log('PlaylistItems: delete', 50);
  quota.log('PlaylistItems: list',4);
  quota.logTotal();
  
}
var quota = {
  cost: 0,
  logging: false,
  initiate: function() {
    this.logging = true;
    Logger.log('Quota logging initiated');
  },
  log: function(method, cost) {
    this.cost += cost;
    if (this.logging)
      Logger.log('API > %s [Cost: %s units]\n%s', method, cost, this.getTotal('Current'));
  },
  getTotal: function(initial) {
    return '[' + initial + ' Quota Cost: ' + this.cost + ' units]';
  },
  logTotal: function() {
    if (this.logging)
      Logger.log(this.getTotal('Total'));
  }
};


function sessionTest() {
  session.initiate();
  session.log('hello');
}
var session = {
  logging: false,
  log: function(message) {
    if (this.logging)
      Logger.log(message);
  },
  initiate: function() {
    this.logging = true;
    this.log('Session initiated');
  },
  end: function(duration) {
    this.log('Session over\nTotal duration of playlist: ' + duration);
  }
};


// main program
function managePlaylistVideos() {
  session.initiate();
  quota.initiate();
  
  initMainPlaylist();
  processProps();
  
  quota.logTotal();
  session.end(mainPlaylist.duration);
}


//class Playlist
var initMainPlaylist = function() {
  session.log('Initiating Main Playlist preparation');
  session.log('> pull mainPlaylist');
  mainPlaylist.items = getPlaylistItems(mainPlaylist.id);
  session.log('> pull mainPlaylist video items');
  addVideoItemsToPlaylistItems(mainPlaylist.items);
  mainPlaylist.duration = calculatePlaylistDuration(mainPlaylist.items);
}


var processProps = function() {
  // add playlist videos to main playlist
  for (const playlist of props.playlists) {
    session.log('> pull playlist: ' + playlist.title + ' (id: ' + playlist.id + ')');
    var playlistItems = getPlaylistItems(playlist.id, playlist.dateAfter);
    var videoItems = getVideoItems(getVideoIdsFromPlaylistItems(playlistItems));
    videoItems.forEach(videoItem => addVideoToMainPlaylist(videoItem));
  }
  // add channel videos to main playlist
  for (const channel of props.channels) {
    session.log('> pull channel: ' + channel.title + ' (id: ' + channel.id + ')');
    var activities = listChannelActivities(channel.id, channel.dateAfter);
    var videoItems = getVideoItems(getVideoIdsFromActivities(activities));
    videoItems.forEach(videoItem => addVideoToMainPlaylist(videoItem));
  }
  reduceMainPlaylistItems();
};


var reduceMainPlaylistItems = function() {
  if (mainPlaylist.duration > mainPlaylist.maxDuration) {
    session.log('> reduce mainPlaylist duration from ' + mainPlaylist.duration + ' to ' + mainPlaylist.maxDuration);
    sortPlaylistItems(mainPlaylist.items);
  } else {
    return;
  }
  while (mainPlaylist.duration > mainPlaylist.maxDuration) {
    removeItemFromMainPlaylist(mainPlaylist.items.pop());
  }
  session.log('> mainPlaylist final duration: ' + mainPlaylist.duration);
};


function removeItemFromMainPlaylistTest() {
  initMainPlaylist();
  Logger.log('Initial number of videos:' + mainPlaylist.items.length);
  Logger.log('Initial duration:' + mainPlaylist.duration);
  removeItemFromMainPlaylist(mainPlaylist.items.pop());
  Logger.log('Final number of videos:' + mainPlaylist.items.length);
  Logger.log('Final duration:' + mainPlaylist.duration);
}
var removeItemFromMainPlaylist = function(playlistItem) {
  deletePlaylistItem(playlistItem.id);
  var duration = playlistItem.videoItem.contentDetails.duration;
  mainPlaylist.duration -= duration;
  session.log('>> mainPlaylist duration reduced by ' + duration);
}


function addVideoToMainPlaylistTest() {
  initMainPlaylist();
  Logger.log('Initial number of videos:' + mainPlaylist.items.length);
  Logger.log('Initial duration:' + mainPlaylist.duration);
  var videoItems = getVideoItems(['dvLIvHbQZYw']);
  addVideoToMainPlaylist(videoItems[0]);
  Logger.log('Final number of videos:' + mainPlaylist.items.length);
  Logger.log('Final duration:' + mainPlaylist.duration);
}
var addVideoToMainPlaylist = function(videoItem) {
  if(!isVideoOnPlaylist(mainPlaylist.items, videoItem.id)) {
    var playlistItem = insertPlaylistItem(mainPlaylist.id, videoItem.id, videoItem.kind);
    playlistItem['videoItem'] = videoItem;
    mainPlaylist.items.push(playlistItem);
    mainPlaylist.duration += videoItem.contentDetails.duration;
  }
};


function isVideoOnPlaylistTest() {
  var items = getPlaylistItems(mainPlaylist.id);
  Logger.log(isVideoOnPlaylist(items, 'nLhw_-GFfBI'));
  Logger.log(isVideoOnPlaylist(items, ''));
}
var isVideoOnPlaylist = function(playlistItems, videoId) {
  return undefined != playlistItems.find(item => item.snippet.resourceId.videoId == videoId);
};


function calculatePlaylistDurationTest() {
  var items = getPlaylistItems(mainPlaylist.id);
  addVideoItemsToPlaylistItems(items);
  var duration = calculatePlaylistDuration(items);
  Logger.log(duration);
}
var calculatePlaylistDuration = function(playlistItems) {
  var duration = 0;
  playlistItems.forEach(item => duration += item.videoItem.contentDetails.duration);
  return duration;
};


function addVideoItemsToPlaylistItemsTest() {
  var items = getPlaylistItems(props.playlists[0].id, props.playlists[0].dateAfter);
  Logger.log(JSON.stringify(items[0]));
  addVideoItemsToPlaylistItems(items);
  Logger.log(JSON.stringify(items[0]));
}
var addVideoItemsToPlaylistItems = function(playlistItems) {
  var videoItems = getVideoItems(getVideoIdsFromPlaylistItems(playlistItems));
  playlistItems.forEach(
    pItem => pItem['videoItem'] = 
      videoItems.find(
        vItem => vItem.id == pItem.snippet.resourceId.videoId
      ));
};


function getVideoIdsFromPlaylistItemsTest() {
  var items = getPlaylistItems(props.playlists[0].id, props.playlists[0].dateAfter);
  var ids = getVideoIdsFromPlaylistItems(items);
  Logger.log(ids);
}
var getVideoIdsFromPlaylistItems = function(playlistItems) {
  var ids = [];
  playlistItems.forEach(item => ids.push(item.snippet.resourceId.videoId));
  return ids;
};

function getVideoIdsFromActivitiesTest() {
  var items = listChannelActivities(props.channels[0].id, props.channels[0].dateAfter);
  var ids = getVideoIdsFromActivities(items);
  Logger.log(ids);
}
var getVideoIdsFromActivities = function(activityItems) {
  var ids = [];
  activityItems.forEach(item => ids.push(item.contentDetails.upload.videoId));
  return ids;
}


function propsTest() {
  Logger.log(myPlaylist.items);
//  Logger.log(props.dateAfter.toLocaleString());
}


function getDateAgo(duration) {
  var date = new Date();
  return new Date(date.getTime() - parseISO8601Duration(duration).toMilliseconds());
};

function parseISO8601DurationTest() {
//  var duration = parseISO8601Duration('PT21M3S');
////  var date = new Date(duration.toMilliseconds());
//  Logger.log(duration.toHours());
  
  var duration = parseISO8601Duration('P1WT');
  var now = new Date();
  var date = new Date(now.getTime() - duration.toMilliseconds());
  Logger.log('%s', date.toISOString());
//  
//  duration = parseISO8601Duration('P1Y1M1W1DT1H46M55S');
////  date = new Date(duration.toMilliseconds());
//  Logger.log(duration.toHours());
}
function parseISO8601Duration(iso8601Duration) {
  var iso8601DurationRegex = /(-)?P(?:([.,\d]+)Y)?(?:([.,\d]+)M)?(?:([.,\d]+)W)?(?:([.,\d]+)D)?T(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?/;
  var matches = iso8601Duration.match(iso8601DurationRegex);
  
  return {
    sign: matches[1] === undefined ? '+' : '-',
    years: matches[2] === undefined ? 0 : matches[2],
    months: matches[3] === undefined ? 0 : matches[3],
    weeks: matches[4] === undefined ? 0 : matches[4],
    days: matches[5] === undefined ? 0 : matches[5],
    hours: matches[6] === undefined ? 0 : matches[6],
    minutes: matches[7] === undefined ? 0 : matches[7],
    seconds: matches[8] === undefined ? 0 : matches[8],
    toMilliseconds: function() {
      return this.seconds * 1000 +
        this.minutes * 1000 * 60 +
        this.hours * 1000 * 60 * 60 +
        this.days * 1000 * 60 * 60 * 24 +
        this.weeks * 1000 * 60 * 60 * 24 * 7 +
        this.months * 1000 * 60 * 60 * 24 * 30 +
        this.years * 1000 * 60 * 60 * 24 * 365;
    },
    toSeconds: function() {
      return this.toMilliseconds() / 1000;
    },
    toMinutes: function() {
      return this.toSeconds() / 60;
    },
    toHours: function() {
      return this.toMinutes() / 60;
    },
    toDays: function() {
      return this.toHours() / 24;
    }
  };
};
