const express = require("express");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

// Home location: Raleigh, NC (ZIP 27616)
const LAT = 35.904;
const LON = -78.686;

app.get("/", async (req, res) => {
  try {
    const pointRes = await fetch(`https://api.weather.gov/points/${LAT},${LON}`);
    const pointData = await pointRes.json();

    const forecastRes = await fetch(pointData.properties.forecast);
    const forecastData = await forecastRes.json();

    const periods = forecastData.properties.periods;

    // Group by calendar day
    const dayMap = {};

    periods.forEach(p => {
      const dateKey = p.startTime.split("T")[0];

      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          name: "",
          high: null,
          low: null,
          forecasts: []
        };
      }

      const day = dayMap[dateKey];

      if (p.isDaytime) {
        day.name = p.name;
        day.high = p.temperature;
      } else {
        day.low = p.temperature;
      }

      day.forecasts.push(p.shortForecast);
    });

    // Build final 7-day list
    const days = Object.values(dayMap)
      .filter(d => d.high !== null || d.low !== null)
      .slice(0, 7)
      .map(d => {
        const text = d.forecasts.join(" ");

        // Icon priority
        let icon = "☀️";
        if (/snow/i.test(text)) icon = "❄️";
        else if (/rain|shower|storm/i.test(text)) icon = "🌧️";
        else if (/cloud/i.test(text)) icon = "☁️";

        return {
          name: d.name || "Day",
          icon,
          high: d.high ?? d.low,
          low: d.low ?? d.high,
          forecast: text
        };
      });

    let html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Kids Weather 🌈</title>
          <style>
            body { font-family: sans-serif; text-align: center; background: #87CEEB; }
            .day { display: inline-block; margin: 10px; padding: 10px; background: #fff; border-radius: 15px; width: 140px; vertical-align: top; }
            .icon { font-size: 50px; }
            .temp { font-size: 22px; }
            .text { font-size: 16px; }
          </style>
        </head>
        <body>
          <h1>7-Day Weather Forecast 🌤️</h1>
    `;

    days.forEach(d => {
      html += `
        <div class="day">
          <div class="text"><b>${d.name}</b></div>
          <div class="icon">${d.icon}</div>
          <div class="temp">High: ${d.high}°F</div>
          <div class="temp">Low: ${d.low}°F</div>
          <div class="text">${d.forecast}</div>
        </div>
      `;
    });

    html += `</body></html>`;
    res.send(html);

  } catch (e) {
    console.error(e);
    res.send("Weather unavailable 😢");
  }
});

app.listen(3000, () => console.log("WeatherDev1 running on port 3000"));
