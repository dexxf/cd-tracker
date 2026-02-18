# CodeTracker — Demo

This is a small demo website built from the provided project proposal. It includes:

- A dark-themed UI showing the proposal text.
- A GitHub Repo Analyzer: paste a public repository URL (or owner/repo) and click Analyze to fetch basic repository data, contributors, and recent commits via the GitHub public API.
- A simple Assignments manager for professors (stored in browser `localStorage`) to add/delete assignments.

How to run

1. Open `index.html` in your browser (double-click or file -> open).
2. In the "GitHub Repo Analyzer" paste a public repo (example: `octocat/Hello-World` or `https://github.com/octocat/Hello-World`) and click Analyze.
3. Create assignments with the form on the right and they will be persisted locally in your browser.

Overview panel

- After analyzing a repository, open the **Overview** tab. The demo will aggregate commits from the last 28 days to render an activity heatmap (weekday rows + counts) and will list branches with recent commits (up to 5 per branch).
- If a repository is not analyzed yet, the Overview displays sample/demo data.

Demo button

- Click the **Load Demo** button in the header to populate the site with demo data: Overview (heatmap + branches), Assignments, Activity Timeline, Analytics, and Feedback.

Notes

- The analyzer uses the unauthenticated GitHub REST API — it is subject to public rate limits.
- For heavy use, provide a GitHub token in the code (not included in this demo) and add it to `fetch` Authorization headers.
