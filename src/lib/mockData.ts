import type { GitHubPR, GitHubUser, GitHubLabel } from "$lib/types";

// Sample users
const mockUsers: GitHubUser[] = [
  {
    id: 1,
    login: "john_developer",
    name: "John Developer",
    avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
    html_url: "https://github.com/john_developer",
  },
  {
    id: 2,
    login: "jane_coder",
    name: "Jane Coder",
    avatar_url: "https://avatars.githubusercontent.com/u/2?v=4",
    html_url: "https://github.com/jane_coder",
  },
  {
    id: 3,
    login: "mike_engineer",
    name: "Mike Engineer",
    avatar_url: "https://avatars.githubusercontent.com/u/3?v=4",
    html_url: "https://github.com/mike_engineer",
  },
  {
    id: 4,
    login: "sarah_dev",
    name: "Sarah Developer",
    avatar_url: "https://avatars.githubusercontent.com/u/4?v=4",
    html_url: "https://github.com/sarah_dev",
  },
  {
    id: 5,
    login: "alex_programmer",
    name: "Alex Programmer",
    avatar_url: "https://avatars.githubusercontent.com/u/5?v=4",
    html_url: "https://github.com/alex_programmer",
  },
];

// Sample labels
const mockLabels: GitHubLabel[] = [
  {
    id: 1,
    name: "bug",
    color: "d73a4a",
    description: "Something isn't working",
  },
  {
    id: 2,
    name: "enhancement",
    color: "a2eeef",
    description: "New feature or request",
  },
  {
    id: 3,
    name: "documentation",
    color: "0075ca",
    description: "Improvements or additions to documentation",
  },
  {
    id: 4,
    name: "good first issue",
    color: "7057ff",
    description: "Good for newcomers",
  },
  {
    id: 5,
    name: "help wanted",
    color: "008672",
    description: "Extra attention is needed",
  },
  {
    id: 6,
    name: "priority: high",
    color: "ff0000",
    description: "High priority issue",
  },
  {
    id: 7,
    name: "priority: medium",
    color: "ffa500",
    description: "Medium priority issue",
  },
  {
    id: 8,
    name: "priority: low",
    color: "00ff00",
    description: "Low priority issue",
  },
  { id: 9, name: "frontend", color: "e99695", description: "Frontend related" },
  { id: 10, name: "backend", color: "c5def5", description: "Backend related" },
  {
    id: 11,
    name: "database",
    color: "f9d0c4",
    description: "Database related",
  },
  { id: 12, name: "testing", color: "d4c5f9", description: "Testing related" },
  {
    id: 13,
    name: "refactoring",
    color: "fef2c0",
    description: "Code refactoring",
  },
  {
    id: 14,
    name: "performance",
    color: "bfe5bf",
    description: "Performance improvement",
  },
  {
    id: 15,
    name: "security",
    color: "ff6b6b",
    description: "Security related",
  },
];

// Sample PR titles
const prTitles = [
  "Fix authentication bug in login flow",
  "Add dark mode support to dashboard",
  "Implement user profile management",
  "Optimize database queries for better performance",
  "Add unit tests for payment module",
  "Refactor API endpoints for consistency",
  "Fix memory leak in image processing",
  "Add internationalization support",
  "Implement real-time notifications",
  "Update dependencies to latest versions",
  "Add error handling for network failures",
  "Improve mobile responsiveness",
  "Fix validation issues in forms",
  "Add logging for debugging purposes",
  "Implement caching mechanism",
  "Update documentation for new features",
  "Fix security vulnerability in auth",
  "Add support for multiple languages",
  "Optimize bundle size",
  "Implement progressive web app features",
  "Add accessibility improvements",
  "Fix cross-browser compatibility issues",
  "Implement data export functionality",
  "Add search filters to user interface",
  "Fix performance issues in large datasets",
  "Implement backup and restore functionality",
  "Add monitoring and analytics",
  "Fix edge cases in payment processing",
  "Implement role-based access control",
  "Add support for file uploads",
  "Fix timezone handling issues",
  "Implement email notifications",
  "Add data validation on frontend",
  "Fix memory usage in background tasks",
  "Implement API rate limiting",
  "Add support for custom themes",
  "Fix issues with data synchronization",
  "Implement audit logging",
  "Add support for bulk operations",
  "Fix issues with file compression",
  "Implement advanced search functionality",
  "Add support for third-party integrations",
  "Fix issues with data migration",
  "Implement automated testing pipeline",
  "Add support for custom fields",
  "Fix issues with data export",
  "Implement advanced reporting features",
  "Add support for workflow automation",
  "Fix issues with data import",
  "Implement advanced security features",
];

// Sample base branches
const baseBranches = ["main", "develop", "master", "staging", "production"];

// Funkcja do generowania losowej daty
function getRandomDate(start: Date, end: Date): string {
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return date.toISOString();
}

// Function to randomly select items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Function to generate sample PRs
export function generateMockPRs(count: number = 50): GitHubPR[] {
  const prs: GitHubPR[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    const labels = getRandomItems(
      mockLabels,
      Math.floor(Math.random() * 4) + 1
    );
    const baseBranch =
      baseBranches[Math.floor(Math.random() * baseBranches.length)];
    const createdDate = getRandomDate(sixMonthsAgo, now);
    const updatedDate = getRandomDate(new Date(createdDate), now);

    const pr: GitHubPR = {
      number: 1000 + i,
      title: prTitles[i % prTitles.length],
      state: "open",
      merged_at: null,
      created_at: createdDate,
      updated_at: updatedDate,
      html_url: `https://github.com/example/repo/pull/${1000 + i}`,
      user: user,
      base: {
        ref: baseBranch,
      },
      labels: labels,
    };

    prs.push(pr);
  }

  return prs;
}

// Sample user for demo
export const mockCurrentUser: GitHubUser = {
  id: 1,
  login: "john_developer",
  name: "John Developer",
  avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
  html_url: "https://github.com/john_developer",
};

// Sample labels for demo
export { mockLabels };
