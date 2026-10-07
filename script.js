console.log('script.js is connected');

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const statusEl = document.getElementById('status');
const unitToggle = document.getElementById('unit-toggle');

console.log(searchForm, cityInput, statusEl, unitToggle);

async function getCoordinates(cityName) {
    const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(cityName) + '&count=1';
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Geocoding sercvice error');
    }

    const data = await response.json();
    
    if (!data.results) {
        throw new Error('City not found');
    }

    const place = data.result[0];
    return {
        name: place.name,
        country: place.country,
        latitude: placce.latitude,
        longitude: place.longitude
    };
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
        console.log(place);
        statusE1.textcontent = 'Found: ' + place.name + ', ' + place.country;
    } catch (error) {
        if (error.message === 'City not found') {
            statusE1.textcontent = 'Could not find "' + city + '". Chech the speeling.';
        } else {
            statusE1.textcontent = 'Something went wrong. Check your connection and try again.';
        }
    }

    const data = await getCoordinates(city);
    console.log(data);
    const place = data.results[0];
    console.log(place.name, place.country, place.latitude, place.longitude);
});