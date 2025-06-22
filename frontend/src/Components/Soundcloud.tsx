import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Download, Shuffle, Repeat, Sparkles } from 'lucide-react';

// --- INTERFACES ---
interface Track {
  id: number;
  title: string;
  url: string;
  cover: string;
  mood: string;
  genre: string;
  duration: string;
  artist: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    tracks: Track[];
    mood: string;
    genre: string;
    total: number;
  };
  error?: string;
}

// --- COMPONENT ---
const Soundcloud = () => {
  // --- STATE MANAGEMENT ---
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMood, setSelectedMood] = useState('happy');
  const [selectedGenre, setSelectedGenre] = useState('pop');
  const [generatedTracks, setGeneratedTracks] = useState<Track[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [moods, setMoods] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<number>>(new Set());
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');

  // Audio & UI State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isLoading, setIsLoading] = useState(false); // For individual track loading
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isAppLoading, setIsAppLoading] = useState(true); // **FIX: State for initial app load**

  // API base URL
  // **FIX: Removed process.env which causes a crash in the browser.**
  const API_BASE_URL = 'https://sound-player.onrender.com';

  // --- PLAYER LOGIC (MEMOIZED WITH useCallback FOR STABILITY) ---

  const playNext = useCallback(() => {
    if (generatedTracks.length === 0) return;

    let nextIndex;
    if (isShuffled) {
      // Don't pick the same track twice in a row during shuffle
      let randomIndex = Math.floor(Math.random() * generatedTracks.length);
      while (generatedTracks.length > 1 && randomIndex === currentTrackIndex) {
        randomIndex = Math.floor(Math.random() * generatedTracks.length);
      }
      nextIndex = randomIndex;
    } else {
      nextIndex = (currentTrackIndex + 1) % generatedTracks.length;
    }

    // Stop playing if at the end of the list and repeat is off
    if (repeatMode === 'none' && !isShuffled && currentTrackIndex === generatedTracks.length - 1) {
      setIsPlaying(false);
      // Optional: rewind the track
      if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }

    setCurrentTrack(generatedTracks[nextIndex]);
    setIsPlaying(true);
  }, [generatedTracks, isShuffled, currentTrackIndex, repeatMode]);

  const playPrevious = useCallback(() => {
    if (generatedTracks.length === 0) return;
    
    let prevIndex;
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * generatedTracks.length);
    } else {
      prevIndex = currentTrackIndex === 0 ? generatedTracks.length - 1 : currentTrackIndex - 1;
    }
    
    setCurrentTrack(generatedTracks[prevIndex]);
    setIsPlaying(true);
  }, [generatedTracks, isShuffled, currentTrackIndex]);


  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    } else {
      playNext();
    }
  }, [repeatMode, playNext]);


  // --- SIDE EFFECTS (useEffect) ---

  // **FIX: Initial audio setup. Depends on `handleTrackEnd` to avoid stale state.**
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleLoadedMetadata = () => { setDuration(audio.duration || 0); setIsLoading(false); };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => { setError('An error occurred loading the audio track.'); setIsLoading(false); };

    audio.addEventListener('ended', handleTrackEnd); // Use the memoized callback
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [handleTrackEnd, volume]);

  // **FIX: Robustly fetch initial data on mount.**
  useEffect(() => {
    const fetchMoodsAndGenres = async () => {
      setIsAppLoading(true);
      const fallbackMoods = ['happy', 'chill', 'energetic', 'romantic', 'focus', 'dreamy'];
      const fallbackGenres = ['pop', 'rock', 'jazz', 'electronic', 'hip-hop', 'classical'];

      try {
        const [moodsResponse, genresResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/moods`),
          fetch(`${API_BASE_URL}/api/genres`)
        ]);

        if (!moodsResponse.ok || !genresResponse.ok) throw new Error("Network request failed");
        
        const moodsData = await moodsResponse.json();
        const genresData = await genresResponse.json();

        setMoods(moodsData.success && moodsData.data.length > 0 ? moodsData.data : fallbackMoods);
        setGenres(genresData.success && genresData.data.length > 0 ? genresData.data : fallbackGenres);
        
      } catch (error) {
        console.error('Error fetching moods and genres:', error);
        setError("Could not load initial data. Using fallbacks.");
        setMoods(fallbackMoods);
        setGenres(fallbackGenres);
      } finally {
        setIsAppLoading(false);
      }
    };

    fetchMoodsAndGenres();
  }, [API_BASE_URL]);

  // **FIX: Combined effects for playing audio to be more stable.**
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      if (audioRef.current.src !== currentTrack.url) {
        audioRef.current.src = currentTrack.url;
      }
      if (isPlaying) {
        audioRef.current.play().catch(e => {
            console.error("Error playing track:", e);
            setError("Could not play this track. It may be protected or invalid.");
            setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrack, isPlaying]);

  // Effect to update the current track index
  useEffect(() => {
    if (!currentTrack) {
      setCurrentTrackIndex(-1);
      return;
    }
    const index = generatedTracks.findIndex(track => track.id === currentTrack.id);
    setCurrentTrackIndex(index);
  }, [currentTrack, generatedTracks]);


  // --- OTHER HANDLER FUNCTIONS ---

  const generateMusic = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: selectedMood, genre: selectedGenre }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data: ApiResponse = await response.json();
      if (data.success && data.data.tracks.length > 0) {
        setGeneratedTracks(data.data.tracks);
        setCurrentTrack(data.data.tracks[0]); // Auto-play first track
        setIsPlaying(true);
      } else {
        setError(data.error || 'No tracks found for this combination. Try another!');
        setGeneratedTracks([]);
        setCurrentTrack(null);
      }
    } catch (error) {
      console.error('Error generating music:', error);
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => { if (currentTrack) setIsPlaying(!isPlaying); };

  const toggleShuffle = () => setIsShuffled(!isShuffled);

  const toggleRepeat = () => {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width);
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!audioRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const newVolume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setVolume(newVolume);
      audioRef.current.volume = newVolume;
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadTrack = async (track: Track) => {
      try {
        const response = await fetch(track.url);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${track.artist} - ${track.title}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } catch (error) {
          console.error('Download error:', error);
          setError('Could not download track.');
      }
  };

  const toggleLike = (trackId: number) => {
    setLikedTracks(prev => {
      const newLiked = new Set(prev);
      newLiked.has(trackId) ? newLiked.delete(trackId) : newLiked.add(trackId);
      return newLiked;
    });
  };

  const dismissError = () => setError(null);

  const progress = duration ? (currentTime / duration) * 100 : 0;


  // --- RENDER LOGIC ---

  // **FIX: Initial loading screen to prevent black screen flash.**
  if (isAppLoading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white">
            <div className="text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 animate-spin text-white/80" />
                <h1 className="text-2xl font-bold tracking-wider">Loading SoundScape...</h1>
            </div>
        </div>
    );
  }

  // --- MAIN JSX ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>
      
      {/* Header */}
      <header className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="backdrop-blur-xl bg-white/[0.03] rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-2xl">
            {/* App Title */}
            <div className="flex items-center justify-center mb-8 sm:mb-10">
              <div className="flex items-center space-x-4">
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    SoundScape Generator
                  </h1>
                  <p className="text-white/60 text-sm sm:text-base mt-1">Discover royalty-free music for your mood</p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-center flex justify-between items-center">
                <span>{error}</span>
                <button 
                  onClick={dismissError}
                  className="ml-4 text-red-300 hover:text-white transition-colors"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Mood and Genre Selection */}
            <div className="space-y-8 sm:space-y-10">
              {/* Mood Selection */}
              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-semibold text-white/90 mb-6 tracking-wide">
                  What's your mood?
                </h3>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
                  {moods.map((mood) => (
                    <button
                      key={mood}
                      onClick={() => setSelectedMood(mood)}
                      className={`px-6 py-3 sm:px-8 sm:py-4 rounded-2xl text-sm sm:text-base font-medium transition-all duration-300 transform hover:scale-105 ${
                        selectedMood === mood
                          ? 'bg-gradient-to-r from-purple-500 to-purple-800 text-white shadow-xl shadow-purple-500/25 scale-105'
                          : 'bg-white/[0.05] backdrop-blur-xl text-white/80 hover:bg-white/[0.12] hover:text-white border border-white/[0.08] hover:border-white/[0.15]'
                      }`}
                    >
                      {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre Selection */}
              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-semibold text-white/90 mb-6 tracking-wide">
                  Choose your genre
                </h3>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-6 py-3 sm:px-8 sm:py-4 rounded-2xl text-sm sm:text-base font-medium transition-all duration-300 transform hover:scale-105 ${
                        selectedGenre === genre
                          ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-xl shadow-purple-500/25 scale-105'
                          : 'bg-white/[0.05] backdrop-blur-xl text-white/80 hover:bg-white/[0.12] hover:text-white border border-white/[0.08] hover:border-white/[0.15]'
                      }`}
                    >
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center mt-10 sm:mt-12">
              <button
                onClick={generateMusic}
                disabled={isGenerating}
                className="group relative px-8 py-4 sm:px-12 sm:py-5 bg-gradient-to-r from-violet-500 via-purple-600 to-violet-600 rounded-2xl font-semibold text-base sm:text-lg transition-all duration-300 hover:scale-105 shadow-xl shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Sparkles className={`w-6 h-6 sm:w-7 sm:h-7 ${isGenerating ? 'animate-spin' : 'group-hover:rotate-12'} transition-transform`} />
                  <span className="whitespace-nowrap">
                    {isGenerating ? 'Generating...' : `Generate ${selectedMood} ${selectedGenre}`}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Generated Music Grid */}
      {generatedTracks.length > 0 && (
        <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-32 sm:pb-40">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-center sm:text-left">
                Your {selectedMood} {selectedGenre} Playlist
              </h2>
              <button 
                onClick={generateMusic}
                disabled={isGenerating}
                className="flex items-center justify-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] text-white/80 hover:text-white hover:bg-white/[0.12] transition-all duration-300 mx-auto sm:mx-0 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Regenerate</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {generatedTracks.map((track) => (
                <div
                  key={track.id}
                  className="group backdrop-blur-xl bg-white/[0.03] rounded-3xl p-4 sm:p-6 border border-white/[0.08] hover:bg-white/[0.08] transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10"
                >
                  <div className="relative mb-4 sm:mb-6">
                    <img
                      src={track.cover}
                      alt={track.title}
                      className="w-full aspect-square object-cover rounded-2xl shadow-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://placehold.co/300x300/1e293b/ffffff?text=${encodeURIComponent(track.title)}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex space-x-2">
                      <button
                        onClick={() => playTrack(track)}
                        className="bg-white/90 backdrop-blur-sm rounded-full p-2 sm:p-3 hover:scale-110 transition-transform shadow-lg"
                        disabled={isLoading && currentTrack?.id === track.id}
                        aria-label="Play or Pause"
                      >
                        {isLoading && currentTrack?.id === track.id ? (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ) : currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                        ) : (
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 text-black ml-0.5" />
                        )}
                      </button>
                      <button
                        onClick={() => downloadTrack(track)}
                        className="bg-emerald-500/90 backdrop-blur-sm rounded-full p-2 sm:p-3 hover:scale-110 transition-transform shadow-lg"
                        aria-label="Download"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </button>
                    </div>
                    {/* Currently playing indicator */}
                    {currentTrack?.id === track.id && (
                      <div className="absolute top-3 left-3 bg-emerald-500 rounded-full p-1 shadow-lg">
                        <div className={`w-2 h-2 bg-white rounded-full ${isPlaying ? 'animate-pulse' : ''}`}></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="font-semibold text-white text-base sm:text-lg truncate">{track.title}</h3>
                    <p className="text-sm text-white/70 truncate">{track.artist}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-lg capitalize">{track.mood}</span>
                        <span className="text-xs text-white/60">{track.duration}</span>
                      </div>
                      <button 
                        onClick={() => toggleLike(track.id)}
                        className="text-white/50 hover:text-white transition-colors"
                        aria-label="Like or Unlike"
                      >
                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${likedTracks.has(track.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Empty State */}
      {!isGenerating && generatedTracks.length === 0 && (
        <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-32 sm:pb-40">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16 sm:py-20">
              <div className="backdrop-blur-xl bg-white/[0.03] rounded-3xl p-8 sm:p-12 border border-white/[0.08] max-w-md mx-auto">
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">Ready to Generate Music</h3>
                <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                  Select your mood and genre, then click generate to discover royalty-free music crafted just for you.
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Bottom Player */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <div className="backdrop-blur-2xl bg-black/50 border-t border-white/[0.08] p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Progress Bar */}
              <div 
                className="w-full bg-white/20 rounded-full h-1.5 mb-4 group cursor-pointer"
                onClick={seekTo}
              >
                <div className="bg-gradient-to-r from-emerald-400 to-cyan-500 h-full rounded-full relative" style={{ width: `${progress}%` }}>
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between space-x-4">
                {/* Track Info */}
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <img
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl shadow-lg flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://placehold.co/64x64/1e293b/ffffff?text=${encodeURIComponent(currentTrack.title.charAt(0))}`;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-white text-sm sm:text-base truncate">{currentTrack.title}</h4>
                    <p className="text-white/60 text-xs sm:text-sm truncate">{currentTrack.artist}</p>
                    <div className="flex items-center space-x-2 text-xs text-white/50">
                      <span>{formatTime(currentTime)}</span>
                      <span>/</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
                  <button 
                    onClick={toggleShuffle}
                    className={`hidden sm:block transition-colors p-2 rounded-full ${ isShuffled ? 'text-emerald-400 bg-white/10' : 'text-white/60 hover:text-white' }`}
                    aria-label="Shuffle"
                  >
                    <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button 
                    onClick={playPrevious}
                    className="text-white/80 hover:text-white transition-colors"
                    aria-label="Previous Track"
                  >
                    <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="bg-white rounded-full p-2 sm:p-3 hover:scale-110 transition-transform shadow-lg flex-shrink-0"
                    disabled={isLoading}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                    ) : (
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 text-black ml-0.5" />
                    )}
                  </button>
                  <button 
                    onClick={playNext}
                    className="text-white/80 hover:text-white transition-colors"
                    aria-label="Next Track"
                  >
                    <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button 
                    onClick={toggleRepeat}
                    className={`hidden sm:block transition-colors p-2 rounded-full relative ${ repeatMode !== 'none' ? 'text-emerald-400 bg-white/10' : 'text-white/60 hover:text-white'}`}
                    aria-label="Repeat"
                  >
                    <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
                    {repeatMode === 'one' && (
                      <span className="absolute bottom-1 right-1 w-1 h-1 bg-emerald-400 rounded-full shadow-sm"></span>
                    )}
                  </button>
                </div>

                {/* Volume and extra controls */}
                <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
                   <div className="flex items-center space-x-3">
                      <Volume2 className="w-5 h-5 text-white/60" />
                      <div 
                        className="w-24 h-1.5 bg-white/20 rounded-full cursor-pointer group relative"
                        onClick={handleVolumeChange}
                      >
                        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${volume * 100}%` }}>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      </div>
                   </div>
                   <div className="flex items-center space-x-2">
                       <button 
                         onClick={() => downloadTrack(currentTrack)}
                         className="text-white/60 hover:text-white transition-colors p-2"
                         aria-label="Download Current Track"
                       >
                         <Download className="w-5 h-5" />
                       </button>
                       <button 
                         onClick={() => toggleLike(currentTrack.id)}
                         className="text-white/60 hover:text-white transition-colors p-2"
                         aria-label="Like or Unlike Current Track"
                       >
                         <Heart className={`w-5 h-5 transition-all ${likedTracks.has(currentTrack.id) ? 'fill-red-500 text-red-500' : ''}`} />
                       </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Soundcloud;
