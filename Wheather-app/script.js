   (function() {
            // DOM elements
            const weatherEffect = document.getElementById('weather-effect');
            const searchInput = document.getElementById('search-input');
            const searchBtn = document.getElementById('search-btn');
            const locationBtn = document.getElementById('location-btn');
            const temperatureEl = document.getElementById('temperature');
            const weatherCondition = document.getElementById('weather-condition');
            const weatherDescription = document.getElementById('weather-description');
            const locationName = document.getElementById('location-name');
            const locationDetails = document.getElementById('location-details').querySelector('span');
            const windSpeed = document.getElementById('wind-speed');
            const humidity = document.getElementById('humidity');
            const feelsLike = document.getElementById('feels-like');
            const pressure = document.getElementById('pressure');
            const visibility = document.getElementById('visibility');
            const cloudCover = document.getElementById('cloud-cover');
            const sunrise = document.getElementById('sunrise');
            const sunset = document.getElementById('sunset');
            const airQuality = document.getElementById('air-quality');
            const uvIndex = document.getElementById('uv-index');
            const weatherIcon = document.getElementById('weather-icon');
            const forecastContainer = document.getElementById('forecast-container');
            const spinner = document.getElementById('spinner');
            const errorMessage = document.getElementById('error-message');
            const errorTitle = document.getElementById('error-title');
            const errorText = document.getElementById('error-text');
            const weatherContent = document.getElementById('weather-content');
            const alertBanner = document.getElementById('alert-banner');
            const alertTitle = document.getElementById('alert-title');
            const alertText = document.getElementById('alert-text');
            const currentTimeSpan = document.getElementById('current-time');
            const celsiusBtn = document.getElementById('celsius-btn');
            const fahrenheitBtn = document.getElementById('fahrenheit-btn');
            const retryBtn = document.getElementById('retry-btn');
            const recentSearchesDiv = document.getElementById('recent-searches');
            const recentList = document.getElementById('recent-list');
            const weatherTip = document.getElementById('weather-tip');
            const clothingTip = document.getElementById('clothing-tip');

            // API config (mock data as fallback)
            const API_KEY = 'da5cc509bc967933cf9f957a7a06eb9b';  // Replace with your key
            const useMockData = API_KEY === '' || API_KEY.length < 10; // demo mode

            let currentUnit = 'celsius';
            let currentWeatherData = null;
            let recentSearchesList = JSON.parse(localStorage.getItem('weatherRecentSearches')) || [];

            // Helper: responsive particle count
            function getParticleCount(base) {
                const width = window.innerWidth;
                if (width < 480) return Math.floor(base * 0.4);
                if (width < 768) return Math.floor(base * 0.7);
                return base;
            }

            // Background & tips mapping
            const weatherBackgrounds = {
                'Clear': { day:'sunny-bg', night:'clear-night-bg', iconColor:'sunny-icon', description:'Clear skies — perfect day!', tip:'Wear sunscreen and sunglasses.', clothing:'Light clothes, hat & sunglasses' },
                'Clouds': { day:'cloudy-bg', night:'cloudy-bg', iconColor:'cloudy-icon', description:'Partly cloudy, mild.', tip:'A light jacket might help.', clothing:'Layers, comfortable' },
                'Rain': { day:'rainy-bg', night:'rainy-bg', iconColor:'rainy-icon', description:'Rain expected.', tip:'Carry an umbrella.', clothing:'Waterproof jacket, boots' },
                'Drizzle': { day:'rainy-bg', night:'rainy-bg', iconColor:'rainy-icon', description:'Light drizzle.', tip:'Raincoat advisable.', clothing:'Water-resistant layer' },
                'Thunderstorm': { day:'thunder-bg', night:'thunder-bg', iconColor:'thunder-icon', description:'Thunderstorm! Stay safe.', tip:'Stay indoors, avoid electronics.', clothing:'Warm indoor clothes' },
                'Snow': { day:'snow-bg', night:'snow-bg', iconColor:'snow-icon', description:'Snowy wonderland.', tip:'Drive carefully, keep warm.', clothing:'Heavy coat, gloves, boots' },
                'Mist': { day:'fog-bg', night:'fog-bg', iconColor:'fog-icon', description:'Misty, low visibility.', tip:'Use fog lights, slow down.', clothing:'Light jacket, bright colors' },
                'Fog': { day:'fog-bg', night:'fog-bg', iconColor:'fog-icon', description:'Foggy conditions.', tip:'Drive slowly with fog lights.', clothing:'Warm, visible clothing' }
            };

            const weatherIcons = {
                '01d':'fas fa-sun', '01n':'fas fa-moon', '02d':'fas fa-cloud-sun', '02n':'fas fa-cloud-moon',
                '03d':'fas fa-cloud', '03n':'fas fa-cloud', '04d':'fas fa-cloud', '04n':'fas fa-cloud',
                '09d':'fas fa-cloud-rain', '09n':'fas fa-cloud-rain', '10d':'fas fa-cloud-sun-rain', '10n':'fas fa-cloud-moon-rain',
                '11d':'fas fa-bolt', '11n':'fas fa-bolt', '13d':'fas fa-snowflake', '13n':'fas fa-snowflake',
                '50d':'fas fa-smog', '50n':'fas fa-smog'
            };

            const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

            // UI utilities
            function showLoading() { spinner.style.display = 'block'; weatherContent.style.display = 'none'; errorMessage.style.display = 'none'; }
            function hideLoading() { spinner.style.display = 'none'; weatherContent.style.display = 'grid'; }
            function showError(title, msg) { errorTitle.textContent = title; errorText.textContent = msg; errorMessage.style.display = 'block'; weatherContent.style.display = 'none'; spinner.style.display = 'none'; }

            function updateCurrentTime() {
                const now = new Date();
                currentTimeSpan.textContent = now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) + ' • ' + now.toLocaleDateString([],{weekday:'short', month:'short', day:'numeric'});
            }
            setInterval(updateCurrentTime, 60000);

            // Recent searches
            function updateRecentSearches() {
                if (!recentSearchesList.length) { recentSearchesDiv.style.display = 'none'; return; }
                recentSearchesDiv.style.display = 'block';
                recentList.innerHTML = '';
                recentSearchesList.forEach(city => {
                    const item = document.createElement('div');
                    item.className = 'recent-item';
                    item.textContent = city;
                    item.addEventListener('click',()=>{ searchInput.value = city; fetchWeatherData(city); });
                    recentList.appendChild(item);
                });
            }
            function addToRecent(cityName) {
                recentSearchesList = recentSearchesList.filter(c => c.toLowerCase() !== cityName.toLowerCase());
                recentSearchesList.unshift(cityName);
                if (recentSearchesList.length > 5) recentSearchesList.pop();
                localStorage.setItem('weatherRecentSearches', JSON.stringify(recentSearchesList));
                updateRecentSearches();
            }

            // Conversions
            function kelvinToCelsius(k) { return Math.round(k - 273.15); }
            function celsiusToFahrenheit(c) { return Math.round((c * 9/5) + 32); }
            function metersToKm(m) { return (m/1000).toFixed(1); }
            function formatTime(timestamp) { return new Date(timestamp*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }

            // Effects
            function clearEffects() { weatherEffect.innerHTML = ''; }
            function createSnowEffect() { let c=getParticleCount(100); for(let i=0;i<c;i++){ let d=document.createElement('div'); d.className='snowflake'; let s=Math.random()*7+3; d.style.width=s+'px'; d.style.height=s+'px'; d.style.left=Math.random()*100+'vw'; d.style.top='-10px'; d.style.animation=`fall ${Math.random()*10+5}s linear ${Math.random()*5}s infinite`; weatherEffect.appendChild(d); } }
            function createRainEffect() { let c=getParticleCount(70); for(let i=0;i<c;i++){ let d=document.createElement('div'); d.className='raindrop'; d.style.left=Math.random()*100+'vw'; d.style.top='-20px'; d.style.animation=`rainFall ${Math.random()*1+0.5}s linear ${Math.random()*2}s infinite`; weatherEffect.appendChild(d); } }
            function createFogEffect() { let c=getParticleCount(12); for(let i=0;i<c;i++){ let d=document.createElement('div'); d.className='fog'; d.style.width=Math.random()*250+100+'px'; d.style.height=Math.random()*120+40+'px'; d.style.left=Math.random()*100+'vw'; d.style.top=Math.random()*80+'vh'; d.style.animation=`fogMove ${Math.random()*50+30}s linear infinite`; weatherEffect.appendChild(d); } }
            function createCloudEffect() { let c=getParticleCount(8); for(let i=0;i<c;i++){ let d=document.createElement('div'); d.className='cloud'; d.style.width=Math.random()*200+80+'px'; d.style.height=Math.random()*70+30+'px'; d.style.left=Math.random()*100+'vw'; d.style.top=Math.random()*70+'vh'; d.style.animation=`cloudMove ${Math.random()*40+20}s linear infinite`; weatherEffect.appendChild(d); } }
            function createWindEffect(speed) { let c=getParticleCount(speed>8?40:20); for(let i=0;i<c;i++){ let d=document.createElement('div'); d.className='wind-particle'; d.style.width='4px'; d.style.height='4px'; d.style.left='-10px'; d.style.top=Math.random()*100+'vh'; d.style.animation=`windBlow ${speed>8?2:4}s linear ${Math.random()*2}s infinite`; weatherEffect.appendChild(d); } }
            function createThunderEffect() { let d=document.createElement('div'); d.className='lightning'; weatherEffect.appendChild(d); function flash(){ setTimeout(()=>{ d.style.opacity='0.7'; setTimeout(()=>{ d.style.opacity='0'; setTimeout(flash, Math.random()*8000+4000); },100); }, Math.random()*8000+2000); } flash(); }

            function applyWeatherEffects(weather, wind, iconCode) {
                clearEffects();
                switch(weather) {
                    case 'Snow': createSnowEffect(); break;
                    case 'Rain': case 'Drizzle': createRainEffect(); break;
                    case 'Thunderstorm': createRainEffect(); createThunderEffect(); break;
                    case 'Fog': case 'Mist': case 'Haze': case 'Smoke': createFogEffect(); break;
                    case 'Clouds': createCloudEffect(); break;
                    default: if (wind > 4) createWindEffect(wind); break;
                }
            }

            function updateWeatherBackground(weather, icon) {
                const isDay = icon.endsWith('d');
                const bg = weatherBackgrounds[weather] || weatherBackgrounds['Clear'];
                document.body.className = document.body.className.replace(/\b\w+-bg\b/g,'').trim();
                document.body.classList.add(isDay ? bg.day : (bg.night || bg.day));
                weatherDescription.textContent = bg.description;
                weatherTip.textContent = bg.tip;
                clothingTip.textContent = bg.clothing;
                weatherIcon.className = 'weather-icon-large ' + bg.iconColor;
            }

            function generateForecast(data) {
                forecastContainer.innerHTML = '';
                const today = new Date();
                for (let i=0; i<5; i++) {
                    const d = new Date(today); d.setDate(today.getDate()+i);
                    const dayName = i===0 ? 'Today' : dayNames[d.getDay()];
                    let condition = data.weather[0].main;
                    if (i===1) condition = condition==='Clear'?'Clouds':condition==='Clouds'?'Rain':'Clear';
                    else if (i===2) condition = condition==='Rain'?'Thunderstorm':'Clouds';
                    else if (i===3) condition = 'Clear';
                    else condition = 'Clouds';

                    let icon = 'fas fa-sun', col = 'sunny-icon';
                    if (condition==='Clouds') { icon='fas fa-cloud'; col='cloudy-icon'; }
                    else if (condition==='Rain') { icon='fas fa-cloud-rain'; col='rainy-icon'; }
                    else if (condition==='Thunderstorm') { icon='fas fa-bolt'; col='thunder-icon'; }
                    else if (condition==='Snow') { icon='fas fa-snowflake'; col='snow-icon'; }
                    else if (condition==='Fog') { icon='fas fa-smog'; col='fog-icon'; }

                    const base = data.main.temp;
                    const high = Math.round(base + (i*1.5) + Math.random()*2);
                    const low = Math.round(base - (i*0.8) - Math.random()*3);

                    forecastContainer.innerHTML += `
                        <div class="forecast-item">
                            <div class="forecast-day">${dayName}</div>
                            <div class="forecast-icon ${col}"><i class="${icon}"></i></div>
                            <div class="forecast-temp"><span class="temp-high">${high}°</span><span class="temp-low">${low}°</span></div>
                            <div class="forecast-condition">${condition}</div>
                        </div>`;
                }
            }

            function updateAirQuality(condition) {
                let aqi='Good', uv=4;
                if (condition==='Clear') { aqi='Good'; uv=7; }
                else if (condition==='Clouds') { aqi='Moderate'; uv=4; }
                else if (condition==='Rain') { aqi='Excellent'; uv=2; }
                else if (condition==='Thunderstorm') { aqi='Poor'; uv=1; }
                airQuality.textContent = aqi;
                uvIndex.textContent = uv + ' ('+(uv<3?'Low':uv<6?'Moderate':uv<8?'High':'Very High')+')';
            }

            function updateWeatherDisplay(data) {
                currentWeatherData = data;
                let temp = currentUnit==='celsius' ? data.main.temp : celsiusToFahrenheit(data.main.temp);
                let feels = currentUnit==='celsius' ? data.main.feels_like : celsiusToFahrenheit(data.main.feels_like);
                temperatureEl.textContent = `${Math.round(temp)}°${currentUnit==='celsius'?'C':'F'}`;
                feelsLike.textContent = `${Math.round(feels)}°${currentUnit==='celsius'?'C':'F'}`;
                weatherCondition.textContent = data.weather[0].main;
                locationName.textContent = data.name;
                locationDetails.textContent = `${data.name}, ${data.sys.country}`;
                windSpeed.textContent = data.wind.speed + ' m/s';
                humidity.textContent = data.main.humidity + '%';
                pressure.textContent = data.main.pressure + ' hPa';
                visibility.textContent = metersToKm(data.visibility) + ' km';
                cloudCover.textContent = data.clouds.all + '%';
                sunrise.textContent = formatTime(data.sys.sunrise);
                sunset.textContent = formatTime(data.sys.sunset);
                updateWeatherBackground(data.weather[0].main, data.weather[0].icon);
                const iconCode = data.weather[0].icon;
                weatherIcon.innerHTML = `<i class="${weatherIcons[iconCode] || 'fas fa-sun'}"></i>`;
                addToRecent(`${data.name}, ${data.sys.country}`);
                applyWeatherEffects(data.weather[0].main, data.wind.speed, iconCode);
                generateForecast(data);
                updateAirQuality(data.weather[0].main);
                // alert banner
                alertBanner.style.display = 'none';
                if (data.weather[0].main==='Thunderstorm') { alertBanner.style.display='flex'; alertTitle.textContent='Storm alert'; alertText.textContent='Thunderstorms, stay indoors.'; }
                else if (data.wind.speed > 12) { alertBanner.style.display='flex'; alertTitle.textContent='Wind warning'; alertText.textContent='High winds, secure objects.'; }
            }

            // Mock data generator
            function getMockWeatherData(location) {
                const hash = location.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
                const conditions = [
                    { main:'Clear', icon:'01d' }, { main:'Clouds', icon:'03d' }, { main:'Rain', icon:'10d' },
                    { main:'Thunderstorm', icon:'11d' }, { main:'Snow', icon:'13d' }, { main:'Fog', icon:'50d' }
                ];
                const cond = conditions[hash % conditions.length];
                const baseTemp = cond.main==='Clear'?26: cond.main==='Clouds'?19: cond.main==='Rain'?12: cond.main==='Snow'?-1:10;
                return {
                    main: { temp: baseTemp+(hash%5-2), feels_like: baseTemp+(hash%3-1), pressure:1010, humidity:60+(hash%30) },
                    wind: { speed: 3+(hash%10) },
                    clouds: { all: 30+(hash%60) },
                    visibility: 9000,
                    weather: [cond],
                    name: location.split(',')[0] || 'City',
                    sys: { country: location.includes(',')?location.split(',')[1].trim():'IN', sunrise: Math.floor(Date.now()/1000)-20000, sunset: Math.floor(Date.now()/1000)+20000 }
                };
            }

            // API fetch
            async function fetchWeatherData(location) {
                try { showLoading();
                    if (useMockData) { setTimeout(()=>{ hideLoading(); updateWeatherDisplay(getMockWeatherData(location)); }, 600); return; }
                    const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${API_KEY}`);
                    if (!resp.ok) throw new Error(resp.status===404?'City not found':'API error');
                    let data = await resp.json();
                    data.main.temp = kelvinToCelsius(data.main.temp);
                    data.main.feels_like = kelvinToCelsius(data.main.feels_like);
                    hideLoading(); updateWeatherDisplay(data);
                } catch(e) { showError('Error', e.message); }
            }

            async function fetchWeatherByCoords(lat, lon) {
                try { showLoading();
                    if (useMockData) { setTimeout(()=>{ hideLoading(); updateWeatherDisplay(getMockWeatherData('Your location')); },600); return; }
                    const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
                    if (!resp.ok) throw new Error('Location error');
                    let data = await resp.json();
                    data.main.temp = kelvinToCelsius(data.main.temp);
                    data.main.feels_like = kelvinToCelsius(data.main.feels_like);
                    hideLoading(); updateWeatherDisplay(data);
                } catch(e) { showError('Location Error', 'Falling back to Delhi'); setTimeout(()=>fetchWeatherData('Delhi'),1500); }
            }

            function getUserLocation() {
                locationName.textContent = 'Locating...';
                if (!navigator.geolocation) { fetchWeatherData('Delhi'); return; }
                navigator.geolocation.getCurrentPosition(
                    pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
                    err => { console.warn(err); fetchWeatherData('Delhi'); },
                    { timeout:8000, enableHighAccuracy:true }
                );
            }

            // Toggle unit
            function toggleUnit(unit) {
                if (unit===currentUnit || !currentWeatherData) return;
                currentUnit = unit;
                celsiusBtn.classList.toggle('active', unit==='celsius');
                fahrenheitBtn.classList.toggle('active', unit==='fahrenheit');
                updateWeatherDisplay(currentWeatherData);
            }

            // Event listeners
            searchBtn.addEventListener('click', ()=>{ const loc = searchInput.value.trim(); if(loc) fetchWeatherData(loc); searchInput.value=''; });
            locationBtn.addEventListener('click', getUserLocation);
            searchInput.addEventListener('keypress', e => e.key==='Enter' && searchBtn.click());
            celsiusBtn.addEventListener('click', ()=>toggleUnit('celsius'));
            fahrenheitBtn.addEventListener('click', ()=>toggleUnit('fahrenheit'));
            retryBtn.addEventListener('click', getUserLocation);

            // Init
            updateCurrentTime();
            updateRecentSearches();
            getUserLocation();

            if (useMockData) {
                const footerNote = document.querySelector('footer p');
                footerNote.innerHTML += '<br><span style="color:#FFD700;">⚡ demo mode — add your OpenWeather API key</span>';
            }
        })();