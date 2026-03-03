import { supabase } from './supabase';
import { searchSpotify, getTrack, getAudioFeatures, getArtist } from './spotify';
import { getTopTracksByTag, getTrackInfo } from './lastfm';

export async function getSongs(limit: number = 20, offset: number = 0) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function getSongsByLanguage(language: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('language', language)
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function searchSongs(query: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .or(`title.ilike.%${query}%,artist_name.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getSongById(id: string) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createOrGetSong(spotifyTrackId: string) {
  let { data: song, error } = await supabase
    .from('songs')
    .select('*')
    .eq('spotify_id', spotifyTrackId)
    .maybeSingle();

  if (error) throw error;
  if (song) return song;

  const spotifyTrack = await getTrack(spotifyTrackId);
  const audioFeatures = await getAudioFeatures(spotifyTrackId);

  const newSong = {
    title: spotifyTrack.name,
    artist_name: spotifyTrack.artists[0].name,
    artist_id: spotifyTrack.artists[0].id,
    album: spotifyTrack.album.name,
    year: parseInt(spotifyTrack.album.release_date.split('-')[0]),
    spotify_id: spotifyTrack.id,
    spotify_url: spotifyTrack.external_urls.spotify,
    cover_image: spotifyTrack.album.images[0]?.url || '',
    preview_url: spotifyTrack.preview_url,
    audio_features: audioFeatures,
    language: 'English',
    genre: 'Unknown',
  };

  const { data: created, error: createError } = await supabase
    .from('songs')
    .insert([newSong])
    .select()
    .single();

  if (createError) throw createError;
  return created;
}

export async function getTrendingSongs(language: string) {
  const { data, error } = await supabase
    .from('trending_cache')
    .select('songs')
    .eq('language', language)
    .maybeSingle();

  if (error) throw error;
  return data?.songs || [];
}

export async function getRecommendations(userId: string) {
  const { data, error } = await supabase
    .from('recommendation_cache')
    .select('songs')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.songs || [];
}

export async function getUserLogs(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('logs')
    .select('*, song:songs(*), user:users(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getActivityFeed(userId: string, limit: number = 20) {
  const user = await supabase.from('users').select('*').eq('id', userId).single();
  const followingIds = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const ids = (followingIds.data || []).map(f => f.following_id);

  if (ids.length === 0) {
    const { data, error } = await supabase
      .from('logs')
      .select('*, song:songs(*), user:users(*)')
      .eq('user:users.is_virtual', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  const { data, error } = await supabase
    .from('logs')
    .select('*, song:songs(*), user:users(*)')
    .in('user_id', ids)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function createLog(userId: string, songId: string, rating: number, listenedBefore: boolean, listenedAt?: string) {
  const { data, error } = await supabase
    .from('logs')
    .insert([
      {
        user_id: userId,
        song_id: songId,
        rating,
        listened_before: listenedBefore,
        listened_at: listenedAt,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('songs')
    .update({ total_logs: (await getSongById(songId))?.total_logs + 1 || 1 })
    .eq('id', songId);

  return data;
}

export async function createReview(userId: string, songId: string, text: string, sentimentScore: number, sentimentTag: string, toxicityScore: number) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([
      {
        user_id: userId,
        song_id: songId,
        text,
        sentiment_score: sentimentScore,
        sentiment_tag: sentimentTag,
        toxicity_score: toxicityScore,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSongReviews(songId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, user:users(*)')
    .eq('song_id', songId)
    .lt('toxicity_score', 0.5)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .insert([{ follower_id: followerId, following_id: followingId }]);

  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;
}

export async function isFollowing(followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function getFollowers(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower:users(*)')
    .eq('following_id', userId);

  if (error) throw error;
  return data?.map(f => f.follower) || [];
}

export async function getFollowing(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('following:users(*)')
    .eq('follower_id', userId);

  if (error) throw error;
  return data?.map(f => f.following) || [];
}
