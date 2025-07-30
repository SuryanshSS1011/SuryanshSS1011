const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function getContributionStats() {
  const username = process.env.GITHUB_REPOSITORY_OWNER;
  const currentYear = new Date().getFullYear();
  
  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalRepositoryContributions
          totalPullRequestReviewContributions
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
        repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: UPDATED_AT, direction: DESC}) {
          totalCount
          nodes {
            isPrivate
            stargazerCount
            forkCount
          }
        }
        followers {
          totalCount
        }
        following {
          totalCount
        }
      }
    }
  `;

  try {
    const from = new Date(`${currentYear}-01-01T00:00:00Z`);
    const to = new Date(`${currentYear}-12-31T23:59:59Z`);
    
    const response = await octokit.graphql(query, { username, from, to });
    
    // Calculate statistics
    const stats = {
      totalContributions: response.user.contributionsCollection.contributionCalendar.totalContributions,
      commits: response.user.contributionsCollection.totalCommitContributions,
      pullRequests: response.user.contributionsCollection.totalPullRequestContributions,
      issues: response.user.contributionsCollection.totalIssueContributions,
      reviews: response.user.contributionsCollection.totalPullRequestReviewContributions,
      repositories: response.user.repositories.totalCount,
      stars: response.user.repositories.nodes.reduce((acc, repo) => acc + repo.stargazerCount, 0),
      followers: response.user.followers.totalCount,
      currentYear
    };
    
    // Generate SVG
    const svg = generateContributionSVG(stats);
    
    // Save SVG file
    const outputPath = path.join(__dirname, "..", "assets", "images", "contribution-stats.svg");
    fs.writeFileSync(outputPath, svg);
    
    console.log("Contribution statistics generated successfully!");
    
  } catch (error) {
    console.error("Error fetching contribution statistics:", error);
    process.exit(1);
  }
}

function generateContributionSVG(stats) {
  const width = 495;
  const height = 195;
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: #58a6ff; }
    .stat { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #333; }
    .statlabel { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: #666; }
    .icon { fill: #586069; }
    @media (prefers-color-scheme: dark) {
      .stat { fill: #f0f6fc; }
      .statlabel { fill: #8b949e; }
      .icon { fill: #8b949e; }
    }
  </style>
  
  <rect x="0.5" y="0.5" width="${width-1}" height="${height-1}" rx="4.5" fill="#fffefe" stroke="#e4e2e2"/>
  
  <g transform="translate(25, 25)">
    <text x="0" y="0" class="header">${stats.currentYear} GitHub Activity</text>
    
    <!-- Row 1 -->
    <g transform="translate(0, 35)">
      <svg class="icon" viewBox="0 0 16 16" width="16" height="16" x="0" y="-12">
        <path fill-rule="evenodd" d="M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z"/>
      </svg>
      <text x="25" y="0" class="stat">${stats.totalContributions.toLocaleString()}</text>
      <text x="25" y="15" class="statlabel">Total Contributions</text>
    </g>
    
    <g transform="translate(155, 35)">
      <svg class="icon" viewBox="0 0 16 16" width="16" height="16" x="0" y="-12">
        <path fill-rule="evenodd" d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"/>
      </svg>
      <text x="25" y="0" class="stat">${stats.commits.toLocaleString()}</text>
      <text x="25" y="15" class="statlabel">Commits (${stats.currentYear})</text>
    </g>
    
    <g transform="translate(290, 35)">
      <svg class="icon" viewBox="0 0 16 16" width="16" height="16" x="0" y="-12">
        <path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
      </svg>
      <text x="25" y="0" class="stat">${stats.repositories}</text>
      <text x="25" y="15" class="statlabel">Repositories</text>
    </g>
    
    <!-- Row 2 -->
    <g transform="translate(0, 90)">
      <svg class="icon" viewBox="0 0 16 16" width="16" height="16" x="0" y="-12">
        <path fill-rule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
      </svg>
      <text x="25" y="0" class="stat">${stats.pullRequests}</text>
      <text x="25" y="15" class="statlabel">Pull Requests</text>
    </g>
    
    <g transform="translate(155, 90)">
      <svg class="icon" viewBox="0 0 16 16" width="16" height="16" x="0" y="-12">
        <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
        <path fill-rule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
      </svg>
      <text x="25" y="0" class="stat">${stats.issues}</text>
      <text x="25" y="15" class="statlabel">Issues</text>
    </g>
    
    <g transform="translate(290, 90)">
      <svg class="icon" viewBox="0 0 16 16" width="16" height="16" x="0" y="-12">
        <path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
      </svg>
      <text x="25" y="0" class="stat">${stats.stars}</text>
      <text x="25" y="15" class="statlabel">Stars Earned</text>
    </g>
  </g>
</svg>`;
}

getContributionStats();