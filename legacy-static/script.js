const API_KEY = (typeof config !== 'undefined' && config.WEATHER_API_KEY) || "";

const cityInput = document.querySelector(".city-input");
const searchBtn = document.querySelector(".search-btn");

const weatherInfoSection = document.querySelector(".weather-info");
const notFoundSection = document.querySelector(".not-found");
const searchCitySection = document.querySelector(".search-city");

const countryTxt = document.querySelector(".country-txt");

const tempTxt = document.querySelector(".temp-txt");
const conditionTxt = document.querySelector(".condition-txt");
const humidityValueTxt = document.querySelector(".humidity-value-txt");
const windValueTxt = document.querySelector(".wind-value-txt");

const currentDateTxt = document.querySelector(".current-date-txt");
const forecastDateTxt = document.querySelector(".forecast-item-date");
const weatherSummaryImg = document.querySelector(".weather-summary-img");

const forecastItemsContainer = document.querySelector(
  ".forecast-items-container"
);

//Url Animate

let myEmojis = ["☀", "🌧", "☁", "❄", "⛈", "🌫", "🌦"]; // Removed variation selectors
let animationFrameId;

const urlAnimate = () => {
  const emoji = myEmojis[Math.floor((Date.now() / 1000) % myEmojis.length)];
  window.location.hash = encodeURIComponent(emoji);
  animationFrameId = requestAnimationFrame(urlAnimate);
};

urlAnimate();

// Cleanup animation when page unloads
window.addEventListener("unload", () => {
  cancelAnimationFrame(animationFrameId);
});
//Url Animate End

// Handle search button click
searchBtn.addEventListener("click", () => {
  if (cityInput.value.trim() !== "") {
    updateWeatherInfo(cityInput.value);
    cityInput.value = "";
    cityInput.blur();
  }
});

// Handle Enter key press
cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && cityInput.value.trim() !== "") {
    updateWeatherInfo(cityInput.value);
    cityInput.value = "";
    cityInput.blur();
  }
});

function getWeatherIcon(id) {
  if (id <= 232) return "./assets/weather/thunderstorm.svg";
  else if (id <= 321) return "./assets/weather/drizzle.svg";
  else if (id <= 531) return "./assets/weather/rain.svg";
  else if (id <= 622) return "./assets/weather/snow.svg";
  else if (id <= 781) return "./assets/weather/atmosphere.svg";
  else if (id === 800) return "./assets/weather/clear.svg";
  else if (id <= 804) return "./assets/weather/clouds.svg";
  return "./assets/weather/unknown.svg";
}

function getTemperatureGradient(temp) {
  let colors;
  if (temp <= 0) {
    // Cold: Blues and whites
    colors = [
      "rgba(28, 146, 210, 0.4)",
      "rgba(116, 215, 238, 0.4)",
      "rgba(198, 233, 247, 0.4)",
    ];
  } else if (temp <= 15) {
    // Cool: Light blues and greens
    colors = [
      "rgba(66, 3, 169, 0.4)",
      "rgba(144, 186, 252, 0.4)",
      "rgba(99, 71, 255, 0.4)",
    ];
  } else if (temp <= 30) {
    // Mild: Greens and yellows
    colors = [
      "rgba(76, 175, 80, 0.4)",
      "rgba(156, 204, 101, 0.4)",
      "rgba(212, 225, 87, 0.4)",
    ];
  } else if (temp <= 40) {
    // Warm: Oranges and yellows
    colors = [
      "rgba(255, 152, 0, 0.4)",
      "rgba(255, 193, 7, 0.4)",
      "rgba(255, 235, 59, 0.4)",
    ];
  } else {
    // Hot: Oranges and reds
    colors = [
      "rgba(244, 67, 54, 0.4)",
      "rgba(255, 87, 34, 0.4)",
      "rgba(255, 152, 0, 0.4)",
    ];
  }
  return `linear-gradient(135deg, ${colors.join(", ")})`;
}

function getCurrentDate() {
  const currentDate = new Date();
  const options = {
    weekday: "short",
    day: "2-digit",
    month: "short",
  };
  return currentDate.toLocaleDateString("en-GB", options);
}

async function getFetchData(endpoint, city) {
    try {
        const apiUrl = `https://api.openweathermap.org/data/2.5/${endpoint}?q=${city}&appid=${API_KEY}&units=metric`;
        const response = await fetch(apiUrl);
        return response.json();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showDisplaySection(notFoundSection);
    }
}

async function updateWeatherInfo(city) {
  // Show loading state
  showDisplaySection(weatherInfoSection);
  countryTxt.textContent = "Loading...";
  tempTxt.textContent = "--°C";
  conditionTxt.textContent = "...";

  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay

  const weatherData = await getFetchData("weather", city);
  if (weatherData.cod !== 200) {
    showDisplaySection(notFoundSection);
    return;
  }

  const {
    name: country,
    main: { temp, humidity },
    weather: [{ id, main }],
    wind: { speed },
    timezone,
  } = weatherData;

  // Update the weather information
  updateLocalTime(timezone);
  currentDateTxt.textContent = getCurrentDate();
  forecastDateTxt.textContent = getCurrentDate();

  countryTxt.textContent = country;
  tempTxt.textContent = Math.round(temp) + "°C";
  conditionTxt.textContent = main;
  humidityValueTxt.textContent = humidity + "%";
  windValueTxt.textContent = speed + " M/s";
  weatherSummaryImg.src = `${getWeatherIcon(id)}`;

  // Update background gradient based on temperature
  document.body.style.setProperty('--dynamic-gradient', getTemperatureGradient(temp));

  await updateForecastsInfo(city);
  showDisplaySection(weatherInfoSection);
}

// Update local time
function updateLocalTime(timezone) {
  const localTimeElement = document.querySelector(".local-time");

  function updateTime() {
    const now = new Date();
    // Convert timezone offset from seconds to milliseconds
    const localTime = new Date(
      now.getTime() + timezone * 1000 + now.getTimezoneOffset() * 60 * 1000
    );

    const time = localTime.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    localTimeElement.textContent = time;
  }

  // Update immediately and then every second
  updateTime();
  // Clear any existing interval
  if (window.localTimeInterval) clearInterval(window.localTimeInterval);
  // Set new interval
  window.localTimeInterval = setInterval(updateTime, 1000);
}

async function updateForecastsInfo(city) {
  const forecastsData = await getFetchData("forecast", city);

  const timeTaken = "12:00:00";
  const todayDate = new Date().toISOString().split("T")[0];

  forecastItemsContainer.innerHTML = "";

  forecastsData.list.forEach((forecastWeather) => {
    if (
      forecastWeather.dt_txt.includes(timeTaken) &&
      !forecastWeather.dt_txt.includes(todayDate)
    ) {
      updateForecastItems(forecastWeather);
    }
  });
}

function updateForecastItems(weatherData) {
  const {
    dt_txt: date,
    weather: [{ id }],
    main: { temp },
  } = weatherData;

  const dateTaken = new Date(date);
  const dateOptions = {
    day: "2-digit",
    month: "short",
  };

  console.log(weatherData);
  const dateResult = dateTaken.toLocaleDateString("en-US", dateOptions);

  const forecastItem = `
    <div class="forecast-item">
                    <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
                    <img src="${getWeatherIcon(id)}" class="forecast-item-img">
                    <h5 class="forecast-item-temp">${Math.round(temp)}°C</h5>
                </div>
                `;

  forecastItemsContainer.insertAdjacentHTML("beforeend", forecastItem);
}

//Current time
function updateTime() {
  const timeElement = document.getElementById("current-time");
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  timeElement.textContent = time;
}

// Update time every second
setInterval(updateTime, 1000);
// Initial call to display time immediately
updateTime();

function showDisplaySection(section) {
  [weatherInfoSection, notFoundSection, searchCitySection].forEach(
    (section) => (section.style.display = "none")
  );

  section.style.display = "flex";
}
