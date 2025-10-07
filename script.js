class GitHubPRManager {
  constructor() {
    // SECURITY: Load config with encryption/decryption
    this.config = this.loadSecureConfig();
    this.language = localStorage.getItem("language") || "pl";
    this.prs = [];
    this.selectedPRs = [];
    this.labels = [];
    this.currentUser = null;
    // Always show only user's PRs for security

    this.init();
  }

  // SECURITY: Simple encryption/decryption for sensitive data
  encrypt(text) {
    // Simple base64 encoding (not real encryption, but better than plain text)
    return btoa(encodeURIComponent(text));
  }

  decrypt(encryptedText) {
    try {
      return decodeURIComponent(atob(encryptedText));
    } catch (e) {
      return "";
    }
  }

  // SECURITY: Load config with decryption
  loadSecureConfig() {
    // Clean up old unencrypted data
    this.cleanupOldData();

    return {
      token: this.decrypt(localStorage.getItem("gh_token_enc") || ""),
      owner: localStorage.getItem("repo_owner") || "", // Not sensitive
      repo: localStorage.getItem("repo_name") || "", // Not sensitive
      enterpriseUrl: localStorage.getItem("github_enterprise_url") || "", // Not sensitive
    };
  }

  // SECURITY: Clean up old unencrypted data
  cleanupOldData() {
    // Remove old unencrypted token if it exists
    if (localStorage.getItem("github_token")) {
      localStorage.removeItem("github_token");
      console.log("Cleaned up old unencrypted token");
    }
  }

  // SECURITY: Save config with encryption
  saveSecureConfig(config) {
    // Encrypt sensitive data
    localStorage.setItem("gh_token_enc", this.encrypt(config.token));

    // Store non-sensitive data normally
    localStorage.setItem("repo_owner", config.owner);
    localStorage.setItem("repo_name", config.repo);
    localStorage.setItem("github_enterprise_url", config.enterpriseUrl);
  }

  getApiBaseUrl() {
    if (this.config.enterpriseUrl) {
      // GitHub Enterprise
      return this.config.enterpriseUrl.replace(/\/$/, "") + "/api/v3";
    } else {
      // Regular GitHub
      return "https://api.github.com";
    }
  }

  async loadAllPRs() {
    const allPRs = [];
    let page = 1;
    const perPage = 100; // Maximum per page

    // Update loading message
    const loadingEl = document.querySelector("#loading p");
    if (loadingEl) {
      loadingEl.textContent = this.translations[this.language].loading_all_prs;
    }

    while (true) {
      console.log(`Loading PRs page ${page}...`);

      // Update progress
      if (loadingEl) {
        loadingEl.textContent = `${
          this.translations[this.language].loading_page
        } ${page} (${allPRs.length} loaded)`;
      }

      const response = await fetch(
        `${this.getApiBaseUrl()}/repos/${this.config.owner}/${
          this.config.repo
        }/pulls?state=open&page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `token ${this.config.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const prs = await response.json();

      if (prs.length === 0) {
        // No more PRs
        break;
      }

      // Filter to only include truly open PRs (not merged/closed)
      const openPRs = prs.filter((pr) => pr.state === "open" && !pr.merged_at);
      allPRs.push(...openPRs);

      console.log(
        `Page ${page}: ${prs.length} total, ${openPRs.length} open PRs`
      );
      console.log(
        `Loaded ${openPRs.length} open PRs from page ${page}, total: ${allPRs.length}`
      );

      if (prs.length < perPage) {
        // Last page
        break;
      }

      page++;
    }

    console.log(`Total PRs loaded: ${allPRs.length}`);
    return allPRs;
  }

  init() {
    this.setupEventListeners();
    this.loadTranslations();
    this.applyLanguage();

    if (this.config.token && this.config.owner && this.config.repo) {
      this.showMainSection();
      this.loadPRs();
    } else {
      this.showConfigSection();
    }
  }

  setupEventListeners() {
    // Language switcher
    document
      .getElementById("lang-pl")
      .addEventListener("click", () => this.setLanguage("pl"));
    document
      .getElementById("lang-en")
      .addEventListener("click", () => this.setLanguage("en"));

    // Config
    document
      .getElementById("save-config")
      .addEventListener("click", () => this.saveConfig());

    // Main actions
    document
      .getElementById("refresh-prs")
      .addEventListener("click", () => this.loadPRs());
    document
      .getElementById("change-all-base")
      .addEventListener("click", () => this.showBaseBranchModal());
    document
      .getElementById("change-base-labels")
      .addEventListener("click", () => this.showBaseBranchModal(true));
    document
      .getElementById("change-specific-base")
      .addEventListener("click", () => this.showBaseBranchModal(false, true));
    document
      .getElementById("manage-labels")
      .addEventListener("click", () => this.showLabelsModal());

    // Modals
    document
      .getElementById("confirm-base-change")
      .addEventListener("click", () => this.confirmBaseChange());
    document
      .getElementById("confirm-label-action")
      .addEventListener("click", () => this.confirmLabelAction());

    // Close modals
    document.querySelectorAll(".close").forEach((closeBtn) => {
      closeBtn.addEventListener("click", (e) => {
        e.target.closest("[id$='-modal']").classList.add("hidden");
      });
    });

    // Click outside modal to close
    window.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("fixed") &&
        e.target.classList.contains("inset-0")
      ) {
        e.target.classList.add("hidden");
      }
    });

    // Logout
    document
      .getElementById("logout")
      .addEventListener("click", () => this.logout());

    // No filter buttons - always show only user's PRs for security
  }

  loadTranslations() {
    this.translations = {
      pl: {
        config_title: "Konfiguracja",
        github_token_label: "GitHub Personal Access Token:",
        github_token_help: "Potrzebny do autoryzacji z GitHub API",
        repo_owner_label: "Właściciel repozytorium:",
        repo_name_label: "Nazwa repozytorium:",
        github_enterprise_url_label: "GitHub Enterprise URL (opcjonalne):",
        github_enterprise_url_help:
          "Zostaw puste dla zwykłego GitHub (github.com)",
        save_config: "Zapisz konfigurację",
        logged_as: "Zalogowany jako:",
        logout: "Wyloguj",
        open_prs: "Otwarte Pull Requesty",
        my_prs: "Moje Pull Requesty",
        secure_mode: "Tryb bezpieczny - tylko Twoje PR",
        search_prs: "Szukaj PR...",
        refresh: "Odśwież",
        actions: "Akcje",
        change_all_base: "Zmień base-branch wszystkim PR",
        change_base_labels: "Zmień base-branch i zarządzaj labelami",
        change_specific_base: "Zmień base-branch dla wybranego PR",
        manage_labels: "Zarządzaj labelami",
        change_base_branch: "Zmień base branch",
        new_base_branch: "Nowy base branch:",
        select_prs: "Wybierz PR:",
        confirm: "Potwierdź",
        label_action: "Akcja:",
        add_label: "Dodaj label",
        remove_label: "Usuń label",
        replace_label: "Zamień label",
        label_name: "Nazwa labela:",
        loading: "Ładowanie...",
        loading_all_prs: "Ładowanie wszystkich PR...",
        loading_page: "Ładowanie PR... strona",
        success: "Sukces!",
        error: "Błąd!",
        pr_updated: "PR został zaktualizowany",
        base_changed: "Base branch zmieniony na",
        label_added: "Label dodany",
        label_removed: "Label usunięty",
        select_pr_first: "Wybierz PR najpierw",
        enter_base_branch: "Wprowadź nowy base branch",
        enter_label_name: "Wprowadź nazwę labela",
      },
      en: {
        config_title: "Configuration",
        github_token_label: "GitHub Personal Access Token:",
        github_token_help: "Required for GitHub API authorization",
        repo_owner_label: "Repository owner:",
        repo_name_label: "Repository name:",
        github_enterprise_url_label: "GitHub Enterprise URL (optional):",
        github_enterprise_url_help:
          "Leave empty for regular GitHub (github.com)",
        save_config: "Save configuration",
        logged_as: "Logged in as:",
        logout: "Logout",
        open_prs: "Open Pull Requests",
        my_prs: "My Pull Requests",
        secure_mode: "Secure mode - only your PRs",
        search_prs: "Search PRs...",
        refresh: "Refresh",
        actions: "Actions",
        change_all_base: "Change base-branch for all PRs",
        change_base_labels: "Change base-branch and manage labels",
        change_specific_base: "Change base-branch for selected PR",
        manage_labels: "Manage labels",
        change_base_branch: "Change base branch",
        new_base_branch: "New base branch:",
        select_prs: "Select PRs:",
        confirm: "Confirm",
        label_action: "Action:",
        add_label: "Add label",
        remove_label: "Remove label",
        replace_label: "Replace label",
        label_name: "Label name:",
        loading: "Loading...",
        loading_all_prs: "Loading all PRs...",
        loading_page: "Loading PRs... page",
        success: "Success!",
        error: "Error!",
        pr_updated: "PR has been updated",
        base_changed: "Base branch changed to",
        label_added: "Label added",
        label_removed: "Label removed",
        select_pr_first: "Select PR first",
        enter_base_branch: "Enter new base branch",
        enter_label_name: "Enter label name",
      },
    };
  }

  setLanguage(lang) {
    this.language = lang;
    localStorage.setItem("language", lang);
    this.applyLanguage();
  }

  applyLanguage() {
    document.querySelectorAll("[data-translate]").forEach((element) => {
      const key = element.getAttribute("data-translate");
      element.textContent = this.translations[this.language][key] || key;
    });

    document
      .querySelectorAll("[data-translate-placeholder]")
      .forEach((element) => {
        const key = element.getAttribute("data-translate-placeholder");
        element.placeholder = this.translations[this.language][key] || key;
      });

    // Update language buttons
    document
      .querySelectorAll(".lang-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document.getElementById(`lang-${this.language}`).classList.add("active");
  }

  showConfigSection() {
    document.getElementById("config-section").classList.remove("hidden");
    document.getElementById("main-section").classList.add("hidden");
  }

  showMainSection() {
    document.getElementById("config-section").classList.add("hidden");
    document.getElementById("main-section").classList.remove("hidden");
  }

  async saveConfig() {
    const token = document.getElementById("github-token").value;
    const owner = document.getElementById("repo-owner").value;
    const repo = document.getElementById("repo-name").value;
    const enterpriseUrl = document.getElementById(
      "github-enterprise-url"
    ).value;

    if (!token || !owner || !repo) {
      this.showMessage("Wprowadź wszystkie wymagane pola", "error");
      return;
    }

    this.config = { token, owner, repo, enterpriseUrl };

    // SECURITY: Save config with encryption
    this.saveSecureConfig(this.config);

    this.showMessage("Konfiguracja zapisana", "success");
    this.showMainSection();
    await this.loadPRs();
  }

  async loadPRs() {
    this.showLoading(true);
    try {
      // First, get current user info to filter PRs by author
      const userResponse = await fetch(`${this.getApiBaseUrl()}/user`, {
        headers: {
          Authorization: `token ${this.config.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!userResponse.ok) {
        throw new Error(
          `HTTP ${userResponse.status}: ${userResponse.statusText}`
        );
      }

      const currentUser = await userResponse.json();
      this.currentUser = currentUser.login;

      console.log("Current user:", this.currentUser);

      // Update UI with current user
      document.getElementById("user-login").textContent = this.currentUser;

      // Load ALL PRs with pagination
      this.prs = await this.loadAllPRs();

      console.log("All PRs loaded:", this.prs.length);
      console.log(
        "PR authors:",
        this.prs.map((pr) => pr.user.login)
      );
      console.log(
        "My PRs:",
        this.prs.filter((pr) => pr.user.login === this.currentUser).length
      );

      this.renderPRs();
      await this.loadLabels();
    } catch (error) {
      this.showMessage(`Błąd ładowania PR: ${error.message}`, "error");
    } finally {
      this.showLoading(false);
    }
  }

  async loadLabels() {
    try {
      const response = await fetch(
        `${this.getApiBaseUrl()}/repos/${this.config.owner}/${
          this.config.repo
        }/labels`,
        {
          headers: {
            Authorization: `token ${this.config.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (response.ok) {
        this.labels = await response.json();
      }
    } catch (error) {
      console.error("Error loading labels:", error);
    }
  }

  renderPRs() {
    const prList = document.getElementById("pr-list");
    const searchTerm = document.getElementById("pr-search").value.toLowerCase();

    // Always filter to show only user's PRs for security
    let filteredPRs = this.prs;

    // SECURITY: Always filter to show only current user's PRs
    if (this.currentUser) {
      filteredPRs = filteredPRs.filter(
        (pr) => pr.user.login === this.currentUser
      );
    } else {
      // If no current user, show no PRs for security
      filteredPRs = [];
    }

    // ADDITIONAL FILTER: Only show truly open PRs (not merged/closed)
    filteredPRs = filteredPRs.filter(
      (pr) => pr.state === "open" && !pr.merged_at
    );

    // Apply search filter
    filteredPRs = filteredPRs.filter(
      (pr) =>
        pr.title.toLowerCase().includes(searchTerm) ||
        pr.number.toString().includes(searchTerm)
    );

    // Show count information
    const totalPRs = this.prs.length;
    const myPRsCount = this.prs.filter(
      (pr) => pr.user.login === this.currentUser
    ).length;
    const showingCount = filteredPRs.length;

    // Update count display
    const countInfo = document.getElementById("pr-count");
    if (countInfo) {
      countInfo.textContent = `Showing ${showingCount} of ${totalPRs} PRs`;
    }

    prList.innerHTML = filteredPRs
      .map(
        (pr) => `
             <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-5 transition-all duration-300 cursor-pointer hover:border-primary-500 hover:-translate-y-0.5 hover:shadow-lg" data-pr-number="${
               pr.number
             }" onclick="this.classList.toggle('border-primary-500', 'bg-blue-50')">
                 <div class="flex justify-between items-start mb-3">
                     <div class="font-semibold text-gray-800 text-lg pr-4">${
                       pr.title
                     }</div>
                     <div class="bg-primary-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex-shrink-0">#${
                       pr.number
                     }</div>
                 </div>
                     <div class="flex gap-4 mb-3 text-sm text-gray-500">
                         <span>Base: ${pr.base.ref}</span>
                         <span class="font-semibold ${
                           pr.user.login === this.currentUser
                             ? "text-primary-600"
                             : "text-gray-500"
                         }">Author: ${pr.user.login}</span>
                         <span class="px-2 py-1 rounded text-xs font-medium ${
                           pr.state === "open"
                             ? "bg-green-100 text-green-800"
                             : "bg-gray-100 text-gray-800"
                         }">${pr.state.toUpperCase()}</span>
                         <span>Updated: ${new Date(
                           pr.updated_at
                         ).toLocaleDateString()}</span>
                     </div>
                 <div class="flex flex-wrap gap-2">
                     ${pr.labels
                       .map(
                         (label) =>
                           `<span class="px-2 py-1 rounded-md text-xs font-medium text-white" style="background-color: #${label.color}">${label.name}</span>`
                       )
                       .join("")}
                 </div>
             </div>
         `
      )
      .join("");
  }

  showBaseBranchModal(manageLabels = false, specificOnly = false) {
    const modal = document.getElementById("base-branch-modal");
    const prSelection = document.getElementById("pr-selection");

    // SECURITY: Only show user's PRs in selection
    const userPRs = this.prs.filter((pr) => pr.user.login === this.currentUser);
    prSelection.innerHTML = userPRs
      .map(
        (pr) =>
          `<option value="${pr.number}">#${pr.number} - ${pr.title}</option>`
      )
      .join("");

    if (specificOnly) {
      prSelection.setAttribute("multiple", "multiple");
    } else {
      prSelection.removeAttribute("multiple");
    }

    modal.classList.remove("hidden");
  }

  showLabelsModal() {
    const modal = document.getElementById("labels-modal");
    const prSelection = document.getElementById("label-pr-selection");

    // SECURITY: Only show user's PRs in selection
    const userPRs = this.prs.filter((pr) => pr.user.login === this.currentUser);
    prSelection.innerHTML = userPRs
      .map(
        (pr) =>
          `<option value="${pr.number}">#${pr.number} - ${pr.title}</option>`
      )
      .join("");

    modal.classList.remove("hidden");
  }

  async confirmBaseChange() {
    const newBase = document.getElementById("new-base-branch").value;
    const prNumbers = Array.from(
      document.getElementById("pr-selection").selectedOptions
    ).map((option) => option.value);

    // SECURITY: Double-check that all selected PRs belong to current user
    const userPRNumbers = this.prs
      .filter((pr) => pr.user.login === this.currentUser)
      .map((pr) => pr.number.toString());

    const invalidPRs = prNumbers.filter(
      (prNum) => !userPRNumbers.includes(prNum)
    );
    if (invalidPRs.length > 0) {
      this.showMessage("Nie możesz modyfikować cudzych PR!", "error");
      return;
    }

    if (!newBase) {
      this.showMessage(
        this.translations[this.language].enter_base_branch,
        "error"
      );
      return;
    }

    if (prNumbers.length === 0) {
      this.showMessage(
        this.translations[this.language].select_pr_first,
        "error"
      );
      return;
    }

    this.showLoading(true);

    try {
      for (const prNumber of prNumbers) {
        await this.updatePRBase(prNumber, newBase);
      }

      this.showMessage(
        `${this.translations[this.language].base_changed} ${newBase}`,
        "success"
      );
      document.getElementById("base-branch-modal").classList.add("hidden");
      await this.loadPRs();
    } catch (error) {
      this.showMessage(`Błąd aktualizacji PR: ${error.message}`, "error");
    } finally {
      this.showLoading(false);
    }
  }

  async confirmLabelAction() {
    const action = document.getElementById("label-action").value;
    const labelName = document.getElementById("label-name").value;
    const prNumbers = Array.from(
      document.getElementById("label-pr-selection").selectedOptions
    ).map((option) => option.value);

    // SECURITY: Double-check that all selected PRs belong to current user
    const userPRNumbers = this.prs
      .filter((pr) => pr.user.login === this.currentUser)
      .map((pr) => pr.number.toString());

    const invalidPRs = prNumbers.filter(
      (prNum) => !userPRNumbers.includes(prNum)
    );
    if (invalidPRs.length > 0) {
      this.showMessage("Nie możesz modyfikować cudzych PR!", "error");
      return;
    }

    if (!labelName) {
      this.showMessage(
        this.translations[this.language].enter_label_name,
        "error"
      );
      return;
    }

    if (prNumbers.length === 0) {
      this.showMessage(
        this.translations[this.language].select_pr_first,
        "error"
      );
      return;
    }

    this.showLoading(true);

    try {
      for (const prNumber of prNumbers) {
        await this.managePRLabel(prNumber, action, labelName);
      }

      this.showMessage(this.translations[this.language].label_added, "success");
      document.getElementById("labels-modal").classList.add("hidden");
      await this.loadPRs();
    } catch (error) {
      this.showMessage(`Błąd zarządzania labelami: ${error.message}`, "error");
    } finally {
      this.showLoading(false);
    }
  }

  async updatePRBase(prNumber, newBase) {
    // SECURITY: Check if PR belongs to current user
    const pr = this.prs.find((p) => p.number === prNumber);
    if (!pr || pr.user.login !== this.currentUser) {
      throw new Error("Nie możesz modyfikować cudzych PR!");
    }

    const response = await fetch(
      `${this.getApiBaseUrl()}/repos/${this.config.owner}/${
        this.config.repo
      }/pulls/${prNumber}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `token ${this.config.token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base: newBase,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  async managePRLabel(prNumber, action, labelName) {
    // SECURITY: Check if PR belongs to current user
    const pr = this.prs.find((p) => p.number === prNumber);
    if (!pr || pr.user.login !== this.currentUser) {
      throw new Error("Nie możesz modyfikować cudzych PR!");
    }

    const url = `${this.getApiBaseUrl()}/repos/${this.config.owner}/${
      this.config.repo
    }/issues/${prNumber}/labels`;

    let method, body;

    switch (action) {
      case "add":
        method = "POST";
        body = JSON.stringify({ labels: [labelName] });
        break;
      case "remove":
        method = "DELETE";
        url += `/${labelName}`;
        body = null;
        break;
      case "replace":
        // First get current labels, then replace
        const currentLabels = await this.getPRLabels(prNumber);
        const otherLabels = currentLabels.filter(
          (label) => label.name !== labelName
        );
        method = "PUT";
        body = JSON.stringify({
          labels: [...otherLabels.map((l) => l.name), labelName],
        });
        break;
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `token ${this.config.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  async getPRLabels(prNumber) {
    const response = await fetch(
      `${this.getApiBaseUrl()}/repos/${this.config.owner}/${
        this.config.repo
      }/issues/${prNumber}/labels`,
      {
        headers: {
          Authorization: `token ${this.config.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (response.ok) {
      return await response.json();
    }
    return [];
  }

  showLoading(show) {
    const loading = document.getElementById("loading");
    if (show) {
      loading.classList.remove("hidden");
    } else {
      loading.classList.add("hidden");
    }
  }

  showMessage(text, type = "info") {
    const messageEl = document.getElementById("message");
    messageEl.textContent = text;

    // Reset classes
    messageEl.className =
      "fixed top-5 right-5 z-50 px-5 py-4 rounded-lg text-white font-semibold max-w-sm shadow-lg";

    // Add type-specific classes
    if (type === "success") {
      messageEl.classList.add(
        "bg-gradient-to-r",
        "from-green-500",
        "to-green-600"
      );
    } else if (type === "error") {
      messageEl.classList.add("bg-gradient-to-r", "from-red-500", "to-red-600");
    } else {
      messageEl.classList.add(
        "bg-gradient-to-r",
        "from-primary-500",
        "to-primary-600"
      );
    }

    messageEl.classList.remove("hidden");

    setTimeout(() => {
      messageEl.classList.add("hidden");
    }, 5000);
  }

  // setFilter function removed - always show only user's PRs for security

  logout() {
    // SECURITY: Remove all stored data (including encrypted)
    localStorage.removeItem("gh_token_enc");
    localStorage.removeItem("repo_owner");
    localStorage.removeItem("repo_name");
    localStorage.removeItem("github_enterprise_url");
    this.config = { token: "", owner: "", repo: "", enterpriseUrl: "" };
    this.showConfigSection();
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  new GitHubPRManager();

  // Add search functionality
  document.getElementById("pr-search").addEventListener("input", () => {
    const manager = window.githubPRManager || new GitHubPRManager();
    manager.renderPRs();
  });
});
