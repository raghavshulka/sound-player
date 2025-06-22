const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Comprehensive music database with real royalty-free tracks
const musicDatabase = [
    {
      id: 1,
      title: "EONA - Emotional Ambient Pop",
      artist: "Rockot",
      url: "https://cdn.pixabay.com/audio/2025/05/29/audio_b92a610839.mp3",
      cover: "https://cdn.pixabay.com/audio/2025/05/29/12-35-32-759_200x200.jpg",
      mood: "dreamy",
      genre: "pop",
      duration: ""
    },
    {
      id: 2,
      title: "Jungle Waves (Drum&Bass Electronic Inspiring Promo)",
      artist: "DIMMYSAD",
      url: "https://cdn.pixabay.com/audio/2025/05/21/audio_fa20813ea6.mp3",
      cover: "https://cdn.pixabay.com/audio/2025/05/21/12-47-01-748_200x200.jpg",
      mood: "energetic",
      genre: "electronic",
      duration: ""
    },
    {
      id: 3,
      title: "Future Design",
      artist: "penguinmusic",
      url: "https://cdn.pixabay.com/audio/2025/05/20/audio_ec1f11ca43.mp3",
      cover: "https://cdn.pixabay.com/audio/2025/05/20/02-00-12-412_200x200.png",
      mood: "focus",
      genre: "electronic",
      duration: ""
    },
    {
      id: 4,
      title: "Brain Implant (Cyberpunk Sci-Fi Trailer Action Intro)",
      artist: "soundbay",
      url: "https://cdn.pixabay.com/audio/2025/04/21/audio_ed6f0ed574.mp3",
      cover: "https://cdn.pixabay.com/audio/2025/04/21/07-36-01-399_200x200.jpg",
      mood: "energetic",
      genre: "electronic",
      duration: ""
    },
    {
      id: 5,
      title: "Gorila",
      artist: "Alex_MakeMusic",
      url: "https://cdn.pixabay.com/audio/2025/03/19/audio_56ae1dae5f.mp3",
      cover: "https://cdn.pixabay.com/audio/2025/03/19/20-23-35-428_200x200.png",
      mood: "energetic",
      genre: "hip-hop",
      duration: ""
    },
    {
      id: 6,
      title: "Experimental Cinematic Hip-Hop",
      artist: "Rockot",
      url: "https://cdn.pixabay.com/audio/2025/03/19/audio_91b4c0a3b6.mp3",
      cover: "https://cdn.pixabay.com/audio/2025/03/20/08-24-22-588_200x200.jpg",
      mood: "focus",
      genre: "hip-hop",
      duration: ""
    },
    {
      id: 7,
      title: "Don`t Talk",
      artist: "Cosmonkey",
      url: "https://cdn.pixabay.com/audio/2025/03/18/audio_7d5c12b31a.mp3",
      cover: "https://cdn.pixabay.com/audio/2025/03/18/11-45-34-728_200x200.png",
      mood: "romantic",
      genre: "pop",
      duration: ""
    },
    {
      id: 8,
      title: "So Fresh",
      artist: "Cosmonkey",
      url: "https://cdn.pixabay.com/audio/2025/03/18/audio_5834a77ab9.mp3",
      cover: "https://cdn.pixabay.com/audio/2025/03/18/12-30-22-395_200x200.png",
      mood: "happy",
      genre: "pop",
      duration: ""
    },
    {
      id: 9,
      title: "Gardens - Stylish Chill",
      artist: "penguinmusic",
      url: "https://cdn.pixabay.com/audio/2025/02/19/audio_3b45f7d855.mp3",
      cover: "https://cdn.pixabay.com/audio/2025/02/19/22-25-20-336_200x200.png",
      mood: "chill",
      genre: "electronic",
      duration: ""
    },
    {
      id: 10,
      title: "Kugelsicher by TremoxBeatz",
      artist: "TremoxBeatz",
      url: "https://cdn.pixabay.com/audio/2025/02/18/audio_67a824edf7.mp3",
      cover: "https://cdn.pixabay.com/audio/2025/02/18/16-57-42-536_200x200.jpg",
      mood: "energetic",
      genre: "hip-hop",
      duration: ""
    },
    {
      id: 11,
      title: "Alone",
      artist: "BoDleasons",
      url: "https://cdn.pixabay.com/audio/2025/02/03/audio_502e27ab2b.mp3",
      cover: "https://cdn.pixabay.com/audio/2025/02/03/12-15-30-62_200x200.jpg",
      mood: "focus",
      genre: "rock",
      duration: ""
    },
    {
      id: 12,
      title: "Vlog Music (Beat Trailer Showreel Promo Background Intro Theme)",
      artist: "MFCC",
      url: "https://cdn.pixabay.com/audio/2024/12/09/audio_5c5be993bd.mp3",
      cover: "https://cdn.pixabay.com/audio/2024/12/09/09-16-15-132_200x200.png",
      mood: "happy",
      genre: "pop",
      duration: ""
    },
    {
      id: 13,
      title: "Spinning Head",
      artist: "Gvidon",
      url: "https://cdn.pixabay.com/audio/2024/12/02/audio_4255c48290.mp3",
      cover: "https://cdn.pixabay.com/audio/2024/12/02/06-03-18-487_200x200.png",
      mood: "dreamy",
      genre: "electronic",
      duration: ""
    },
    {
      id: 14,
      title: "Lost in Dreams (abstract chill downtempo cinematic future beats)",
      artist: "Kulakovka",
      url: "https://cdn.pixabay.com/audio/2024/11/29/audio_45bbd49c34.mp3",
      cover: "https://cdn.pixabay.com/audio/2024/11/29/13-19-36-180_200x200.jpg",
      mood: "dreamy",
      genre: "electronic",
      duration: ""
    },
    {
      id: 15,
      title: "Stylish Deep Electronic",
      artist: "NverAvetyanMusic",
      url: "https://cdn.pixabay.com/audio/2024/11/10/audio_593e8523e6.mp3",
      cover: "https://cdn.pixabay.com/audio/2024/11/10/13-58-10-983_200x200.jpg",
      mood: "focus",
      genre: "electronic",
      duration: ""
    },
    {
      id: 16,
      title: "Showreel Music (Promo Advertising Opener Vlog Background Intro Theme)",
      artist: "MFCC",
      url: "https://cdn.pixabay.com/audio/2024/11/08/audio_05b10daae7.mp3",
      cover: "https://cdn.pixabay.com/audio/2024/11/08/10-01-20-397_200x200.png",
      mood: "happy",
      genre: "pop",
      duration: ""
    },
    {
      id: 17,
      title: "Tell Me The Truth",
      artist: "Denys_Brodovskyi",
      url: "https://cdn.pixabay.com/audio/2024/11/05/audio_da986d1e2a.mp3",
      cover: "https://cdn.pixabay.com/audio/2024/11/05/15-20-35-725_200x200.png",
      mood: "romantic",
      genre: "rock",
      duration: ""
    },
    {
      id: 18,
      title: "Soulsweeper",
      artist: "ItsWatR",
      url: "https://cdn.pixabay.com/audio/2024/10/18/audio_883a8b2ed8.mp3",
      cover: "https://cdn.pixabay.com/audio/2024/10/18/19-17-44-643_200x200.png",
      mood: "dreamy",
      genre: "electronic",
      duration: ""
    },
    {
      id: 19,
      title: "Creative Technology Showreel",
      artist: "Pumpupthemind",
      url: "https://cdn.pixabay.com/audio/2024/09/16/audio_a10608d6cd.mp3",
      cover: "https://cdn.pixabay.com/audio/2024/09/17/10-46-15-772_200x200.png",
      mood: "focus",
      genre: "electronic",
      duration: ""
    },
    {
      id: 20,
      title: "Lazy Day - Stylish Futuristic Chill",
      artist: "penguinmusic",
      url: "https://cdn.pixabay.com/audio/2024/09/09/audio_7556bb3a41.mp3",
      cover: "https://cdn.pixabay.com/audio/2024/09/09/18-40-47-52_200x200.png",
      mood: "chill",
      genre: "electronic",
      duration: ""
    }
  ];
  


const moods = ['happy', 'chill', 'energetic', 'romantic', 'focus', 'dreamy'];
const genres = ['pop', 'rock', 'jazz', 'electronic', 'hip-hop', 'classical'];

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'SoundScape Generator API',
    version: '1.0.0',
    endpoints: {
      '/api/moods': 'GET - Get all available moods',
      '/api/genres': 'GET - Get all available genres',
      '/api/generate': 'POST - Generate music based on mood and genre'
    }
  });
});

app.get('/api/moods', (req, res) => {
  res.json({
    success: true,
    data: moods
  });
});

app.get('/api/genres', (req, res) => {
  res.json({
    success: true,
    data: genres
  });
});

app.post('/api/generate', (req, res) => {
  try {
    const { mood, genre } = req.body;

    if (!mood || !genre) {
      return res.status(400).json({
        success: false,
        error: 'Both mood and genre are required'
      });
    }

    // Filter tracks based on selected mood and genre
    let matchingTracks = musicDatabase.filter(track => 
      track.mood.toLowerCase() === mood.toLowerCase() && 
      track.genre.toLowerCase() === genre.toLowerCase()
    );

    // If no exact matches, get tracks with at least one matching criteria
    if (matchingTracks.length === 0) {
      matchingTracks = musicDatabase.filter(track => 
        track.mood.toLowerCase() === mood.toLowerCase() || 
        track.genre.toLowerCase() === genre.toLowerCase()
      );
    }

    // If still no matches, return all tracks
    if (matchingTracks.length === 0) {
      matchingTracks = musicDatabase;
    }

    // Shuffle and take up to 6 tracks
    const shuffled = matchingTracks
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);

    res.json({
      success: true,
      data: {
        tracks: shuffled,
        mood: mood,
        genre: genre,
        total: shuffled.length
      }
    });

  } catch (error) {
    console.error('Error generating music:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get single track by ID
app.get('/api/track/:id', (req, res) => {
  const { id } = req.params;
  const track = musicDatabase.find(t => t.id === parseInt(id));
  
  if (!track) {
    return res.status(404).json({
      success: false,
      error: 'Track not found'
    });
  }

  res.json({
    success: true,
    data: track
  });
});

app.get('/api/download/:id', (req, res) => {
  const { id } = req.params;
  const track = musicDatabase.find(t => t.id === parseInt(id));

  if (!track) {
    return res.status(404).json({
      success: false,
      error: 'Track not found'
    });
  }

  // Important: For actual downloads, you'd typically stream the file or redirect to the direct URL.
  // The current implementation just returns the URL, which the frontend then uses.
  // This is fine for direct links to public CDN audio files like Pixabay.
  res.json({
    success: true,
    data: {
      downloadUrl: track.url,
      filename: `${track.title.replace(/\s+/g, '_')}.mp3`, // Template literal fixed
      title: track.title,
      artist: track.artist
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});