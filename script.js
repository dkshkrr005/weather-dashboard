console.log('script.js is connected');

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const statusEl = document.getElementById('status');
const unitToggle = document.getElementById('unit-toggle');

console.log(searchForm, cityInput, statusEl, unitToggle);

async function getCoordinates(cityName) {
    const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(cityName) + '&count=1';
    const response = await fetch(url);
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
    const data = await getCoordinates(city);
    console.log(data);
    const place = data.results[0];
    console.log(place.name, place.country, place.latitude, place.longitude);
});