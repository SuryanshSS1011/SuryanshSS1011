const fs = require('fs');
const https = require('https');

class BadgeGenerator {
  constructor() {
    this.shields_io_base = 'https://img.shields.io/badge/';
    this.username = process.env.GITHUB_REPOSITORY_OWNER || 'SuryanshSS1011';
  }

  generateBadgeUrl(label, message, color, style = 'flat-square') {
    const encodedLabel = encodeURIComponent(label);
    const encodedMessage = encodeURIComponent(message);
    return `${this.shields_io_base}${encodedLabel}-${encodedMessage}-${color}?style=${style}`;
  }

  async fetchGitHubStats() {
    // In a real implementation, these would come from GitHub API
    // For now, using placeholder data
    return {
      repos: await this.getRepoCount(),
      stars: await this.getTotalStars(),
      followers: await this.getFollowers(),
      contributions: await this.getYearContributions(),
      languages: await this.getTopLanguages(),
      streak: await this.getCurrentStreak()
    };
  }

  async getRepoCount() {
    // Placeholder - would fetch from GitHub API
    return 42;
  }

  async getTotalStars() {
    // Placeholder - would sum stars across all repos
    return 256;
  }

  async getFollowers() {
    // Placeholder - would fetch from GitHub API
    return 128;
  }

  async getYearContributions() {
    // Placeholder - would fetch from GitHub GraphQL API
    return 1337;
  }

  async getTopLanguages() {
    // Placeholder - would analyze repo languages
    return ['Python', 'TypeScript', 'Swift', 'SQL', 'Java'];
  }

  async getCurrentStreak() {
    // Placeholder - would calculate from contributions
    return 21;
  }

  getColorForValue(value, thresholds) {
    if (value >= thresholds.high) return 'brightgreen';
    if (value >= thresholds.medium) return 'yellow';
    return 'orange';
  }

  async generateAllBadges() {
    const stats = await this.fetchGitHubStats();
    const badges = [];

    // Repository count badge
    badges.push({
      name: 'repos',
      url: this.generateBadgeUrl(
        'Repos',
        stats.repos.toString(),
        this.getColorForValue(stats.repos, { high: 50, medium: 20 })
      ),
      alt: 'Repository Count'
    });

    // Stars badge
    badges.push({
      name: 'stars',
      url: this.generateBadgeUrl(
        'Stars',
        stats.stars.toString(),
        this.getColorForValue(stats.stars, { high: 500, medium: 100 })
      ),
      alt: 'Total Stars'
    });

    // Followers badge
    badges.push({
      name: 'followers',
      url: this.generateBadgeUrl(
        'Followers',
        stats.followers.toString(),
        this.getColorForValue(stats.followers, { high: 200, medium: 50 })
      ),
      alt: 'Followers'
    });

    // Contributions badge
    badges.push({
      name: 'contributions',
      url: this.generateBadgeUrl(
        '2024 Contributions',
        stats.contributions.toString(),
        this.getColorForValue(stats.contributions, { high: 1000, medium: 500 })
      ),
      alt: 'Yearly Contributions'
    });

    // Streak badge
    badges.push({
      name: 'streak',
      url: this.generateBadgeUrl(
        'Current Streak',
        `${stats.streak} days`,
        this.getColorForValue(stats.streak, { high: 30, medium: 7 })
      ),
      alt: 'Contribution Streak'
    });

    // Top languages badges
    stats.languages.slice(0, 3).forEach((lang, index) => {
      badges.push({
        name: `lang_${index}`,
        url: this.generateBadgeUrl(
          `Lang #${index + 1}`,
          lang,
          ['blue', 'green', 'yellow'][index]
        ),
        alt: `Top Language ${index + 1}`
      });
    });

    // Custom animated badge (using endpoint that supports animations)
    badges.push({
      name: 'profile_views',
      url: this.generateBadgeUrl(
        'Profile Views',
        '1.2k+',
        'blueviolet'
      ),
      alt: 'Profile Views'
    });

    return badges;
  }

  generateMarkdown(badges) {
    const badgeMarkdown = badges
      .map(badge => `![${badge.alt}](${badge.url})`)
      .join(' ');

    return `
<!-- Badges Start -->
<div align="center">
  
${badgeMarkdown}

</div>
<!-- Badges End -->
    `.trim();
  }

  async saveBadges() {
    const badges = await this.generateAllBadges();
    
    // Save badge URLs as JSON
    fs.writeFileSync(
      '.github/badges/badges.json',
      JSON.stringify(badges, null, 2)
    );

    // Generate markdown snippet
    const markdown = this.generateMarkdown(badges);
    fs.writeFileSync('.github/badges/badges.md', markdown);

    console.log(`Generated ${badges.length} badges successfully!`);
    return badges;
  }

  // Generate a special badge for milestones
  generateMilestoneBadge(milestone) {
    const milestoneColors = {
      'first_pr': 'success',
      'first_star': 'yellow',
      '100_commits': 'blue',
      '1k_contributions': 'brightgreen',
      '50_repos': 'orange',
      '100_followers': 'ff69b4'
    };

    return this.generateBadgeUrl(
      '🎉 Milestone',
      milestone.replace(/_/g, ' '),
      milestoneColors[milestone] || 'lightgrey',
      'for-the-badge'
    );
  }
}

// Create badges directory if it doesn't exist
if (!fs.existsSync('.github/badges')) {
  fs.mkdirSync('.github/badges', { recursive: true });
}

// Run if called directly
if (require.main === module) {
  const generator = new BadgeGenerator();
  generator.saveBadges().catch(console.error);
}

module.exports = BadgeGenerator;