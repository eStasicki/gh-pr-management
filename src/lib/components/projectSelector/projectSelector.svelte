<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import {
    currentProject,
    allProjects,
    loadAllProjects,
    switchProject,
  } from "$lib/stores/config";
  import { projectsService, type Project } from "$lib/services/projectsService";
  import AddProjectModal from "./internal/addProjectModal.svelte";
  import RenameProjectModal from "./internal/renameProjectModal.svelte";
  import SwitchProjectModal from "./internal/switchProjectModal.svelte";
  import DeleteProjectModal from "./internal/deleteProjectModal.svelte";

  let t = translations.pl;
  let showAddModal = false;
  let showRenameModal = false;
  let showSwitchModal = false;
  let showDeleteModal = false;
  let projectToRename: Project | null = null;
  let projectToSwitch: Project | null = null;
  let projectToDelete: Project | null = null;
  let errorMessage = "";
  let successMessage = "";
  let isLoading = false;
  let showDropdown = false;
  let dropdownContainer: HTMLElement;

  $: if (browser) {
    t = translations[$language];
  }

  onMount(() => {
    loadAllProjects();
  });

  onMount(() => {
    if (browser) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      if (browser) {
        document.removeEventListener("click", handleClickOutside);
      }
    };
  });

  function handleSelectProject(project: Project) {
    if (project.id === $currentProject?.id) {
      return;
    }

    projectToSwitch = project;
    showSwitchModal = true;
    showDropdown = false;
  }

  async function handleSetAsActive(project: Project) {
    if (project.id === $currentProject?.id) {
      return;
    }

    isLoading = true;
    errorMessage = "";

    try {
      await switchProject(project.id, false); // Switch without reloading data
      successMessage = t.project_switched.replace(
        "{name}",
        project.project_name
      );
      setTimeout(() => {
        successMessage = "";
      }, 3000);
      showDropdown = false;
    } catch (error: unknown) {
      errorMessage =
        error instanceof Error ? error.message : "Failed to switch project";
    } finally {
      isLoading = false;
    }
  }

  async function handleProjectClick(project: Project) {
    if (project.id === $currentProject?.id) {
      showDropdown = false;
      return;
    }

    await handleSetAsActive(project);
  }

  function handleClickOutside(event: MouseEvent) {
    if (
      dropdownContainer &&
      !dropdownContainer.contains(event.target as Node)
    ) {
      showDropdown = false;
    }
  }

  async function handleSwitchProject(reloadData: boolean) {
    if (!projectToSwitch) return;

    isLoading = true;
    errorMessage = "";

    try {
      await switchProject(projectToSwitch.id, reloadData);
      successMessage = t.project_switched.replace(
        "{name}",
        projectToSwitch.project_name
      );
      setTimeout(() => {
        successMessage = "";
      }, 3000);
      showSwitchModal = false;
      projectToSwitch = null;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Failed to switch project";
    } finally {
      isLoading = false;
    }
  }

  function handleAddProject() {
    showAddModal = true;
  }

  async function handleCreateProject(event: CustomEvent) {
    const { projectName, config } = event.detail;

    isLoading = true;
    errorMessage = "";

    try {
      const setAsActive = $allProjects.length === 0;
      await projectsService.createProject(
        {
          project_name: projectName,
          ...config,
        },
        setAsActive
      );

      await loadAllProjects();

      if (setAsActive) {
        const activeProject = await projectsService.getActiveProject();
        if (activeProject) {
          await switchProject(activeProject.id, false);
        }
      }

      successMessage = t.project_created;
      setTimeout(() => {
        successMessage = "";
      }, 3000);
      showAddModal = false;
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes("already exists")) {
        errorMessage = t.project_already_exists;
      } else {
        errorMessage =
          error instanceof Error ? error.message : "Failed to create project";
      }
    } finally {
      isLoading = false;
    }
  }

  function handleRenameProject(project: Project) {
    projectToRename = project;
    showRenameModal = true;
  }

  async function handleRenameConfirm(event: CustomEvent) {
    if (!projectToRename) return;

    const { newName } = event.detail;

    isLoading = true;
    errorMessage = "";

    try {
      await projectsService.renameProject(projectToRename.id, newName);
      await loadAllProjects();

      // Update currentProject if the renamed project is currently active
      if (projectToRename.id === $currentProject?.id) {
        const updatedProject = await projectsService.getActiveProject();
        if (updatedProject) {
          currentProject.set(updatedProject);
        }
      }

      successMessage = t.project_updated;
      setTimeout(() => {
        successMessage = "";
      }, 3000);
      showRenameModal = false;
      projectToRename = null;
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes("already exists")) {
        errorMessage = t.project_already_exists;
      } else {
        errorMessage =
          error instanceof Error ? error.message : "Failed to rename project";
      }
    } finally {
      isLoading = false;
    }
  }

  function handleDeleteProject(project: Project) {
    projectToDelete = project;
    showDeleteModal = true;
  }

  async function handleDeleteConfirm() {
    if (!projectToDelete) return;

    isLoading = true;
    errorMessage = "";

    try {
      await projectsService.deleteProject(projectToDelete.id);
      await loadAllProjects();

      // Set a new active project if the deleted project was active
      if (projectToDelete.id === $currentProject?.id) {
        const remainingProjects = await projectsService.getAllProjects();
        if (remainingProjects.length > 0) {
          // Set the first remaining project as active (random selection as requested)
          await switchProject(remainingProjects[0].id, false);
        }
      }

      successMessage = t.project_deleted;
      setTimeout(() => {
        successMessage = "";
      }, 3000);
      showDeleteModal = false;
      projectToDelete = null;
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes("last project")) {
        errorMessage = t.cannot_delete_last_project;
      } else {
        errorMessage =
          error instanceof Error ? error.message : "Failed to delete project";
      }
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="bg-white rounded-2xl p-8 mb-6 shadow-2xl">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold text-gray-800">{t.projects_management}</h2>
    <button
      on:click={handleAddProject}
      disabled={isLoading}
      class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      {t.add_new_project}
    </button>
  </div>

  {#if errorMessage}
    <div
      class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
    >
      {errorMessage}
    </div>
  {/if}

  {#if successMessage}
    <div
      class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center"
    >
      <svg
        class="w-5 h-5 text-green-600 mr-3 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span class="font-medium">{successMessage}</span>
    </div>
  {/if}

  {#if $allProjects.length === 0}
    <div class="text-center py-8">
      <p class="text-gray-500 text-lg mb-4">{t.no_projects}</p>
      <p class="text-gray-400 text-sm">{t.create_first_project}</p>
    </div>
  {:else}
    <div class="space-y-4">
      <div>
        <div class="block text-sm font-semibold text-gray-700 mb-2">
          {t.select_project}:
        </div>
        <div class="relative" bind:this={dropdownContainer}>
          <button
            on:click={() => (showDropdown = !showDropdown)}
            disabled={isLoading}
            class="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:border-gray-300"
          >
            <span class="text-left">
              {#if $currentProject}
                <span class="font-semibold text-gray-800"
                  >{$currentProject.project_name}</span
                >
                <span class="text-gray-500 ml-2"
                  >({$currentProject.repo_owner}/{$currentProject.repo_name})</span
                >
              {:else}
                <span class="text-gray-500">{t.select_project}</span>
              {/if}
            </span>
            <svg
              class="w-5 h-5 text-gray-400 transition-transform duration-200 {showDropdown
                ? 'rotate-180'
                : ''}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          {#if showDropdown}
            <div
              class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {#each $allProjects as project (project.id)}
                <div
                  on:click={() => handleProjectClick(project)}
                  class="px-4 py-3 hover:bg-gray-50 transition-colors duration-150 cursor-pointer {project.id ===
                  $currentProject?.id
                    ? 'bg-blue-50'
                    : ''} {isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleProjectClick(project);
                    }
                  }}
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div>
                        <div
                          class="font-semibold {project.id ===
                          $currentProject?.id
                            ? 'text-blue-700'
                            : 'text-gray-700'}"
                        >
                          {project.project_name}
                        </div>
                        <div class="text-sm text-gray-500">
                          {project.repo_owner}/{project.repo_name}
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 ml-4">
                      {#if project.id === $currentProject?.id}
                        <span
                          class="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full"
                        >
                          {t.active_project}
                        </span>
                      {/if}
                      {#if project.id !== $currentProject?.id}
                        <button
                          on:click|stopPropagation={() =>
                            handleSelectProject(project)}
                          disabled={isLoading}
                          class="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t.switch_with_reload}
                        >
                          {t.switch_with_reload}
                        </button>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="border-t border-gray-200 pt-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">
          {t.current_project}:
        </h3>
        <div class="space-y-2">
          {#each $allProjects as project}
            <div
              class="flex items-center justify-between p-4 rounded-lg border-2 {project.is_active
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-gray-50'}"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="font-semibold text-gray-800">
                    {project.project_name}
                  </h4>
                  {#if project.is_active}
                    <span
                      class="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full"
                    >
                      {t.active_project}
                    </span>
                  {/if}
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  {project.repo_owner}/{project.repo_name}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  on:click={() => handleRenameProject(project)}
                  disabled={isLoading}
                  class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t.rename_project}
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  on:click={() => handleDeleteProject(project)}
                  disabled={isLoading || $allProjects.length <= 1}
                  class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t.delete_project}
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<AddProjectModal
  bind:isOpen={showAddModal}
  on:create={handleCreateProject}
  on:close={() => (showAddModal = false)}
/>

{#if projectToRename}
  <RenameProjectModal
    bind:isOpen={showRenameModal}
    project={projectToRename}
    on:rename={handleRenameConfirm}
    on:close={() => {
      showRenameModal = false;
      projectToRename = null;
    }}
  />
{/if}

{#if projectToSwitch}
  <SwitchProjectModal
    bind:isOpen={showSwitchModal}
    project={projectToSwitch}
    on:switch={(e) => handleSwitchProject(e.detail.reloadData)}
    on:close={() => {
      showSwitchModal = false;
      projectToSwitch = null;
    }}
  />
{/if}

{#if projectToDelete}
  <DeleteProjectModal
    bind:isOpen={showDeleteModal}
    project={projectToDelete}
    on:delete={handleDeleteConfirm}
    on:close={() => {
      showDeleteModal = false;
      projectToDelete = null;
    }}
  />
{/if}
