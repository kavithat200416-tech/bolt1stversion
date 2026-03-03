let spotifyAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

async function refreshSpotifyToken() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) throw new Error('Failed to get Spotify token');

  const data = await response.json();
  spotifyAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);

  return spotifyAccessToken;
}

export async function getSpotifyToken() {
  if (spotifyAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return spotifyAccessToken;
  }
  return refreshSpotifyToken();
}

export async function spotifyFetch(endpoint: string, options?: RequestInit) {
  const token = await getSpotifyToken();
  const url = `https://api.spotify.com/v1${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
  return response.json();
}

export async function searchSpotify(query: string, type: string = 'track,artist', limit: number = 20) {
  return spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`);
}

export async function getTrack(id: string) {
  return spotifyFetch(`/tracks/${id}`);
}

export async function getTracks(ids: string[]) {
  const chunks = [];
  for (let i = 0; i < ids.length; i += 50) {
    chunks.push(ids.slice(i, i + 50).join(','));
  }
  const results = [];
  for (const chunk of chunks) {
    const data = await spotifyFetch(`/tracks?ids=${chunk}`);
    results.push(...data.tracks);
  }
  return results;
}

export async function getArtist(id: string) {
  return spotifyFetch(`/artists/${id}`);
}

export async function getArtistTopTracks(id: string) {
  return spotifyFetch(`/artists/${id}/top-tracks?market=IN`);
}

export async function getRelatedArtists(id: string) {
  return spotifyFetch(`/artists/${id}/related-artists`);
}

export async function getAudioFeatures(id: string) {
  return spotifyFetch(`/audio-features/${id}`);
}

export async function getNewReleases() {
  return spotifyFetch('/browse/new-releases?country=IN&limit=50');
}
