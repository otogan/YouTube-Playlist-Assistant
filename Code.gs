function searchChannelByKeywordTest() {
  var items = searchChannelByKeyword('Keyword');
  items.forEach(item => Logger.log('%s: [%s]', item.snippet.title, item.snippet.channelId));
}
var searchChannelByKeyword = function(keyword) {
  quota.log('Search: list', 100);
  var response = YouTube.Search.list('snippet', {
    q: keyword,
    maxResults: 50,
    type: 'channel'
  });
  return response.items;
};

// My Playlist
function insertPlaylistTest() {
  var playlist = insertPlaylist('Daily List', "unlisted");
  var playlistId = playlist.id;
}
// https://developers.google.com/youtube/v3/docs/playlists/insert
var insertPlaylist = function(title, privacyStatus) {
  quota.log('Playlists: insert', 54);
  var playlist = YouTube.Playlists.insert({
    "snippet": {
      "title": title
    },
    "status": {
      "privacyStatus": privacyStatus
    }
  }, 'snippet,status');
  
  Logger.log(playlist.id);
  return playlist;
};


function deletePlaylistTest() {
  // my playlist
  deletePlaylist('PLLwLMzgSySadqKaY_kq7jMfHHvAAE');
}
// https://developers.google.com/youtube/v3/docs/playlists/delete
var deletePlaylist = function(playlistId) {
  quota.log('Playlists: delete', 50);
  YouTube.Playlists.remove(playlistId);
};


function listPlaylistItemsTest() {
  var items = getPlaylistItems(mainPlaylist.id, new Date(0));
  
  items.forEach((item, index) => Logger.log('%s - id: %s\nvideo: %s => %s',index, item.id, item.snippet.resourceId.videoId, item.snippet.publishedAt));
  items.forEach(item => Logger.log(item));
}
// https://developers.google.com/youtube/v3/docs/playlistItems#snippet
var listPlaylistItems = function(playlistId, pageToken = '') {
  quota.log('PlaylistItems: list', 5);
  var response = YouTube.PlaylistItems.list('snippet,contentDetails', {
    "maxResults": 50,
    "playlistId": playlistId,
    "pageToken": pageToken
  });
  var items = response.items;
  pageToken = response.nextPageToken;
  if (pageToken) {
    items = items.concat(listPlaylistItems(playlistId, pageToken));
  }
  return items;
};
var filterPrivatePlaylistItems = function(items) {
  return items.filter(item => item.snippet.thumbnails != undefined);
};
var parsePlaylistItemDates = function(items) {
  session.log('>> parsing playlist itmes');
  items.forEach(item => parsePlaylistItemDate(item));
};
var parsePlaylistItemDate = function(item) {
  item.contentDetails.videoPublishedAt = new Date(item.contentDetails.videoPublishedAt);
};
var sortPlaylistItems = function(items) {
  session.log('>> sorting playlist items');
  // sort descending
  items.sort((a, b) => b.contentDetails.videoPublishedAt.getTime() - a.contentDetails.videoPublishedAt.getTime());
};
var filterPlaylistItems = function(items, publishedAfter = new Date(0)) {
  return items.filter(item => item.contentDetails.videoPublishedAt.getTime() >= publishedAfter.getTime());
}
function getPlaylistItems(playlistId, publishedAfter) {
  session.log('>> pulling playlist items');
  var items = listPlaylistItems(playlistId);
  items = filterPrivatePlaylistItems(items);
  
  parsePlaylistItemDates(items);
  items = filterPlaylistItems(items, publishedAfter);
  
  sortPlaylistItems(items);
  return items;
}

function insertPlaylistItemTest() {
  // My Playlist
  insertPlaylistItem('PLLwLMzgSySacUxzaobR8xtotvPJlM7S', 'M7FIv5J10');
}
// https://developers.google.com/youtube/v3/docs/playlistItems/insert
var insertPlaylistItem = function(playlistId, videoId, kind = 'youtube#video') {
  quota.log('PlaylistItems: insert', 54);
  var playlistItem = YouTube.PlaylistItems.insert({
    "snippet": {
      "playlistId": playlistId,
      "resourceId": {
        "kind": kind,
        "videoId": videoId
      }
    }
  }, "snippet,contentDetails");
  parsePlaylistItemDate(playlistItem);
  return playlistItem;
};


function deletePlaylistItemTest() {
  deletePlaylistItem('UExMd0xNemdTeVNhY1V4emFvYlJTh4dG90dlBKbE03Uy45ODRDg0QjA4NkFBNkQy');
}
// https://developers.google.com/youtube/v3/docs/playlistItems/delete
var deletePlaylistItem = function(playlistItemId) {
  session.log('>> deleting playlist item: ' + playlistItemId);
  quota.log('PlaylistItems: delete', 50);
  YouTube.PlaylistItems.remove(playlistItemId);
};


function listVideosTest() {
//  var items = getVideoItems(['wh2xVY_XGc','Ks-_MhQhMc','c0KYUj0TM4','eIho2S0ahI']);
  var items = listVideos('wh2xVY_XGc');
  Logger.log(JSON.stringify(items[0]));
  items = getVideoItems('wh2xVY_XGc');
  Logger.log(JSON.stringify(items[0]));
}
// https://developers.google.com/youtube/v3/docs/videos#contentDetails
var listVideos = function(ids) {
  ids = Array.isArray(ids) ? ids : [ids];
  var items = [];
  var i = 0, max = 50;
  do {
    quota.log('Videos: list', 3);
    var response = YouTube.Videos.list('contentDetails', {
      id: ids.slice(i, i + max).join(',')
    });
    items = items.concat(response.items);
    i += max;
  } while (i < ids.length);
  return items;
};
var parseVideoDurations = function(items) {
  items.forEach(
    item => item.contentDetails.duration = 
      parseISO8601Duration(item.contentDetails.duration).toMilliseconds());
}
var getVideoItems = function(ids) {
  var items = listVideos(ids);
  parseVideoDurations(items);
  return items;
}


function listChannelActivitiesTest() {
  var items = listChannelActivities(props.channels[0].id, props.channels[0].dateAfter);
  Logger.log(items.length);
  Logger.log(items);
}
// https://developers.google.com/youtube/v3/docs/activities#snippet
var listChannelActivities = function(channelId, publishedAfter = new Date(0), type = 'upload') {
  quota.log('Activities: list', 5);
  var response = YouTube.Activities.list('snippet,contentDetails', {
    channelId: channelId,
    publishedAfter: publishedAfter.toISOString(),
    maxResults: 50
  });
  return response.items.filter(item => item.snippet.type == type);
};


function test() {
//  var items = [];
//  for (var i = 0; i < 50; i++) {
//    var date = new Date();
//    items.push({
//      date: new Date(date.getTime() + Math.floor(Math.random() * 500000000 - 250000000))
//    });
//  }
//  items.sort((a, b) => b.date - a.date);
//  items.forEach(item => Logger.log(item.date));
  

  var ids = [1,2,3,4,5,6,7,8,9];
  for (var n of ids) {
    Logger.log(n);
  }
}

