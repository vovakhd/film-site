import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import './WeatherWidget.css'; // Import the CSS file

const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

interface WeatherData {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
    };
    weather: Array<{
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
    };
    dt_txt: string;
  }>;
  city: {
    name: string;
    country: string;
    sunrise: number;
    sunset: number;
  };
}

const WeatherWidget: React.FC = () => {
  const [city, setCity] = useState<string>('Kyiv'); // Місто за замовчуванням
  const [inputCity, setInputCity] = useState<string>('Kyiv');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullForecast, setShowFullForecast] = useState<boolean>(false);
  const [visibleNextDaysCount, setVisibleNextDaysCount] = useState<number>(1);

  const fetchWeatherData = useCallback(async (currentCity: string) => {
    if (!API_KEY) {
      setError('OpenWeatherMap API key is missing. Please check your .env configuration.');
      setLoading(false);
      return;
    }
    if (!currentCity) {
        setError('Please enter a city name.');
        setLoading(false);
        return;
    }

    setLoading(true);
    setError(null);
    setWeatherData(null);

    try {
      const response = await fetch(`${API_BASE_URL}?q=${currentCity}&appid=${API_KEY}&units=metric&cnt=40`); // cnt=40 для 5 днів * 8 записів/день
      if (!response.ok) {
        const errorData = await response.json().catch(() => null); // Спробувати отримати JSON з помилкою
        if (response.status === 401) {
            throw new Error('Invalid API Key or not activated yet. Please check your OpenWeatherMap dashboard.');
        } else if (response.status === 404) {
            throw new Error(`City "${currentCity}" not found. Please check the spelling.`);
        } else {
            throw new Error(errorData?.message || `Error: ${response.status} ${response.statusText}`);
        }
      }
      const data: WeatherData = await response.json();
      setWeatherData(data);
      if (data) setVisibleNextDaysCount(1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data.');
      console.error("Weather fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeatherData(city);
  }, [city, fetchWeatherData]);

  const handleCityChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputCity(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCity(inputCity);
    setShowFullForecast(false);
    setVisibleNextDaysCount(1);
  };

  const groupForecastsByDay = (list: WeatherData['list']) => {
    const grouped: { [key: string]: WeatherData['list'] } = {};
    list.forEach(item => {
      const day = item.dt_txt.split(' ')[0];
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(item);
    });
    return grouped;
  };

  const getCurrentDayForecasts = (list: WeatherData['list']) => {
    // Ensure list is not empty
    if (!list || list.length === 0) return [];
    // Get the date of the first item, which should be today
    const todayDateStr = list[0].dt_txt.split(' ')[0];
    return list.filter(item => item.dt_txt.split(' ')[0] === todayDateStr);
  };
  
  const getNextDaysForecasts = (list: WeatherData['list']) => {
    if (!list || list.length === 0) return {};
    const grouped = groupForecastsByDay(list);
    const todayDateStr = list[0].dt_txt.split(' ')[0];
    const nextDaysGrouped: { [key: string]: WeatherData['list'] } = {};
    Object.entries(grouped).forEach(([day, forecasts]) => {
      if (day !== todayDateStr) {
        nextDaysGrouped[day] = forecasts;
      }
    });
    return nextDaysGrouped;
  };

  const allNextDays = weatherData ? Object.entries(getNextDaysForecasts(weatherData.list)) : [];
  const canShowMoreDays = visibleNextDaysCount < allNextDays.length;

  const handleShowMoreDays = () => {
    setVisibleNextDaysCount(prevCount => Math.min(prevCount + 1, allNextDays.length));
  };

  return (
    <div className="weather-widget-component">
      <h3>Weather Forecast</h3>
      <form onSubmit={handleSubmit} className="weather-form">
        <input
          type="text"
          value={inputCity}
          onChange={handleCityChange}
          placeholder="Enter city name"
          className="city-input"
          aria-label="Enter city name for weather forecast"
        />
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Searching...' : 'Get Weather'}
        </button>
      </form>

      {loading && <p className="loading-message" aria-live="polite">Loading weather data...</p>}
      {error && <p className="error-message" role="alert" aria-live="assertive">Error: {error}</p>}

      {weatherData && weatherData.list.length > 0 && (
        <div className="forecast-container">
          <h4>{weatherData.city.name}, {weatherData.city.country}</h4>
          
          <div className="forecast-day current-day-forecast">
            <strong>Today</strong>
            <div className="forecast-items-scrollable">
              {getCurrentDayForecasts(weatherData.list).map(item => (
                <div key={`current-${item.dt}`} className="forecast-item">
                  <p className="forecast-time">{item.dt_txt.split(' ')[1].substring(0, 5)}</p>
                  <img
                      src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                      alt={item.weather[0].description}
                      className="weather-icon"
                  />
                  <p className="forecast-temp">{Math.round(item.main.temp)}°C</p>
                  <p className="forecast-description">{item.weather[0].description}</p>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              setShowFullForecast(!showFullForecast);
              if (showFullForecast) setVisibleNextDaysCount(1);
            }} 
            className="toggle-forecast-button"
            aria-expanded={showFullForecast}
            aria-controls="full-forecast-details-content"
          >
            {showFullForecast ? 'Hide Full Forecast' : 'Show Full Forecast'}
          </button>

          {showFullForecast && (
            <div className="full-forecast-details" id="full-forecast-details-content">
              {allNextDays
                .slice(0, visibleNextDaysCount) 
                .map(([day, forecasts]) => (
                <div key={day} className="forecast-day other-day-forecast">
                  <strong>{new Date(day).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong>
                  <div className="forecast-items-scrollable">
                    {forecasts.map(item => (
                      <div key={item.dt} className="forecast-item">
                        <p className="forecast-time">{item.dt_txt.split(' ')[1].substring(0, 5)}</p>
                        <img
                            src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                            alt={item.weather[0].description}
                            className="weather-icon"
                        />
                        <p className="forecast-temp">{Math.round(item.main.temp)}°C</p>
                        <p className="forecast-description">{item.weather[0].description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {showFullForecast && canShowMoreDays && (
                <button 
                  onClick={handleShowMoreDays} 
                  className="show-more-days-button"
                  aria-label="Show weather forecast for the next available day"
                >
                  Show Next Day ({visibleNextDaysCount + 1})
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget; 