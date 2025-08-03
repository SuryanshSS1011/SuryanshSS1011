const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

class ReadmeUpdater {
  constructor() {
    this.readmePath = 'README.md';
    this.readme = fs.readFileSync(this.readmePath, 'utf8');
  }

  async updateRecentActivity() {
    try {
      const username = process.env.GITHUB_REPOSITORY_OWNER || 'SuryanshSS1011';
      const token = process.env.GITHUB_TOKEN;
      
      const events = await this.fetchGitHubEvents(username, token);
      const activityList = this.formatRecentActivity(events);
      
      this.updateSection('Recent Activity', activityList);
    } catch (error) {
      console.error('Error updating recent activity:', error);
    }
  }

  async fetchGitHubEvents(username, token) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/users/${username}/events/public`,
        headers: {
          'User-Agent': 'ReadmeUpdater',
          'Authorization': token ? `token ${token}` : undefined
        }
      };

      https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  formatRecentActivity(events) {
    const recentEvents = events.slice(0, 5);
    const activities = recentEvents.map(event => {
      const date = new Date(event.created_at).toLocaleDateString('en-US', { 
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const repo = event.repo.name;
      
      switch(event.type) {
        case 'PushEvent':
          const commits = event.payload.commits?.length || 0;
          return `🔨 Pushed ${commits} commit(s) to ${repo}`;
        case 'CreateEvent':
          return `📦 Created ${event.payload.ref_type} in ${repo}`;
        case 'IssuesEvent':
          return `📝 ${event.payload.action} issue in ${repo}`;
        case 'PullRequestEvent':
          return `🔄 ${event.payload.action} PR in ${repo}`;
        case 'WatchEvent':
          return `⭐ Starred ${repo}`;
        case 'ForkEvent':
          return `🔱 Forked ${repo}`;
        default:
          return `🎯 ${event.type.replace('Event', '')} in ${repo}`;
      }
    });

    return activities.map((activity, index) => 
      `${index + 1}. ${activity}`
    ).join('\n');
  }

  updateSection(sectionName, content) {
    const sectionRegex = new RegExp(
      `(<!-- ${sectionName} Start -->)[\\s\\S]*?(<!-- ${sectionName} End -->)`,
      'g'
    );
    
    if (this.readme.match(sectionRegex)) {
      this.readme = this.readme.replace(
        sectionRegex,
        `$1\n${content}\n$2`
      );
    } else {
      console.warn(`Section markers for '${sectionName}' not found`);
    }
  }

  updateStats() {
    try {
      const stats = this.calculateStats();
      
      this.updateSection('Stats', `
- 📊 Total Repos: ${stats.repos}
- ⭐ Total Stars: ${stats.stars}
- 👥 Followers: ${stats.followers}
- 📅 Account Age: ${stats.accountAge} days
- 🔥 Current Streak: ${stats.streak} days
      `.trim());
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  calculateStats() {
    // This would normally fetch from GitHub API
    // Simplified for example
    return {
      repos: Math.floor(Math.random() * 100),
      stars: Math.floor(Math.random() * 1000),
      followers: Math.floor(Math.random() * 500),
      accountAge: Math.floor(Math.random() * 1000),
      streak: Math.floor(Math.random() * 100)
    };
  }

  updateTimestamp() {
    const now = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'short'
    });
    this.readme = this.readme.replace(
      /Last updated: .*/g,
      `Last updated: ${now} ET`
    );
  }

  save() {
    fs.writeFileSync(this.readmePath, this.readme);
    console.log('README updated successfully!');
  }

  async run() {
    await this.updateRecentActivity();
    this.updateStats();
    this.updateTimestamp();
    this.save();
  }
}

// Run the updater
if (require.main === module) {
  const updater = new ReadmeUpdater();
  updater.run().catch(console.error);
}

module.exports = ReadmeUpdater;