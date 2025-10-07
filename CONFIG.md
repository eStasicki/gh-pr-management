# Configuration

## How it works

The application uses a streamlined configuration system:

1. **Development**: Use `.env` file → automatically generates `config.json`
2. **Production**: GitHub Actions generates `config.json` from repository secrets
3. **Application**: Always reads from `config.json`

## Development Setup

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in your values in `.env`:

   ```env
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   REPO_OWNER=username
   REPO_NAME=repository-name
   GITHUB_ENTERPRISE_URL=
   ```

3. Start development server (automatically converts `.env` to `config.json`):
   ```bash
   npm run dev
   ```

## Production Setup

GitHub Actions automatically generates `config.json` from repository secrets - no manual configuration needed.

### Configuration Fields

- **GITHUB_TOKEN** (required): Your GitHub Personal Access Token

  - Generate at: https://github.com/settings/tokens
  - Required scopes: `repo` (for private repos) or `public_repo` (for public repos)

- **REPO_OWNER** (required): GitHub username or organization name

- **REPO_NAME** (required): Repository name

- **GITHUB_ENTERPRISE_URL** (optional): GitHub Enterprise URL
  - Leave empty for regular GitHub (github.com)
  - Example: `https://github.company.com`

### Behavior

- If `config.json` contains all required fields (token, owner, repo), the application will automatically log you in
- If some fields are missing, the configuration form will be pre-filled with available values
- If no `config.json` exists, the application will show the empty configuration form
- User can always override the default values by manually entering them in the form

### GitHub Actions Integration

The repository includes a GitHub Actions workflow that automatically generates `config.json` from repository secrets:

1. Go to your repository settings → Secrets and variables → Actions
2. Add the following secrets:

   - `GITHUB_TOKEN`: Your GitHub Personal Access Token
   - `REPO_OWNER`: Repository owner/username
   - `REPO_NAME`: Repository name
   - `GITHUB_ENTERPRISE_URL`: (optional) GitHub Enterprise URL

3. The workflow will automatically generate `config.json` during deployment

### Local Development

For local development, use the `.env` file:

```bash
# Start development server
npm run dev
```

This will:

1. Convert `.env` to `config.json`
2. Start a local HTTP server on port 8000

### Security

- The token is stored encrypted in localStorage when saved through the UI
- The `.env` file should not be committed to version control (it's in .gitignore)
- The `config.json` file should not be committed to version control if it contains sensitive data
- Use GitHub Secrets for production deployments
