import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';

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
  };

  // Функція для групування прогнозів по днях
  const groupForecastsByDay = (list: WeatherData['list']) => {
    const grouped: { [key: string]: WeatherData['list'] } = {};
    list.forEach(item => {
      const day = item.dt_txt.split(' ')[0]; // Отримуємо 'YYYY-MM-DD'
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(item);
    });
    return grouped;
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
      <h3>Weather Forecast</h3>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={inputCity} 
          onChange={handleCityChange} 
          placeholder="Enter city name" 
          style={{ marginRight: '10px', padding: '8px' }} 
        />
        <button type="submit" style={{ padding: '8px 12px' }} disabled={loading}>
          {loading ? 'Searching...' : 'Get Weather'}
        </button>
      </form>

      {loading && <p>Loading weather data...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {weatherData && (
        <div>
          <h4>Forecast for {weatherData.city.name}, {weatherData.city.country}</h4>
          {Object.entries(groupForecastsByDay(weatherData.list)).map(([day, forecasts]) => (
            <div key={day} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #eee' }}>
              <strong>{new Date(day).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '15px', marginTop: '10px' }}>
                {forecasts.map(item => (
                  <div key={item.dt} style={{ minWidth: '120px', textAlign: 'center', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <p>{item.dt_txt.split(' ')[1].substring(0, 5)}</p> {/* Час HH:MM */}
                    <img 
                        src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`} 
                        alt={item.weather[0].description} 
                        style={{ width: '50px', height: '50px' }}
                    />
                    <p>{Math.round(item.main.temp)}°C</p>
                    <p style={{ fontSize: '0.8em' }}>{item.weather[0].description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget; 