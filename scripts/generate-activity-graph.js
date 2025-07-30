const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function getActivityData() {
  const username = process.env.GITHUB_REPOSITORY_OWNER;
  
  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                weekday
                date
                contributionCount
                color
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await octokit.graphql(query, { username });
    
    // Process activity data
    const weeks = response.user.contributionsCollection.contributionCalendar.weeks;
    const activityByDay = Array(7).fill(0).map(() => []);
    const activityByHour = Array(24).fill(0);
    
    // Get recent 12 weeks of data for the graph
    const recentWeeks = weeks.slice(-12);
    
    // Generate SVG
    const svg = generateActivitySVG(recentWeeks);
    
    // Save SVG file
    const outputPath = path.join(__dirname, "..", "assets", "images", "activity-graph.svg");
    fs.writeFileSync(outputPath, svg);
    
    console.log("Activity graph generated successfully!");
    
  } catch (error) {
    console.error("Error fetching activity data:", error);
    process.exit(1);
  }
}

function generateActivitySVG(weeks) {
  const cellSize = 11;
  const cellGap = 3;
  const width = 350;  // Fixed width to match other cards
  const height = 155;
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .month { font: 400 10px 'Segoe UI', Ubuntu, Sans-Serif; fill: #a9b1d6; }
    .wday { font: 400 10px 'Segoe UI', Ubuntu, Sans-Serif; fill: #a9b1d6; }
    .title { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #7dcfff; }
  </style>
  
  <rect width="${width}" height="${height}" fill="#1a1b26" stroke="#414868" stroke-width="1" rx="8"/>
  
  <text x="${width/2}" y="20" text-anchor="middle" class="title">12-Week Activity Heatmap</text>
  
  <g transform="translate(35, 35)">`;
  
  // Add day labels
  days.forEach((day, i) => {
    svg += `<text x="-5" y="${i * (cellSize + cellGap) + 9}" text-anchor="end" class="wday">${day.slice(0, 3)}</text>`;
  });
  
  // Add contribution cells
  weeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day) => {
      const x = weekIndex * (cellSize + cellGap);
      const y = day.weekday * (cellSize + cellGap);
      // Tokyo Night contribution colors
      let color;
      if (day.contributionCount === 0) {
        color = '#24283b';
      } else if (day.contributionCount <= 2) {
        color = '#2d3748';
      } else if (day.contributionCount <= 4) {
        color = '#4a5568';
      } else if (day.contributionCount <= 8) {
        color = '#7dcfff';
      } else {
        color = '#9ece6a';
      }
      
      svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" rx="2">
        <title>${day.date}: ${day.contributionCount} contribution${day.contributionCount !== 1 ? 's' : ''}</title>
      </rect>`;
    });
  });
  
  svg += `</g></svg>`;
  
  return svg;
}

getActivityData();