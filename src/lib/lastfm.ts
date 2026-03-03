const LASTFM_API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';

export async function lastfmFetch(params: Record<string, any>) {
  const searchParams = new URLSearchParams({
    ...params,
    api_key: LASTFM_API_KEY,
    format: 'json',
  });

  const response = await fetch(`${LASTFM_BASE}?${searchParams}`);
  if (!response.ok) throw new Error('Last.fm API error');
  return response.json();
}

export async function getTopTracksByTag(tag: string, limit: number = 50) {
  return lastfmFetch({
    method: 'tag.gettoptracks',
    tag,
    limit,
  });
}

export async function getTopArtistsByTag(tag: string, limit: number = 20) {
  return lastfmFetch({
    method: 'tag.gettopartists',
    tag,
    limit,
  });
}

export async function getArtistTopTracks(artist: string, limit: number = 20) {
  return lastfmFetch({
    method: 'artist.gettoptracks',
    artist,
    limit,
  });
}

export async function getSimilarArtists(artist: string, limit: number = 10) {
  return lastfmFetch({
    method: 'artist.getsimilar',
    artist,
    limit,
  });
}

export async function getTrackInfo(artist: string, track: string) {
  return lastfmFetch({
    method: 'track.getinfo',
    artist,
    track,
  });
}

export async function getSimilarTracks(artist: string, track: string, limit: number = 10) {
  return lastfmFetch({
    method: 'track.getsimilar',
    artist,
    track,
    limit,
  });
}

export async function getChartTracks(limit: number = 50) {
  return lastfmFetch({
    method: 'chart.gettoptracks',
    limit,
  });
}
