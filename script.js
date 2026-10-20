console.log('script.js is connected');

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const statusEl = document.getElementById('status');
const unitToggle = document.getElementById('unit-toggle');

let unit = 'celsius';
let lastCity = '';

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

    document.getElementById('icon').textContent = info.icon;

    document.getElementById('temp').textContent = Math.round(current.temperature_2m) + symbol;

    document.getElementById('description').textContent = info.text;

    document.getElementById('feels-like').textContent = Math.round(current.apparent_temperature) + symbol;

    document.getElementById('wind').textContent = Math.round(current.wind_speed_10m) + ' km/h';

    document.getElementById('current').classList.remove('hidden');
}

function renderForecast(daily) {
    const container = document.getElementById('forecast');
    container.innerHTML = '';

    for (let i = 0; i < daily.time.length; i++) {
        const info = describeWeather(daily.weather_code[i]);
        const dayName = new Date(daily.time[i] + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });

        const card = document.createElement('div');
        card.className = 'day';

        card.innerHTML = `
            <p class="day-name">${dayName}</p>
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

function getAdvice(weather) {
    const tips = [];
    const feels = weather.current.apparent_temperature;
    const feelsC = unit === 'celsius' ? feels : (feels - 32) * 5 / 9;
    const wind = weather.current.wind_speed_10m;
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

    if (wind >= 30) {
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

async function loadCity(city) {
    lastCity = '';
    clearResults();
    statusEl.textContent = 'Searching for ' + city + '...';

    try {
        const place = await getCoordinates(city);
        statusEl.textContent = 'Loading weather for ' + place.name + '...';

        const weather = await getWeather(place.latitude, place.longitude);

        renderCurrent(place, weather);
        renderForecast(weather.daily);
        renderAdvice(getAdvice(weather));
        statusEl.textContent = '';
        lastCity = city;

    } catch (error) {
        console.error(error);
        if (error.message === 'City not found') {
            statusEl.textContent = 'Could not find "' + city + '". Check the spelling.';        
        } else {
            statusEl.textContent = 'Something went wrong. Check your connection and try again.';
        }
    }
}

searchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const city = cityInput.value.trim();

    if (city === '') {
        statusEl.textContent = 'Please type a city name.';
        return;
    }

    loadCity(city);
});

unitToggle.addEventListener('click', function() {
    unit = unit === 'celsius' ? 'fahrenheit' : 'celsius';

    unitToggle.textContent = unit === 'celsius' ? '°C' : '°F';

    if (lastCity !== '') {
        loadCity(lastCity);
    }
});