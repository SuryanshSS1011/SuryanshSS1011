# 📚 GitHub Profile Automation Guide

This guide documents all CI/CD workflows and automation scripts in this repository.

## 🎯 Quick Overview

**Purpose**: Automated GitHub profile management with milestone tracking, activity summaries, and quality assurance.

**Key Point**: These automations DO NOT modify your README unless you explicitly add comment markers.

## 📁 Project Structure

```bash
.github/
├── workflows/
│   ├── profile-automation.yml      # Main automation workflow
│   ├── milestone-celebrations.yml  # Achievement tracking
│   ├── activity-summaries.yml     # Weekly/monthly reports
│   └── profile-tests.yml          # Quality assurance
├── scripts/
│   ├── readme-updater.js          # README update logic
│   └── badge-generator.js         # Dynamic badge creation
└── milestones/                    # Achievement history (auto-created)
    └── history.json              # Milestone tracking data

summaries/                         # Activity reports (auto-created)
└── 2025/
    ├── weekly-2025-01-03.md      # Weekly summaries
    └── monthly-2025-01-01.md     # Monthly summaries
```

## 🔄 Workflow Details

### 1. Profile Automation (`profile-automation.yml`)

**Schedule**: Every 6 hours + on push to main  
**Timezone**: Eastern Time (America/New_York)

**Features**:
- Updates README sections (only if markers exist)
- Generates dynamic badges
- Creates milestone celebration issues
- Produces weekly summaries

**Dependencies**:
- Node.js 20
- Python 3.x
- NPM packages: As defined in package.json
- Python packages: requests, beautifulsoup4, PyGithub, pytz

**Key Jobs**:
- `update-readme`: Fetches recent GitHub activity
- `generate-badges`: Creates custom badge URLs
- `celebrate-milestones`: Checks for achievement unlocks
- `weekly-summary`: Generates activity reports (Sundays)

### 2. Milestone Celebrations (`milestone-celebrations.yml`)

**Schedule**: Daily at noon + on push to main  
**Timezone**: Eastern Time

**Tracked Milestones**:
```javascript
// Repository milestones
- 10, 25, 50, 100 repositories

// Star milestones  
- 50, 100, 500, 1000 total stars

// Follower milestones
- 50, 100, 500 followers
```

**Actions**:
- Creates celebration issues with milestone details
- Maintains achievement history in `.github/milestones/history.json`
- Generates achievement badges

### 3. Activity Summaries (`activity-summaries.yml`)

**Schedule**:
- Weekly: Sundays at midnight
- Monthly: First day of month at midnight
- Manual trigger with period selection

**Report Contents**:
- Commit, PR, Issue, and Review counts
- Most active day/hour analysis
- Language usage statistics
- Activity distribution charts
- Goals for next period

**Output Locations**:
- Files: `summaries/YYYY/period-YYYY-MM-DD.md`
- Monthly issues: Created automatically with 'summary' label

### 4. Profile Tests (`profile-tests.yml`)

**Schedule**: Daily + on every push/PR

**Test Categories**:

1. **README Validation**
   - Required sections check
   - Markdown linting
   - Link validation

2. **Script Testing**
   - Unit tests for automation scripts
   - Integration tests

3. **Security Scanning**
   - Secret detection
   - Dependency vulnerabilities

4. **Performance Testing**
   - Script execution time limits
   - File size checks

## 📝 Script Functions

### `readme-updater.js`

**Purpose**: Updates README sections between comment markers

**Functions**:
- `updateRecentActivity()`: Fetches and formats recent GitHub events
- `updateStats()`: Updates statistics section
- `updateTimestamp()`: Updates "Last updated" timestamp
- `updateSection()`: Generic section updater

**Required Markers** (add to README to enable):
```markdown
<!-- Recent Activity Start -->
<!-- Recent Activity End -->

<!-- Stats Start -->
<!-- Stats End -->

<!-- Summaries Start -->
<!-- Summaries End -->
```

### `badge-generator.js`

**Purpose**: Creates dynamic badge URLs using shields.io

**Generated Badges**:
- Repository count
- Total stars
- Followers
- Yearly contributions
- Current streak
- Top 3 languages
- Profile views

**Color Thresholds**:
- High (green): Repos 50+, Stars 500+, Followers 200+
- Medium (yellow): Repos 20+, Stars 100+, Followers 50+
- Low (orange): Below medium thresholds

## 🛠️ Configuration

### Environment Variables

All workflows use:
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- `TZ: 'America/New_York'`: Eastern Time for all date operations

### Package Dependencies

```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "markdownlint-cli": "^0.37.0"
  }
}
```

### Python Dependencies

```text
requests
beautifulsoup4
PyGithub
pytz
```

## 🚀 Usage Instructions

### Enable Specific Features

1. **Enable README Updates**:
   Add comment markers to your README where you want auto-updates:
   ```markdown
   ## Recent Activity
   <!-- Recent Activity Start -->
   <!-- Recent Activity End -->
   ```

2. **View Summaries**:
   Check `summaries/` directory after workflows run

3. **Track Milestones**:
   Watch for celebration issues in your repo

### Manual Triggers

All workflows support `workflow_dispatch` for manual runs:

1. Go to Actions tab
2. Select workflow
3. Click "Run workflow"
4. Choose options (if available)

### Customize Milestones

Edit thresholds in `milestone-celebrations.yml`:
```javascript
{ id: 'repos_10', value: repos.length, threshold: 10, message: '🎉 10 Repositories!' }
```

### Add New Tests

Add test files to `.github/tests/` and update `profile-tests.yml`

## 🔧 Maintenance

### Check Workflow Status
```bash
# View recent workflow runs
gh run list --limit 10

# View specific workflow details
gh run view [run-id]
```

### Update Dependencies
```bash
# Update Node dependencies
npm update

# Regenerate package-lock.json
npm install
```

### Debug Failed Workflows

1. Check Actions tab for error logs
2. Common issues:
   - API rate limits: Reduce frequency or add caching
   - Permission errors: Check GITHUB_TOKEN permissions
   - Timezone issues: Verify TZ environment variable

## 📊 Data Storage

### Milestone History Format
```json
{
  "repos_25": {
    "achieved": "1/3/2025, 12:00:00 PM",
    "value": 25
  }
}
```

### Summary File Naming
- Weekly: `weekly-YYYY-MM-DD.md`
- Monthly: `monthly-YYYY-MM-DD.md`
- Yearly: `yearly-YYYY-MM-DD.md`

## 🚨 Important Notes

1. **README Safety**: Workflows only modify README if comment markers exist
2. **Rate Limits**: GitHub API has rate limits; workflows are scheduled to avoid hitting them
3. **Commit Messages**: Automated commits use `[skip ci]` to prevent infinite loops
4. **Eastern Time**: All timestamps and calculations use America/New_York timezone
5. **Manual Intervention**: All automations can be manually triggered or disabled

## 🐛 Troubleshooting

### Workflow Not Running
- Check if workflow file syntax is valid
- Verify branch protection rules
- Ensure actions are enabled for the repository

### README Not Updating
- Verify comment markers exist and match exactly
- Check workflow logs for errors
- Ensure file permissions are correct

### Milestone Not Triggering
- Check `.github/milestones/history.json` for existing records
- Verify threshold values in workflow
- Ensure statistics are being calculated correctly

### Timezone Issues
- All workflows use Eastern Time (ET)
- Date comparisons account for timezone differences
- All data calculations reset at midnight ET

---

Last Updated: August 2025