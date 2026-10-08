console.log('script.js is connected');

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const statusEl = document.getElementById('status');
const unitToggle = document.getElementById('unit-toggle');

let unit = 'celsius';

console.log(searchForm, cityInput, statusEl, unitToggle);

async function getCoordinates(cityName) {
    const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(cityName) + '&count=1';
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Geocoding service error');
    }
    const data = await response.json();
    if (!data.results) {
        throw new Error('City not found');
    }
    const place = data.results[0];
    return {
        name: place.name,
        country: place.country,
        latitude: place.latitude,
        longitude: place.longitude
    };
}

async function getWeather(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}`
        + '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation'
        + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max'
        + `&temperature_unit=${unit}`
        + '&timezone=auto&forecast_days=7';

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Weather service error');
    }

    const data = await response.json();
    return data;
}

function describeWeather(code) {
    if (code === 0) return { icon: '☀️', text: 'Clear sky' };
    if (code <= 3) return { icon: '⛅', text: 'Partly cloudy' };
    if (code === 45 || code === 48) return { icon: '🌫️', text: 'Fog' };
    if (code >= 51 && code <= 57) return { icon: '🌦️', text: 'Drizzle' };
    if (code >= 61 && code <= 67) return { icon: '🌧️', text: 'Rain' };
    if (code >= 71 && code <= 77) return { icon: '❄️', text: 'Snow' };
    if (code >= 80 && code <= 82) return { icon: '🌧️', text: 'Rain showers' };
    if (code === 85 || code === 86) return { icon: '❄️', text: 'Snow showers' };
    if (code >= 95) return { icon: '⛈️', text: 'Thunderstorm' };
    return { icon: '❓', text: 'Unknown' };
}

function renderCurrent(place, weather) {
    const current = weather.current;
    const symbol = unit === 'celsius' ? '°C' : '°F';
    const info = describeWeather(current.weather_code);

    document.getElementById('city-name').textContent = place.name + ', ' + place.country;

    document.getElementById('icon').textContent = info.icon

    document.getElementById('temp').textContent = Math.round(current.temperature_2m) + symbol;

    document.getElementById('description').textContent = info.text;

    document.getElementById('feels-like').textContent = Math.round(current.apparent_temperature) + symbol;

    document.getElementById('wind').textContent = Math.round(current.wind_speed_10m) + ' km/h';

    document.getElementById('current').classList.remove('hidden');
}

searchForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const city = cityInput.value.trim();

    if (city === '') {
        statusEl.textContent = 'Please type a city name.';
        return;
    }

    statusEl.textContent = 'Searching for ' + city + '...';

    try {
        const place = await getCoordinates(city);
        statusEl.textContent = 'Loading weather for ' + place.name + '...';

        const weather = await getWeather(place.latitude, place.longitude);

        renderCurrent(place, weather);
        statusEl.textContent = '';

    } catch (error) {
        console.error(error);
        if (error.message === 'City not found') {
            statusEl.textContent = 'Could not find "' + city + '". Check the spelling.';
        } else {
            statusEl.textContent = 'Something went wrong. Check your connection and try again.';
        }
    }
});