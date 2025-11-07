import React, { useState, useEffect, useRef } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Droplets, Sunrise, Sunset, MapPin, Search, Moon, Bookmark, BookmarkCheck, Volume2, ThermometerSun, Gauge, Menu, X, TrendingUp, Clock, Navigation, Zap, Star, Globe, Eye, Compass, CloudDrizzle, CloudFog } from 'lucide-react';

const WeatherPodcast = () => {
  const [city, setCity] = useState('Delhi');
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
  const searchRef = useRef(null);

  const cityCoordinates = {
    'Delhi': { lat: 28.6139, lon: 77.2090, country: 'IN', popular: true },
    'Mumbai': { lat: 19.0760, lon: 72.8777, country: 'IN', popular: true },
    'Bangalore': { lat: 12.9716, lon: 77.5946, country: 'IN', popular: true },
    'Kolkata': { lat: 22.5726, lon: 88.3639, country: 'IN', popular: true },
    'Chennai': { lat: 13.0827, lon: 80.2707, country: 'IN', popular: true },
    'Hyderabad': { lat: 17.3850, lon: 78.4867, country: 'IN', popular: true },
    'Pune': { lat: 18.5204, lon: 73.8567, country: 'IN', popular: true },
    'Ahmedabad': { lat: 23.0225, lon: 72.5714, country: 'IN', popular: true },
    'Jaipur': { lat: 26.9124, lon: 75.7873, country: 'IN', popular: true },
    'Surat': { lat: 21.1702, lon: 72.8311, country: 'IN', popular: true },
    'London': { lat: 51.5074, lon: -0.1278, country: 'GB', popular: true },
    'New York': { lat: 40.7128, lon: -74.0060, country: 'US', popular: true },
    'Paris': { lat: 48.8566, lon: 2.3522, country: 'FR', popular: true },
    'Tokyo': { lat: 35.6762, lon: 139.6503, country: 'JP', popular: true },
    'Sydney': { lat: -33.8688, lon: 151.2093, country: 'AU', popular: true },
    'Dubai': { lat: 25.2048, lon: 55.2708, country: 'AE', popular: true },
    'Singapore': { lat: 1.3521, lon: 103.8198, country: 'SG', popular: true },
    'Los Angeles': { lat: 34.0522, lon: -118.2437, country: 'US', popular: true },
    'Berlin': { lat: 52.5200, lon: 13.4050, country: 'DE', popular: true },
    'Toronto': { lat: 43.6532, lon: -79.3832, country: 'CA', popular: true }
  };

  useEffect(() => {
    fetchWeather('Delhi');
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const fetchWeather = async (cityName) => {
    setLoading(true);
    setError('');
    setSidebarOpen(false);
    const coords = cityCoordinates[cityName];
    if (!coords) {
      setError('City not found in database');
      setLoading(false);
      return;
    }

    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`
      );
      if (!weatherRes.ok) throw new Error('Failed to fetch weather data');
      const data = await weatherRes.json();
      const formattedData = {
        name: cityName,
        sys: { 
          country: coords.country,
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
        visibility: 10000
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
        }
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
    if (value.trim().length > 0) {
      const filtered = Object.keys(cityCoordinates).filter(c =>
        c.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setSearchSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (cityName) => {
    fetchWeather(cityName);
    setSearchInput('');
    setShowSuggestions(false);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      const cityKey = Object.keys(cityCoordinates).find(
        key => key.toLowerCase() === searchInput.trim().toLowerCase()
      );
      if (cityKey) {
        fetchWeather(cityKey);
        setSearchInput('');
        setShowSuggestions(false);
      } else {
        setError('City not found');
      }
    }
  };

  const toggleSaveCity = () => {
    setSavedCities(prev => 
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const getWeatherIcon = (weatherMain, size = 80) => {
    const props = { size, strokeWidth: 1.5 };
    switch (weatherMain?.toLowerCase()) {
      case 'clear': return <Sun {...props} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />;
      case 'clouds': return <Cloud {...props} className="text-gray-300" />;
      case 'rain': return <CloudRain {...props} className="text-blue-400" />;
      case 'drizzle': return <CloudDrizzle {...props} className="text-blue-300" />;
      case 'snow': return <CloudSnow {...props} className="text-blue-100" />;
      case 'fog': return <CloudFog {...props} className="text-gray-400" />;
      default: return <Sun {...props} className="text-yellow-400" />;
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
      case 'clouds': return 'from-slate-800 via-gray-800 to-slate-900';
      case 'rain': case 'drizzle': return 'from-slate-900 via-blue-950 to-gray-950';
      case 'snow': return 'from-cyan-100 via-blue-200 to-indigo-300';
      case 'fog': return 'from-gray-700 via-slate-700 to-gray-800';
      default: return 'from-slate-900 via-purple-900 to-slate-900';
    }
  };

  const generatePodcastSummary = () => {
    if (!weatherData) return '';
    const temp = Math.round(weatherData.main.temp);
    const weather = weatherData.weather[0].description;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    return `${greeting}! In ${city}, it's ${temp}°C with ${weather}. ${
      temp > 30 ? 'Stay hydrated!' : 
      temp < 10 ? 'Bundle up!' : 
      weather.includes('rain') ? 'Don\'t forget your umbrella!' :
      'Have a great day!'
    }`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const popularCities = Object.keys(cityCoordinates).filter(c => cityCoordinates[c].popular);

  return (
    <div className={`min-h-screen transition-all duration-700 ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Animated Background */}
      <div className={`fixed inset-0 bg-gradient-to-br ${getBackgroundGradient()} opacity-30 transition-all duration-1000`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(147,51,234,0.2),transparent_50%)]"></div>
      </div>

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-72 sm:w-80 ${darkMode ? 'bg-gray-900/98' : 'bg-white/98'} backdrop-blur-2xl shadow-2xl z-50 transform transition-transform duration-500 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} border-r ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="p-4 sm:p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl">
                <Menu size={18} className="text-white sm:hidden" />
                <Menu size={20} className="text-white hidden sm:block" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Menu</h2>
            </div>
            <button onClick={() => setSidebarOpen(false)} className={`p-1.5 sm:p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-lg sm:rounded-xl transition-all`}>
              <X size={20} className="sm:hidden" />
              <X size={24} className="hidden sm:block" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 custom-scrollbar">
            <div>
              <h3 className="text-xs sm:text-sm font-bold opacity-50 mb-3 sm:mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Star size={14} className="text-yellow-400 sm:hidden" />
                <Star size={16} className="text-yellow-400 hidden sm:block" />
                Popular Cities
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                {popularCities.map((cityName) => (
                  <button
                    key={cityName}
                    onClick={() => fetchWeather(cityName)}
                    className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base ${
                      city === cityName 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 scale-[1.02]' 
                        : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{cityName}</span>
                      <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${city === cityName ? 'bg-white/20' : darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        {cityCoordinates[cityName].country}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {savedCities.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-bold opacity-50 mb-3 sm:mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <BookmarkCheck size={14} className="text-green-400 sm:hidden" />
                  <BookmarkCheck size={16} className="text-green-400 hidden sm:block" />
                  Saved Locations
                </h3>
                <div className="space-y-1.5 sm:space-y-2">
                  {savedCities.map((savedCity) => (
                    <button
                      key={savedCity}
                      onClick={() => fetchWeather(savedCity)}
                      className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all text-sm sm:text-base ${
                        darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Bookmark size={14} className="text-green-400 sm:hidden" />
                        <Bookmark size={16} className="text-green-400 hidden sm:block" />
                        <span className="font-medium">{savedCity}</span>
                      </div>
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
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className={`backdrop-blur-2xl ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'} border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} shadow-xl sticky top-0 z-30`}>
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-all hover:scale-110 shadow-lg`}
                  >
                    <Menu size={18} className="sm:hidden" />
                    <Menu size={24} className="hidden sm:block" />
                  </button>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative">
                      <Volume2 className="text-purple-500 animate-pulse" size={28} />
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-ping"></div>
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        Weather Podcast
                      </h1>
                      <p className="text-[10px] sm:text-xs opacity-60 font-medium hidden sm:block">Live Updates • {currentTime.toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} hover:scale-110 transition-all shadow-lg border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  {darkMode ? <Sun className="text-yellow-400" size={20} /> : <Moon className="text-indigo-700" size={20} />}
                </button>
              </div>

              <div className="relative w-full" ref={searchRef}>
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchInput}
                  onKeyPress={handleSearch}
                  onFocus={() => searchInput && setShowSuggestions(true)}
                  placeholder="Search cities..."
                  className={`pl-4 pr-10 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl w-full text-sm sm:text-base ${
                    darkMode ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
                  } border-2 ${darkMode ? 'border-gray-700' : 'border-gray-300'} focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-lg`}
                />
                <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-purple-500" size={18} />
                
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className={`absolute top-full mt-2 w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl sm:rounded-2xl shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden z-50 max-h-60 overflow-y-auto`}>
                    {searchSuggestions.map((suggestionCity) => (
                      <button
                        key={suggestionCity}
                        onClick={() => selectSuggestion(suggestionCity)}
                        className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all text-sm sm:text-base ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        } flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} last:border-b-0`}
                      >
                        <span className="font-medium">{suggestionCity}</span>
                        <span className="text-xs opacity-60">{cityCoordinates[suggestionCity].country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
          {error && (
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 text-center shadow-2xl text-sm sm:text-base">
              <p className="font-bold">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 sm:h-96 gap-4 sm:gap-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 border-t-4 border-b-4 border-purple-500"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Zap className="text-purple-500 animate-pulse" size={28} />
                </div>
              </div>
              <p className="text-base sm:text-xl font-bold animate-pulse bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Fetching weather data...
              </p>
            </div>
          ) : weatherData ? (
            <div className="space-y-4 sm:space-y-8">
              {/* Podcast Card */}
              <div className={`backdrop-blur-2xl ${darkMode ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40' : 'bg-gradient-to-br from-purple-100/80 to-pink-100/80'} rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border ${darkMode ? 'border-purple-800/50' : 'border-purple-200'}`}>
                <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl shadow-lg">
                    <Volume2 className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold">Today's Weather Podcast</h3>
                    <p className="text-xs sm:text-sm opacity-70">Generated just for you</p>
                  </div>
                </div>
                <p className="text-sm sm:text-lg leading-relaxed">{generatePodcastSummary()}</p>
              </div>

              {/* Main Weather Card */}
              <div className={`backdrop-blur-2xl ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'} rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 sm:gap-8">
                  <div className="flex-1 text-center lg:text-left w-full">
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <MapPin className="text-purple-500" size={24} />
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black">{weatherData.name}</h2>
                      <span className="px-2.5 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs sm:text-sm font-bold shadow-lg">
                        {weatherData.sys.country}
                      </span>
                      <button
                        onClick={toggleSaveCity}
                        className={`p-2 sm:p-3 rounded-full transition-all hover:scale-110 ${
                          savedCities.includes(city) 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/50' 
                            : darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {savedCities.includes(city) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      </button>
                    </div>
                    <p className="text-base sm:text-xl opacity-70 mb-3 sm:mb-6 capitalize">{weatherData.weather[0].description}</p>
                    <div className="text-5xl sm:text-6xl lg:text-8xl font-black mb-2 sm:mb-4 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                      {Math.round(weatherData.main.temp)}°C
                    </div>
                    <p className="text-base sm:text-xl opacity-70">Feels like {Math.round(weatherData.main.feels_like)}°C</p>
                  </div>

                  <div className="flex flex-col items-center gap-4 sm:gap-6">
                    <div className="relative">
                      {getWeatherIcon(weatherData.weather[0].main, window.innerWidth < 640 ? 100 : 160)}
                      <div className="absolute inset-0 blur-3xl opacity-50 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                    </div>
                  </div>
                </div>

                {/* Weather Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-8">
                  <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <ThermometerSun className="text-orange-500" size={18} />
                      <span className="text-xs sm:text-sm opacity-70 font-semibold">Feels Like</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold">{Math.round(weatherData.main.feels_like)}°C</p>
                  </div>

                  <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <Droplets className="text-blue-500" size={18} />
                      <span className="text-xs sm:text-sm opacity-70 font-semibold">Humidity</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold">{weatherData.main.humidity}%</p>
                  </div>

                  <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <Wind className="text-cyan-500" size={18} />
                      <span className="text-xs sm:text-sm opacity-70 font-semibold">Wind Speed</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold">{Math.round(weatherData.wind.speed * 3.6)} km/h</p>
                  </div>

                  <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <Gauge className="text-purple-500" size={18} />
                      <span className="text-xs sm:text-sm opacity-70 font-semibold">Pressure</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold">{Math.round(weatherData.main.pressure)} hPa</p>
                  </div>

                  <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <Sunrise className="text-amber-500" size={18} />
                      <span className="text-xs sm:text-sm opacity-70 font-semibold">Sunrise</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold">{formatTime(weatherData.sys.sunrise)}</p>
                  </div>

                  <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <Sunset className="text-orange-500" size={18} />
                      <span className="text-xs sm:text-sm opacity-70 font-semibold">Sunset</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold">{formatTime(weatherData.sys.sunset)}</p>
                  </div>

                  <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <Eye className="text-indigo-500" size={18} />
                      <span className="text-xs sm:text-sm opacity-70 font-semibold">Visibility</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold">{(weatherData.visibility / 1000).toFixed(1)} km</p>
                  </div>

                  <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <Compass className="text-green-500" size={18} />
                      <span className="text-xs sm:text-sm opacity-70 font-semibold">Wind Dir</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold">{Math.round(weatherData.wind.deg)}°</p>
                  </div>
                </div>
              </div>

              {/* 5-Day Forecast */}
              {forecast.length > 0 && (
                <div className={`backdrop-blur-2xl ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'} rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <TrendingUp className="text-purple-500" size={24} />
                    <h3 className="text-xl sm:text-3xl font-bold">5-Day Forecast</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
                    {forecast.map((day, index) => (
                      <div
                        key={index}
                        className={`${darkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-100/50 hover:bg-gray-100'} backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-all hover:scale-105 hover:shadow-xl cursor-pointer`}
                      >
                        <p className="text-xs sm:text-sm opacity-70 font-semibold mb-2 sm:mb-3">
                          {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="flex justify-center mb-2 sm:mb-4">
                          {getWeatherIcon(day.weather[0].main, window.innerWidth < 640 ? 32 : 48)}
                        </div>
                        <p className="text-xs sm:text-sm opacity-70 capitalize mb-2 sm:mb-3 text-center">{day.weather[0].description}</p>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="font-bold text-orange-500">{Math.round(day.main.temp_max)}°</span>
                          <span className="font-bold text-blue-500">{Math.round(day.main.temp_min)}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </main>

        {/* Footer */}
        <footer className={`backdrop-blur-2xl ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'} border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} mt-8 sm:mt-12`}>
          <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl">
                    <Volume2 className="text-white" size={18} />
                  </div>
                  <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Weather Podcast
                  </h3>
                </div>
                <p className="text-xs sm:text-sm opacity-70 leading-relaxed">
                  Your daily weather companion with live updates and forecasts for cities around the world.
                </p>
              </div>

              <div>
                <h4 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Star className="text-yellow-400" size={16} />
                  Top Cities
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {popularCities.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      onClick={() => fetchWeather(c)}
                      className={`text-xs sm:text-sm text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all ${
                        darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Globe className="text-blue-400" size={16} />
                  Features
                </h4>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm opacity-70">
                  <li className="flex items-center gap-2">
                    <Zap size={14} className="text-purple-500" />
                    Real-time weather updates
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-green-500" />
                    5-day forecast
                  </li>
                  <li className="flex items-center gap-2">
                    <Bookmark size={14} className="text-yellow-500" />
                    Save favorite cities
                  </li>
                  <li className="flex items-center gap-2">
                    <Volume2 size={14} className="text-pink-500" />
                    AI-generated summaries
                  </li>
                </ul>
              </div>
            </div>

            <div className={`mt-6 sm:mt-8 pt-6 sm:pt-8 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} text-center`}>
              <p className="text-xs sm:text-sm opacity-60">
                © 2024 Weather Podcast. Made with ❤️ using Open-Meteo API
              </p>
              <p className="text-[10px] sm:text-xs opacity-40 mt-2">
                Data updates every hour • {Object.keys(cityCoordinates).length} cities available
              </p>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${darkMode ? '#1f2937' : '#f3f4f6'};
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #ec4899);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #9333ea, #db2777);
        }
      `}</style>
    </div>
  );
};

export default WeatherPodcast;