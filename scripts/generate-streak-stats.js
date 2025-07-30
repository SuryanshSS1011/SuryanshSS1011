const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function getStreakStats() {
  const username = process.env.GITHUB_REPOSITORY_OWNER;
  
  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await octokit.graphql(query, { username });
    
    // Calculate streaks
    const weeks = response.user.contributionsCollection.contributionCalendar.weeks;
    const allDays = [];
    
    weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        allDays.push({
          date: new Date(day.date),
          count: day.contributionCount
        });
      });
    });
    
    // Sort by date
    allDays.sort((a, b) => a.date - b.date);
    
    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if today has contributions
    const todayContributions = allDays[allDays.length - 1];
    const hasContributedToday = todayContributions && 
      todayContributions.date.toDateString() === today.toDateString() && 
      todayContributions.count > 0;
    
    // Calculate current streak (counting backwards from today or yesterday)
    for (let i = allDays.length - 1; i >= 0; i--) {
      const day = allDays[i];
      const dayDiff = Math.floor((today - day.date) / (1000 * 60 * 60 * 24));
      
      // Skip future dates or dates too far from today
      if (dayDiff < 0 || dayDiff > allDays.length - i) continue;
      
      if (day.count > 0) {
        if (currentStreak === 0 && dayDiff <= 1) {
          currentStreak = 1;
        } else if (currentStreak > 0 && dayDiff === allDays.length - i - currentStreak) {
          currentStreak++;
        } else if (currentStreak === 0) {
          break;
        }
      } else if (currentStreak > 0) {
        break;
      }
    }
    
    // Calculate longest streak
    for (let i = 0; i < allDays.length; i++) {
      if (allDays[i].count > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    // Get total contributions for the year
    const totalContributions = response.user.contributionsCollection.contributionCalendar.totalContributions;
    
    // Get first and last contribution dates
    let firstContribution = null;
    let lastContribution = null;
    
    for (let i = 0; i < allDays.length; i++) {
      if (allDays[i].count > 0) {
        if (!firstContribution) firstContribution = allDays[i].date;
        lastContribution = allDays[i].date;
      }
    }
    
    // Generate SVG
    const svg = generateStreakSVG({
      currentStreak,
      longestStreak,
      totalContributions,
      firstDate: firstContribution,
      lastDate: lastContribution
    });
    
    // Save SVG file
    const outputPath = path.join(__dirname, "..", "assets", "images", "streak-stats.svg");
    fs.writeFileSync(outputPath, svg);
    
    console.log("Streak statistics generated successfully!");
    
  } catch (error) {
    console.error("Error fetching streak statistics:", error);
    process.exit(1);
  }
}

function generateStreakSVG(stats) {
  const width = 495;
  const height = 195;
  
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#fc6c0f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff9a56;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <style>
    .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: #333; }
    .stat-value { font: 700 28px 'Segoe UI', Ubuntu, Sans-Serif; fill: #333; }
    .stat-label { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #666; }
    .date-text { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #666; }
    .icon { fill: #fc6c0f; }
    @media (prefers-color-scheme: dark) {
      .header { fill: #f0f6fc; }
      .stat-value { fill: #f0f6fc; }
      .stat-label { fill: #8b949e; }
      .date-text { fill: #8b949e; }
    }
  </style>
  
  <rect x="0.5" y="0.5" width="${width-1}" height="${height-1}" rx="4.5" fill="#fffefe" stroke="#e4e2e2"/>
  
  <g transform="translate(25, 30)">
    <!-- Header with fire icon -->
    <svg class="icon" viewBox="0 0 16 16" width="20" height="20" x="0" y="-5">
      <path d="M15.2 8.172c0 2.416-1.408 4.432-3.28 5.216-.592.24-1.248.384-1.936.384s-1.344-.144-1.936-.384c-1.888-.784-3.28-2.8-3.28-5.216 0-1.792.832-3.376 2.096-4.384C7.328 3.32 7.44 2.72 7.44 2.272c0-.336-.048-.656-.144-.976 1.008.592 1.84 1.424 2.4 2.4.56-.896.896-1.968.896-3.168 0-.176 0-.336-.016-.512 2.384 1.456 4.624 4.544 4.624 8.16z"/>
    </svg>
    <text x="30" y="0" class="header">Contribution Streak</text>
    
    <!-- Current Streak -->
    <g transform="translate(0, 40)">
      <text x="0" y="0" class="stat-value">${stats.currentStreak}</text>
      <text x="0" y="25" class="stat-label">Current Streak</text>
      <text x="0" y="42" class="date-text">Last contribution: ${formatDate(stats.lastDate)}</text>
    </g>
    
    <!-- Longest Streak -->
    <g transform="translate(170, 40)">
      <text x="0" y="0" class="stat-value">${stats.longestStreak}</text>
      <text x="0" y="25" class="stat-label">Longest Streak</text>
    </g>
    
    <!-- Total Contributions -->
    <g transform="translate(320, 40)">
      <text x="0" y="0" class="stat-value">${stats.totalContributions.toLocaleString()}</text>
      <text x="0" y="25" class="stat-label">Total (This Year)</text>
    </g>
    
    <!-- Streak bar visualization -->
    <g transform="translate(0, 110)">
      <rect x="0" y="0" width="445" height="8" rx="4" fill="#ebedf0"/>
      <rect x="0" y="0" width="${Math.min(445, (stats.currentStreak / stats.longestStreak) * 445)}" height="8" rx="4" fill="url(#gradient)"/>
    </g>
  </g>
</svg>`;
}

getStreakStats();