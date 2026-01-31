const apiKey = 'da5cc509bc967933cf9f957a7a06eb9b';

async function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) return alert("Enter a city name");

  try {
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    const currentData = await currentRes.json();

    document.getElementById("cityName").innerText = currentData.name;
    document.getElementById("temperature").innerText = `${Math.round(currentData.main.temp)} °C`;
    document.getElementById("description").innerText = currentData.weather[0].description;

    document.querySelector(".current-weather .icon").innerHTML =
      `<img src="https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png">`;

    changeBackground(currentData.weather[0].main.toLowerCase());

    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
    );
    const forecastData = await forecastRes.json();

    const days = document.querySelectorAll(".day");
    days.forEach((day, i) => {
      const data = forecastData.list[i * 8];
      const date = new Date(data.dt_txt);

      day.querySelector(".weekday").innerText =
        date.toLocaleDateString("en-US", { weekday: "short" });
      day.querySelector(".icon").innerHTML =
        `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png">`;
      day.querySelector(".temp").innerText =
        `${Math.round(data.main.temp)} °C`;
    });

  } catch (err) {
    alert("City not found");
    console.error(err);
  }
}

function changeBackground(condition) {
  document.body.className = condition.includes("cloud") ? "clouds" :
                            condition.includes("rain") ? "rain" :
                            condition.includes("snow") ? "snow" :
                            condition.includes("clear") ? "clear" :
                            "default";
}
