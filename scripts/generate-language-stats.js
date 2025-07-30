const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function getLanguageStats() {
  const username = process.env.GITHUB_REPOSITORY_OWNER;
  
  const query = `
    query($username: String!) {
      user(login: $username) {
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
          nodes {
            name
            isPrivate
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await octokit.graphql(query, { username });
    
    // Aggregate language data
    const languageData = {};
    let totalSize = 0;

    response.user.repositories.nodes.forEach(repo => {
      repo.languages.edges.forEach(edge => {
        const lang = edge.node.name;
        const size = edge.size;
        const color = edge.node.color || "#858585";
        
        if (!languageData[lang]) {
          languageData[lang] = { size: 0, color };
        }
        languageData[lang].size += size;
        totalSize += size;
      });
    });

    // Sort languages by size
    const sortedLanguages = Object.entries(languageData)
      .sort(([, a], [, b]) => b.size - a.size)
      .slice(0, 8); // Top 8 languages

    // Generate SVG
    const svg = generateLanguageSVG(sortedLanguages, totalSize);
    
    // Save SVG file
    const outputPath = path.join(__dirname, "..", "assets", "images", "languages.svg");
    fs.writeFileSync(outputPath, svg);
    
    console.log("Language statistics generated successfully!");
    
    // Also generate a JSON file for reference
    const stats = {
      languages: sortedLanguages.map(([name, data]) => ({
        name,
        percentage: ((data.size / totalSize) * 100).toFixed(2),
        color: data.color
      })),
      generated: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(__dirname, "..", "assets", "language-stats.json"),
      JSON.stringify(stats, null, 2)
    );
    
  } catch (error) {
    console.error("Error fetching language statistics:", error);
    process.exit(1);
  }
}

function generateLanguageSVG(languages, totalSize) {
  const width = 500;
  const height = 200;
  const barHeight = 20;
  const margin = { top: 40, right: 20, bottom: 20, left: 20 };
  
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: #2f80ed; }
      .lang-name { font: 400 11px 'Segoe UI', Ubuntu, Sans-Serif; fill: #333; }
      .lang-percent { font: 600 11px 'Segoe UI', Ubuntu, Sans-Serif; fill: #333; }
    </style>
  </defs>
  
  <rect width="${width}" height="${height}" rx="5" fill="#fffefe"/>
  <text x="${width/2}" y="25" class="title" text-anchor="middle">Most Used Languages</text>
  
  <g transform="translate(${margin.left}, ${margin.top})">`;
  
  // Create progress bar
  const barWidth = width - margin.left - margin.right;
  let currentX = 0;
  
  // Progress bar background
  svg += `<rect y="10" width="${barWidth}" height="${barHeight}" fill="#ddd" rx="5"/>`;
  
  // Language segments
  languages.forEach(([name, data]) => {
    const percentage = (data.size / totalSize) * 100;
    const segmentWidth = (percentage / 100) * barWidth;
    
    svg += `<rect x="${currentX}" y="10" width="${segmentWidth}" height="${barHeight}" fill="${data.color}" />`;
    currentX += segmentWidth;
  });
  
  // Language list
  let yOffset = 50;
  languages.forEach(([name, data], index) => {
    const percentage = ((data.size / totalSize) * 100).toFixed(1);
    
    svg += `
    <g transform="translate(0, ${yOffset})">
      <circle cx="5" cy="5" r="5" fill="${data.color}"/>
      <text x="20" y="9" class="lang-name">${name}</text>
      <text x="${barWidth - 5}" y="9" class="lang-percent" text-anchor="end">${percentage}%</text>
    </g>`;
    
    yOffset += 20;
  });
  
  svg += `</g></svg>`;
  
  return svg;
}

getLanguageStats();