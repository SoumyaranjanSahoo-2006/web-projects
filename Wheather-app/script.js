const apiKey = "da5cc509bc967933cf9f957a7a06eb9b";

/* =========================
   WEATHER BY CITY SEARCH
========================= */
async function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) {
    alert("Enter a city name");
    return;
  }

  try {
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );

    if (!currentRes.ok) throw new Error("City not found");

    const currentData = await currentRes.json();
    updateUI(currentData);

    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
    );

    const forecastData = await forecastRes.json();
    updateForecast(forecastData);

  } catch (error) {
    alert("City not found");
    console.error(error);
  }
}

/* =========================
   WEATHER BY LOCATION
========================= */
function getWeatherByLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );

        const data = await res.json();
        updateUI(data);

      } catch (error) {
        alert("Unable to fetch location weather");
        console.error(error);
      }
    },
    () => {
      alert("Location permission denied");
    }
  );
}

/* =========================
   UPDATE CURRENT WEATHER UI
========================= */
function updateUI(data) {
  document.getElementById("cityName").innerText = data.name;
  document.getElementById("temperature").innerText =
    `${Math.round(data.main.temp)} °C`;
  document.getElementById("description").innerText =
    data.weather[0].description;

  document.querySelector(".current-weather .icon").innerHTML =
    `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png">`;

  changeBackground(
    data.weather[0].main.toLowerCase(),
    data.weather[0].icon
  );
}

/* =========================
   UPDATE FORECAST
========================= */
function updateForecast(forecastData) {
  const days = document.querySelectorAll(".day");

  days.forEach((day, index) => {
    const data = forecastData.list[index * 8];
    if (!data) return;

    const date = new Date(data.dt_txt);

    day.querySelector(".weekday").innerText =
      date.toLocaleDateString("en-US", { weekday: "short" });

    day.querySelector(".icon").innerHTML =
      `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png">`;

    day.querySelector(".temp").innerText =
      `${Math.round(data.main.temp)} °C`;
  });
}

/* =========================
   BACKGROUND CONTROL
========================= */
clearWeatherEffect();


function changeBackground(condition, icon) {
  const isNight = icon.includes("n");

  if (condition.includes("clear")) {
    document.body.className = isNight ? "clear-night" : "clear-day";
  } else if (condition.includes("cloud")) {
    document.body.className = isNight ? "clouds-night" : "clouds-day";
  } else if (condition.includes("rain")) {
  document.body.className = isNight ? "rain-night" : "rain-day";
  createRain();
  } else if (condition.includes("snow")) {
  document.body.className = isNight ? "snow-night" : "snow-day";
  createSnow();
  } else {
    document.body.className = isNight ? "default-night" : "default-day";
  }
}

/* =========================
   AUTO LOAD LOCATION WEATHER
========================= */
window.onload = getWeatherByLocation;




// rain=======
function clearWeatherEffect() {
  document.getElementById("weather-effect").innerHTML = "";
}

function createRain() {
  clearWeatherEffect();
  const container = document.getElementById("weather-effect");

  for (let i = 0; i < 80; i++) {
    const drop = document.createElement("div");
    drop.className = "rain-drop";
    drop.style.left = Math.random() * 100 + "vw";
    drop.style.animationDuration = 0.5 + Math.random() + "s";
    drop.style.opacity = Math.random();
    container.appendChild(drop);
  }
}


//snow======
function createSnow() {
  clearWeatherEffect();
  const container = document.getElementById("weather-effect");

  for (let i = 0; i < 40; i++) {
    const snow = document.createElement("div");
    snow.className = "snowflake";
    snow.innerHTML = "❄";
    snow.style.left = Math.random() * 100 + "vw";
    snow.style.animationDuration = 3 + Math.random() * 3 + "s";
    snow.style.opacity = Math.random();
    container.appendChild(snow);
  }
}
