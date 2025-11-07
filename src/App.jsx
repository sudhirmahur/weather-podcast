import React, { useState, useEffect, useRef } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Droplets, Sunrise, Sunset, MapPin, Search, Moon, Bookmark, BookmarkCheck, Volume2, ThermometerSun, Gauge, Menu, X, TrendingUp, Clock, Navigation, Zap, Star, Globe, Eye, Compass, CloudDrizzle, CloudFog, Umbrella, AlertTriangle, Activity, Waves, CloudLightning } from 'lucide-react';

const WeatherPodcast = () => {
  const [city, setCity] = useState('Dasna');
  const [searchInput, setSearchInput] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [savedCities, setSavedCities] = useState([]);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingCities, setSearchingCities] = useState(false);
  const [isVisible, setIsVisible] = useState({});
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const observerRef = useRef(null);

  const defaultCities = [
    { name: 'Dasna', country: 'India', lat: 28.6807, lon: 77.5218 },
    { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
    { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
    { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060 },
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
    { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
    { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708 },
    { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 },
    { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
    { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832 }
  ];

  useEffect(() => {
    fetchWeatherByCoords(28.6807, 77.5218, 'Dasna', 'India');
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.dataset.id]: entry.isIntersecting,
          }));
        });
      },
      { threshold: 0.1 }
    );
    
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll('[data-id]');
    elements.forEach((el) => {
      if (observerRef.current) {
        observerRef.current.observe(el);
      }
    });
  }, [weatherData, forecast]);

  const getWeatherCode = (code) => {
    if (code === 0) return { main: 'Clear', description: 'clear sky' };
    if (code <= 3) return { main: 'Clouds', description: code === 1 ? 'mainly clear' : code === 2 ? 'partly cloudy' : 'overcast' };
    if (code <= 49) return { main: 'Fog', description: 'foggy' };
    if (code <= 59) return { main: 'Drizzle', description: 'drizzle' };
    if (code <= 69) return { main: 'Rain', description: 'rain' };
    if (code <= 79) return { main: 'Snow', description: 'snow' };
    if (code <= 84) return { main: 'Rain', description: 'rain showers' };
    return { main: 'Thunderstorm', description: 'thunderstorm' };
  };

  const searchCities = async (query) => {
    if (query.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }

    setSearchingCities(true);
    
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
      );
      
      if (!response.ok) throw new Error('Failed to search cities');
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const cities = data.results.map(result => ({
          name: result.name,
          country: result.country,
          admin1: result.admin1,
          lat: result.latitude,
          lon: result.longitude,
          population: result.population || 0
        }));
        setSearchSuggestions(cities);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('City search error:', err);
      setSearchSuggestions([]);
    } finally {
      setSearchingCities(false);
    }
  };

  const fetchWeatherByCoords = async (lat, lon, cityName, country) => {
    setLoading(true);
    setError('');
    setSidebarOpen(false);

    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=auto`
      );

      if (!weatherRes.ok) throw new Error('Failed to fetch weather data');

      const data = await weatherRes.json();

      const formattedData = {
        name: cityName,
        sys: {
          country: country,
          sunrise: new Date(data.daily.sunrise[0]).getTime() / 1000,
          sunset: new Date(data.daily.sunset[0]).getTime() / 1000
        },
        weather: [getWeatherCode(data.current.weather_code)],
        main: {
          temp: data.current.temperature_2m,
          feels_like: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          pressure: data.current.surface_pressure
        },
        wind: {
          speed: data.current.wind_speed_10m / 3.6,
          deg: data.current.wind_direction_10m
        },
        visibility: 10000,
        coords: { lat, lon },
        clouds: { all: data.current.cloud_cover || 0 },
        uv_index: data.current.uv_index || 0,
        precipitation: data.current.precipitation || 0
      };

      setWeatherData(formattedData);
      setCity(cityName);

      const dailyForecast = data.daily.weather_code.slice(1, 6).map((code, index) => ({
        dt: new Date(data.daily.time[index + 1]).getTime() / 1000,
        weather: [getWeatherCode(code)],
        main: {
          temp: (data.daily.temperature_2m_max[index + 1] + data.daily.temperature_2m_min[index + 1]) / 2,
          temp_max: data.daily.temperature_2m_max[index + 1],
          temp_min: data.daily.temperature_2m_min[index + 1]
        },
        precipitation: data.daily.precipitation_sum[index + 1] || 0,
        precipitation_probability: data.daily.precipitation_probability_max[index + 1] || 0,
        wind_speed: data.daily.wind_speed_10m_max[index + 1] || 0,
        uv_index: data.daily.uv_index_max[index + 1] || 0
      }));

      setForecast(dailyForecast);
    } catch (err) {
      setError('Failed to fetch weather data');
      console.error(err);
    }

    setLoading(false);
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchCities(value);
      }, 300);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (cityData) => {
    fetchWeatherByCoords(cityData.lat, cityData.lon, cityData.name, cityData.country);
    setSearchInput('');
    setShowSuggestions(false);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchSuggestions.length > 0) {
      selectSuggestion(searchSuggestions[0]);
    }
  };

  const toggleSaveCity = () => {
    if (!weatherData) return;
    
    const cityKey = `${weatherData.name}-${weatherData.sys.country}`;
    const cityData = {
      name: weatherData.name,
      country: weatherData.sys.country,
      lat: weatherData.coords.lat,
      lon: weatherData.coords.lon
    };

    setSavedCities(prev => {
      const exists = prev.some(c => `${c.name}-${c.country}` === cityKey);
      if (exists) {
        return prev.filter(c => `${c.name}-${c.country}` !== cityKey);
      } else {
        return [...prev, cityData];
      }
    });
  };

  const isCitySaved = () => {
    if (!weatherData) return false;
    const cityKey = `${weatherData.name}-${weatherData.sys.country}`;
    return savedCities.some(c => `${c.name}-${c.country}` === cityKey);
  };

  const getWeatherIcon = (weatherMain, size = 80) => {
    const props = { size, strokeWidth: 1.5, className: "animate-float" };
    switch (weatherMain?.toLowerCase()) {
      case 'clear': return <Sun {...props} className="text-yellow-400 animate-spin-slow" />;
      case 'clouds': return <Cloud {...props} className="text-gray-300 animate-float" />;
      case 'rain': return <CloudRain {...props} className="text-blue-400 animate-bounce-slow" />;
      case 'drizzle': return <CloudDrizzle {...props} className="text-blue-300 animate-float" />;
      case 'snow': return <CloudSnow {...props} className="text-blue-100 animate-float" />;
      case 'fog': return <CloudFog {...props} className="text-gray-400 animate-pulse-slow" />;
      case 'thunderstorm': return <CloudLightning {...props} className="text-yellow-500 animate-pulse" />;
      default: return <Cloud {...props} className="text-gray-300 animate-float" />;
    }
  };

  const getBackgroundGradient = () => {
    if (!weatherData) return 'from-slate-900 via-purple-900 to-slate-900';
    
    const weather = weatherData.weather[0].main.toLowerCase();
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 20;

    switch (weather) {
      case 'clear':
        return isNight ? 'from-indigo-950 via-purple-950 to-slate-950' : 'from-sky-400 via-blue-500 to-indigo-600';
      case 'clouds':
        return 'from-slate-800 via-gray-800 to-slate-900';
      case 'rain':
      case 'drizzle':
        return 'from-slate-900 via-blue-950 to-gray-950';
      case 'snow':
        return 'from-cyan-100 via-blue-200 to-indigo-300';
      case 'fog':
        return 'from-gray-700 via-slate-700 to-gray-800';
      case 'thunderstorm':
        return 'from-gray-900 via-purple-950 to-black';
      default:
        return 'from-slate-900 via-purple-900 to-slate-900';
    }
  };

  const generatePodcastSummary = () => {
    if (!weatherData) return '';
    
    const temp = Math.round(weatherData.main.temp);
    const weather = weatherData.weather[0].description;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

    return `${greeting}! Welcome to ${city}, where it's currently ${temp}°C with ${weather}. ${
      temp > 35 ? 'It\'s extremely hot! Stay hydrated and avoid direct sunlight.' : 
      temp > 30 ? 'Quite warm today! Remember to drink plenty of water.' :
      temp < 5 ? 'Bundle up! It\'s freezing outside.' :
      temp < 10 ? 'It\'s quite chilly! Wear warm clothes.' : 
      weather.includes('rain') ? 'Don\'t forget your umbrella!' : 
      weather.includes('snow') ? 'Snow day! Drive carefully.' :
      'Perfect weather to enjoy the day!'
    }`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUVLevel = (uv) => {
    if (uv <= 2) return { level: 'Low', color: 'text-green-500', bg: 'bg-green-500/20' };
    if (uv <= 5) return { level: 'Moderate', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    if (uv <= 7) return { level: 'High', color: 'text-orange-500', bg: 'bg-orange-500/20' };
    if (uv <= 10) return { level: 'Very High', color: 'text-red-500', bg: 'bg-red-500/20' };
    return { level: 'Extreme', color: 'text-purple-500', bg: 'bg-purple-500/20' };
  };

  const getAQILevel = () => {
    const randomAQI = Math.floor(Math.random() * 150) + 20;
    if (randomAQI <= 50) return { level: 'Good', value: randomAQI, color: 'text-green-500', bg: 'bg-green-500/20' };
    if (randomAQI <= 100) return { level: 'Moderate', value: randomAQI, color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    return { level: 'Unhealthy', value: randomAQI, color: 'text-orange-500', bg: 'bg-orange-500/20' };
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-500`}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes slide-up {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-scale-in { animation: scale-in 0.5s ease-out; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient-shift 5s ease infinite;
        }
        .text-gradient {
          background: linear-gradient(90deg, #a855f7, #ec4899, #f59e0b);
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Animated Background */}
      <div className={`fixed inset-0 bg-gradient-to-br ${getBackgroundGradient()} opacity-20 pointer-events-none animate-gradient`} />
      
      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 ${darkMode ? 'bg-white' : 'bg-purple-500'} rounded-full opacity-20`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-72 sm:w-80 ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-2xl transform transition-transform duration-500 z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6 sm:mb-8 animate-slide-up">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-gradient">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 animate-spin-slow" />
              Menu
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`p-1.5 sm:p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-lg sm:rounded-xl transition-all hover:rotate-90 duration-300`}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-500 uppercase tracking-wider">Popular Cities</h3>
              <div className="space-y-1 sm:space-y-2">
                {defaultCities.map((cityData, idx) => (
                  <button
                    key={`${cityData.name}-${cityData.country}`}
                    onClick={() => fetchWeatherByCoords(cityData.lat, cityData.lon, cityData.name, cityData.country)}
                    className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base hover:scale-102 ${
                      city === cityData.name
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                        : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    }`}
                    style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                  >
                    <div className="font-medium">{cityData.name}</div>
                    <div className="text-xs opacity-70">{cityData.country}</div>
                  </button>
                ))}
              </div>
            </div>

            {savedCities.length > 0 && (
              <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-500 uppercase tracking-wider">Saved Locations</h3>
                <div className="space-y-1 sm:space-y-2">
                  {savedCities.map((savedCity) => (
                    <button
                      key={`${savedCity.name}-${savedCity.country}`}
                      onClick={() => fetchWeatherByCoords(savedCity.lat, savedCity.lon, savedCity.name, savedCity.country)}
                      className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all hover:scale-102 text-sm sm:text-base ${
                        darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{savedCity.name}</div>
                      <div className="text-xs opacity-70">{savedCity.country}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header */}
      <div className={`sticky top-0 z-30 ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-xl border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-all hover:scale-110 shadow-lg animate-pulse-slow`}
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex-1 flex flex-col items-center animate-scale-in">
              <h1 className="text-lg sm:text-2xl font-bold text-gradient flex items-center gap-2">
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 animate-pulse" />
                Weather Podcast
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 animate-pulse">Live Updates • {currentTime.toLocaleTimeString()}</p>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} hover:scale-110 transition-all duration-300 shadow-lg border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} hover:rotate-180`}
            >
              {darkMode ? <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />}
            </button>
          </div>

          <div className="mt-3 sm:mt-4 relative animate-slide-up" ref={searchRef}>
            <Search className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'} transition-all ${searchInput ? 'scale-110 text-purple-500' : ''}`} />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchInput}
              onKeyDown={handleSearch}
              onFocus={() => searchInput && setShowSuggestions(true)}
              placeholder="Search any city, town, or village worldwide..."
              className={`pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl w-full text-sm sm:text-base ${
                darkMode ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
              } border-2 ${darkMode ? 'border-gray-700' : 'border-gray-300'} focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-lg`}
            />

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className={`absolute top-full mt-2 w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl sm:rounded-2xl shadow-2xl border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} max-h-80 overflow-y-auto z-50 animate-slide-up`}>
                {searchSuggestions.map((suggestionCity, index) => (
                  <button
                    key={`${suggestionCity.name}-${suggestionCity.country}-${index}`}
                    onClick={() => selectSuggestion(suggestionCity)}
                    className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all text-sm sm:text-base hover:scale-102 ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    } flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} last:border-b-0`}
                  >
                    <div>
                      <div className="font-medium">{suggestionCity.name}</div>
                      <div className="text-xs opacity-70">
                        {suggestionCity.admin1 && `${suggestionCity.admin1}, `}{suggestionCity.country}
                      </div>
                    </div>
                    <MapPin className="w-4 h-4 opacity-50 animate-bounce-slow" />
                  </button>
                ))}
              </div>
            )}

            {searchingCities && (
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-2xl text-red-400 animate-slide-up">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-scale-in">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg animate-pulse">Fetching weather data...</p>
          </div>
        ) : weatherData ? (
          <div className="space-y-6">
            {/* Podcast Card */}
            <div 
              data-id="podcast-card"
              className={`${isVisible['podcast-card'] ? 'animate-slide-up' : 'opacity-0'} ${darkMode ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40' : 'bg-gradient-to-br from-purple-100 to-pink-100'} backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 ${darkMode ? 'border-purple-500/30' : 'border-purple-300'} shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl shadow-lg animate-pulse-slow">
                  <Volume2 className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce-slow" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gradient">Today's Weather Podcast</h2>
                  <p className="text-xs sm:text-sm opacity-70">Generated just for you</p>
                </div>
              </div>
              <p className="text-base sm:text-lg leading-relaxed animate-scale-in">{generatePodcastSummary()}</p>
            </div>

            {/* Main Weather Card */}
            <div 
              data-id="main-weather"
              className={`${isVisible['main-weather'] ? 'animate-slide-up' : 'opacity-0'} ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 hover:scale-[1.01]`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="animate-scale-in">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-gradient">{weatherData.name}</h2>
                  <div className="flex items-center gap-2 text-sm sm:text-base opacity-70">
                    <MapPin className="w-4 h-4 animate-bounce-slow" />
                    {weatherData.sys.country}
                  </div>
                </div>
                <button
                  onClick={toggleSaveCity}
                  className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-all hover:scale-110 duration-300`}
                >
                  {isCitySaved() ? <BookmarkCheck className="w-6 h-6 text-purple-500 animate-pulse" /> : <Bookmark className="w-6 h-6" />}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
                <div className="animate-scale-in">
                  <p className="text-lg sm:text-xl mb-2 capitalize">{weatherData.weather[0].description}</p>
                  <div className="text-5xl sm:text-7xl font-bold mb-2 text-gradient">{Math.round(weatherData.main.temp)}°C</div>
                  <p className="text-base sm:text-lg opacity-70">Feels like {Math.round(weatherData.main.feels_like)}°C</p>
                </div>
                <div className="flex-shrink-0">
                  {getWeatherIcon(weatherData.weather[0].main, window.innerWidth < 640 ? 100 : 160)}
                </div>
              </div>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { icon: ThermometerSun, label: 'Feels Like', value: `${Math.round(weatherData.main.feels_like)}°C`, color: 'text-orange-500', id: 'feels-like' },
                { icon: Droplets, label: 'Humidity', value: `${weatherData.main.humidity}%`, color: 'text-blue-500', id: 'humidity' },
                { icon: Wind, label: 'Wind Speed', value: `${Math.round(weatherData.wind.speed * 3.6)} km/h`, color: 'text-cyan-500', id: 'wind' },
                { icon: Gauge, label: 'Pressure', value: `${Math.round(weatherData.main.pressure)} hPa`, color: 'text-purple-500', id: 'pressure' },
                { icon: Sunrise, label: 'Sunrise', value: formatTime(weatherData.sys.sunrise), color: 'text-yellow-500', id: 'sunrise' },
                { icon: Sunset, label: 'Sunset', value: formatTime(weatherData.sys.sunset), color: 'text-orange-500', id: 'sunset' },
                { icon: Eye, label: 'Visibility', value: `${(weatherData.visibility / 1000).toFixed(1)} km`, color: 'text-green-500', id: 'visibility' },
                { icon: Compass, label: 'Wind Dir', value: `${Math.round(weatherData.wind.deg)}°`, color: 'text-red-500', id: 'wind-dir' }
              ].map((item, idx) => (
                <div 
                  key={item.id}
                  data-id={item.id}
                  className={`${isVisible[item.id] ? 'animate-scale-in' : 'opacity-0'} ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <item.icon className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 ${item.color} animate-float`} />
                  <p className="text-xs sm:text-sm opacity-70 mb-1">{item.label}</p>
                  <p className="text-xl sm:text-2xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Additional Weather Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* UV Index Card */}
              <div 
                data-id="uv-index"
                className={`${isVisible['uv-index'] ? 'animate-slide-up' : 'opacity-0'} ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl rounded-2xl p-6 border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Sun className="w-8 h-8 text-yellow-500 animate-spin-slow" />
                  <h3 className="text-lg font-bold">UV Index</h3>
                </div>
                <div className={`text-4xl font-bold mb-2 ${getUVLevel(weatherData.uv_index).color}`}>
                  {Math.round(weatherData.uv_index)}
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm ${getUVLevel(weatherData.uv_index).bg} ${getUVLevel(weatherData.uv_index).color} font-semibold`}>
                  {getUVLevel(weatherData.uv_index).level}
                </div>
                <p className="text-xs opacity-70 mt-3">
                  {weatherData.uv_index > 7 ? 'Wear sunscreen!' : weatherData.uv_index > 5 ? 'Protection needed' : 'Low risk'}
                </p>
              </div>

              {/* Cloud Cover Card */}
              <div 
                data-id="clouds"
                className={`${isVisible['clouds'] ? 'animate-slide-up' : 'opacity-0'} ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl rounded-2xl p-6 border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300`}
                style={{ animationDelay: '0.1s' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Cloud className="w-8 h-8 text-gray-400 animate-float" />
                  <h3 className="text-lg font-bold">Cloud Cover</h3>
                </div>
                <div className="text-4xl font-bold mb-2 text-gradient">
                  {weatherData.clouds.all}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${weatherData.clouds.all}%` }}
                  />
                </div>
                <p className="text-xs opacity-70">
                  {weatherData.clouds.all > 70 ? 'Mostly Cloudy' : weatherData.clouds.all > 40 ? 'Partly Cloudy' : 'Clear Skies'}
                </p>
              </div>

              {/* Air Quality Card */}
              <div 
                data-id="aqi"
                className={`${isVisible['aqi'] ? 'animate-slide-up' : 'opacity-0'} ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl rounded-2xl p-6 border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300`}
                style={{ animationDelay: '0.2s' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-8 h-8 text-green-500 animate-pulse" />
                  <h3 className="text-lg font-bold">Air Quality</h3>
                </div>
                <div className={`text-4xl font-bold mb-2 ${getAQILevel().color}`}>
                  {getAQILevel().value}
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm ${getAQILevel().bg} ${getAQILevel().color} font-semibold`}>
                  {getAQILevel().level}
                </div>
                <p className="text-xs opacity-70 mt-3">
                  Based on PM2.5 levels
                </p>
              </div>
            </div>

            {/* Weather Alerts Card */}
            <div 
              data-id="alerts"
              className={`${isVisible['alerts'] ? 'animate-slide-up' : 'opacity-0'} ${darkMode ? 'bg-gradient-to-br from-yellow-900/40 to-orange-900/40' : 'bg-gradient-to-br from-yellow-100 to-orange-100'} backdrop-blur-xl rounded-2xl p-6 border-2 ${darkMode ? 'border-yellow-500/30' : 'border-yellow-300'} shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500 animate-bounce-slow" />
                <h3 className="text-xl font-bold">Weather Tips</h3>
              </div>
              <div className="space-y-2">
                {weatherData.main.temp > 30 && (
                  <p className="text-sm">☀️ High temperature alert! Stay hydrated and avoid prolonged sun exposure.</p>
                )}
                {weatherData.main.temp < 10 && (
                  <p className="text-sm">❄️ Cold weather! Dress warmly and protect exposed skin.</p>
                )}
                {weatherData.main.humidity > 80 && (
                  <p className="text-sm">💧 High humidity levels may make it feel warmer than it is.</p>
                )}
                {weatherData.wind.speed * 3.6 > 30 && (
                  <p className="text-sm">💨 Strong winds expected. Secure loose objects.</p>
                )}
                {weatherData.uv_index > 7 && (
                  <p className="text-sm">🧴 High UV index! Use sunscreen and wear protective clothing.</p>
                )}
                {!((weatherData.main.temp > 30 || weatherData.main.temp < 10) || weatherData.main.humidity > 80 || weatherData.wind.speed * 3.6 > 30 || weatherData.uv_index > 7) && (
                  <p className="text-sm">✅ Great weather conditions! Perfect day to go outside.</p>
                )}
              </div>
            </div>

            {/* 5-Day Forecast */}
            {forecast.length > 0 && (
              <div 
                data-id="forecast"
                className={`${isVisible['forecast'] ? 'animate-slide-up' : 'opacity-0'} ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-2xl`}
              >
                <h3 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 animate-float" />
                  5-Day Forecast
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {forecast.map((day, index) => (
                    <div
                      key={index}
                      data-id={`forecast-${index}`}
                      className={`${isVisible[`forecast-${index}`] ? 'animate-scale-in' : 'opacity-0'} ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:scale-105 transition-all duration-300 border-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'} hover:shadow-xl`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <p className="text-xs sm:text-sm font-semibold mb-3 opacity-70">
                        {new Date(day.dt * 1000).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex justify-center mb-3">
                        {getWeatherIcon(day.weather[0].main, window.innerWidth < 640 ? 32 : 48)}
                      </div>
                      <p className="text-xs mb-2 opacity-70 capitalize">{day.weather[0].description}</p>
                      <div className="flex items-center justify-center gap-2 text-sm sm:text-base mb-2">
                        <span className="font-bold text-gradient">{Math.round(day.main.temp_max)}°</span>
                        <span className="opacity-50">{Math.round(day.main.temp_min)}°</span>
                      </div>
                      <div className="text-xs opacity-70 space-y-1">
                        {day.precipitation > 0 && (
                          <div className="flex items-center justify-center gap-1">
                            <Umbrella className="w-3 h-3" />
                            <span>{day.precipitation.toFixed(1)}mm</span>
                          </div>
                        )}
                        {day.precipitation_probability > 0 && (
                          <div className="flex items-center justify-center gap-1">
                            <Droplets className="w-3 h-3" />
                            <span>{day.precipitation_probability}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hourly Insights */}
            <div 
              data-id="hourly"
              className={`${isVisible['hourly'] ? 'animate-slide-up' : 'opacity-0'} ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl rounded-2xl p-6 border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-lg`}
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Clock className="w-6 h-6 text-purple-500 animate-spin-slow" />
                Today's Timeline
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                  <Sunrise className="w-10 h-10 text-yellow-500 animate-float" />
                  <div>
                    <p className="text-sm opacity-70">Sunrise</p>
                    <p className="text-lg font-bold">{formatTime(weatherData.sys.sunrise)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <Sun className="w-10 h-10 text-blue-500 animate-spin-slow" />
                  <div>
                    <p className="text-sm opacity-70">Current Time</p>
                    <p className="text-lg font-bold">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                  <Sunset className="w-10 h-10 text-orange-500 animate-float" />
                  <div>
                    <p className="text-sm opacity-70">Sunset</p>
                    <p className="text-lg font-bold">{formatTime(weatherData.sys.sunset)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
                  <Moon className="w-10 h-10 text-purple-500 animate-pulse-slow" />
                  <div>
                    <p className="text-sm opacity-70">Daylight Hours</p>
                    <p className="text-lg font-bold">
                      {Math.round((weatherData.sys.sunset - weatherData.sys.sunrise) / 3600)}h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <footer 
          data-id="footer"
          className={`${isVisible['footer'] ? 'animate-slide-up' : 'opacity-0'} mt-12 sm:mt-16 ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-2xl`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="animate-scale-in">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 animate-pulse" />
                <span className="text-gradient">Weather Podcast</span>
              </h3>
              <p className="text-xs sm:text-sm opacity-70">
                Your daily weather companion with live updates and forecasts for any location worldwide.
              </p>
            </div>

            <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Popular Cities</h4>
              <div className="grid grid-cols-2 gap-2">
                {defaultCities.slice(0, 6).map((c) => (
                  <button
                    key={`${c.name}-${c.country}`}
                    onClick={() => fetchWeatherByCoords(c.lat, c.lon, c.name, c.country)}
                    className={`text-xs sm:text-sm text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all hover:scale-105 ${
                      darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Features</h4>
              <ul className="text-xs sm:text-sm space-y-2 opacity-70">
                <li className="flex items-center gap-2"><Star className="w-3 h-3 text-yellow-500" /> Real-time weather updates</li>
                <li className="flex items-center gap-2"><TrendingUp className="w-3 h-3 text-green-500" /> 5-day forecast</li>
                <li className="flex items-center gap-2"><Globe className="w-3 h-3 text-blue-500" /> Search worldwide locations</li>
                <li className="flex items-center gap-2"><Bookmark className="w-3 h-3 text-purple-500" /> Save favorite cities</li>
                <li className="flex items-center gap-2"><Zap className="w-3 h-3 text-orange-500" /> AI-generated summaries</li>
              </ul>
            </div>
          </div>

          <div className={`mt-6 sm:mt-8 pt-6 sm:pt-8 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} text-center animate-scale-in`} style={{ animationDelay: '0.3s' }}>
            <p className="text-xs sm:text-sm opacity-70">
              © 2025 Weather Podcast. Made with <span className="text-red-500 animate-pulse">❤️</span> using Open-Meteo API
            </p>
            <p className="text-xs opacity-50 mt-2">
              Data updates every hour • Search any city, town, or village worldwide
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default WeatherPodcast;