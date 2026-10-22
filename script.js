const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const statusEl = document.getElementById('status');
const unitToggle = document.getElementById('unit-toggle');
const searchButton = document.getElementById('search-button');

let unit = 'celsius';
let lastCity = '';

// --- API calls ---
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
        + '&current=is_day,temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation'
        + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max'
        + `&temperature_unit=${unit}`
        + `&wind_speed_unit=${unit === 'celsius' ? 'kmh' : 'mph'}`
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

// --- Rendering ---
function renderCurrent(place, weather) {
    const current = weather.current;
    const symbol = unit === 'celsius' ? '°C' : '°F';
    const info = describeWeather(current.weather_code);
    const windLabel = unit === 'celsius' ? ' km/h' : ' mph';

    document.getElementById('city-name').textContent = place.name + ', ' + place.country;

    document.getElementById('icon').textContent = info.icon;

    document.getElementById('temp').textContent = Math.round(current.temperature_2m) + symbol;

    document.getElementById('description').textContent = info.text;

    document.getElementById('feels-like').textContent = Math.round(current.apparent_temperature) + symbol;

    document.getElementById('wind').textContent = Math.round(current.wind_speed_10m) + windLabel;

    document.getElementById('current').classList.remove('hidden');
}

function renderForecast(daily) {
    const container = document.getElementById('forecast');
    container.innerHTML = '';

    for (let i = 0; i < daily.time.length; i++) {
        const info = describeWeather(daily.weather_code[i]);
        const dayName = new Date(daily.time[i] + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
        const label = i === 0 ? 'Today' : dayName;

        const card = document.createElement('div');
        card.className = 'day';

        card.innerHTML = `
            <p class="day-name">${label}</p>
            <p class="day-icon">${info.icon}</p>
            <p class="day-temps">${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</p>
            <p class="day-rain">Rain: ${daily.precipitation_probability_max[i]}%</p>
        `;

        container.appendChild(card);
    }

    container.classList.remove('hidden');
}

function clearResults() {
    document.getElementById('current').classList.add('hidden');
    document.getElementById('advice').classList.add('hidden');
    document.getElementById('forecast').classList.add('hidden');
}

function applyTheme(isDay) {
    document.body.classList.toggle('day', isDay === 1);
}

function getAdvice(weather) {
    const tips = [];
    const feels = weather.current.apparent_temperature;
    const feelsC = unit === 'celsius' ? feels : (feels - 32) * 5 / 9;
    const wind = weather.current.wind_speed_10m;
    const windKmh = unit === 'celsius' ? wind : wind * 1.60934;
    const rainChance = weather.daily.precipitation_probability_max[0];
    const uv = weather.daily.uv_index_max[0];

    if (rainChance >= 50) {
        tips.push('Carry an umbrella');
    }

    if (feelsC <= 10) {
        tips.push('Wear a warm jacket');
    }

    if (feelsC >= 30) {
        tips.push('Stay hydrated and avoid the midday heat');
    }

    if (uv >= 6) {
        tips.push('Wear sunscreen');
    }

    if (windKmh >= 30) {
        tips.push('Windy today: secure loose items');
    }

    if (tips.length === 0) {
        tips.push('Conditions look easy today.');
    }

    return tips;
}

function renderAdvice(tips) {
    const list = document.getElementById('advice-list');
    list.innerHTML = '';

    for (let i = 0; i < tips.length; i++) {
        const item = document.createElement('li');
        item.textContent = tips[i];
        list.appendChild(item);
    }

    document.getElementById('advice').classList.remove('hidden');
}

function saveCity(city) {
    try {
        localStorage.setItem('lastCity', city);
    } catch (error) {
        console.error(error);
    }
}

function getSavedCity() {
    try {
        return localStorage.getItem('lastCity') || '';
    } catch (error) {
        return '';
    }
}

function saveUnit(value) {
    try {
        localStorage.setItem('unit', value);
    } catch (error) {
        console.error(error);
    }
}

function getSavedUnit() {
    try {
        const value = localStorage.getItem('unit');
        return value === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    } catch (error) {
        return 'celsius';
    }
}

async function loadCity(city) {
    lastCity = '';
    searchButton.disabled = true;
    unitToggle.disabled = true;
    clearResults();
    statusEl.textContent = 'Searching for ' + city + '...';

    try {
        const place = await getCoordinates(city);
        statusEl.textContent = 'Loading weather for ' + place.name + '...';

        const weather = await getWeather(place.latitude, place.longitude);

        renderCurrent(place, weather);
        applyTheme(weather.current.is_day);
        renderForecast(weather.daily);
        renderAdvice(getAdvice(weather));
        statusEl.textContent = '';
        lastCity = city;
        saveCity(city);

    } catch (error) {
        console.error(error);
        if (error.message === 'City not found') {
            statusEl.textContent = 'Could not find "' + city + '". Check the spelling.';
        } else {
            statusEl.textContent = 'Something went wrong. Check your connection and try again.';
        }
    } finally {
        searchButton.disabled = false;
        unitToggle.disabled = false;
    }
}

// --- Events and startup ---
searchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const city = cityInput.value.trim();

    if (city === '') {
        statusEl.textContent = 'Please type a city name.';
        return;
    }

    loadCity(city);
});

unitToggle.addEventListener('click', function () {
    unit = unit === 'celsius' ? 'fahrenheit' : 'celsius';
    saveUnit(unit);

    unitToggle.textContent = unit === 'celsius' ? '°C' : '°F';

    if (lastCity !== '') {
        loadCity(lastCity);
    }
});

unit = getSavedUnit();
unitToggle.textContent = unit === 'celsius' ? '°C' : '°F';

const savedCity = getSavedCity();

if (savedCity !== '') {
    cityInput.value = savedCity;
    loadCity(savedCity);
}