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
        console.log(place);
        console.log(weather);

        statusEl.textContent = 'Found: ' + place.name + ', ' + place.country;
    } catch (error) {
        console.error(error);
        if (error.message === 'City not found') {
            statusEl.textContent = 'Could not find "' + city + '". Check the spelling.';
        } else {
            statusEl.textContent = 'Something went wrong. Check your connection and try again.';
        }
    }
});