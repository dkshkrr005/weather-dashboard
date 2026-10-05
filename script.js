console.log('script.js is connected');

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const statusEl = document.getElementById('status');
const unitToggle = document.getElementById('unit-toggle');

console.log(searchForm, cityInput, statusEl, unitToggle);

searchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const city = cityInput.value.trim();
    statusEl.textContent = 'You searched for:' + city;
});

