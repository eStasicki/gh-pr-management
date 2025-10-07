# GitHub Setup Instructions

## 1. Enable GitHub Pages

1. Go to your repository **Settings**
2. Scroll down to **Pages** section
3. Under **Source**, select **GitHub Actions**
4. Save the settings

## 2. Add Repository Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

### Required Secrets:

- **`GITHUB_TOKEN`** - Your GitHub Personal Access Token

  - Generate at: https://github.com/settings/tokens
  - Required scopes: `repo`, `workflow`, `write:packages`

- **`REPO_OWNER`** - Your GitHub username or organization name

- **`REPO_NAME`** - Repository name

### Optional Secrets:

- **`GITHUB_ENTERPRISE_URL`** - GitHub Enterprise URL (leave empty for github.com)

## 3. Verify Setup

1. Push changes to `main` branch
2. Go to **Actions** tab to see the workflow running
3. Once completed, your site will be available at:
   `https://your-username.github.io/your-repository-name`

## 4. Troubleshooting

### Common Issues:

**"The process '/usr/bin/git' failed with exit code 128"**

- Make sure GitHub Pages is enabled with "GitHub Actions" as source
- Check that all required secrets are added
- Verify the workflow has proper permissions

**"Resource not accessible by integration"**

- Check that `GITHUB_TOKEN` has required scopes
- Ensure the token is not expired

**"Environment 'github-pages' not found"**

- Enable GitHub Pages first (step 1)
- Wait a few minutes after enabling

### Debug Steps:

1. Check the **Actions** tab for detailed error logs
2. Verify all secrets are correctly named and have values
3. Make sure the repository is public (for free GitHub Pages)
4. Check if GitHub Pages is properly configured in Settings

## 5. Security Notes

- Never commit real tokens to the repository
- Use repository secrets for sensitive data
- The `config.json` file is generated automatically and contains your secrets
- Consider using environment-specific tokens with limited scopes
