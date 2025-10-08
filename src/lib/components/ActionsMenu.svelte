<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { auth } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import SelectAllAction from "./actionsMenu/SelectAllAction.svelte";
  import RefreshAction from "./actionsMenu/RefreshAction.svelte";
  import ChangeSelectedBaseAction from "./actionsMenu/ChangeSelectedBaseAction.svelte";
  import RemoveLabelsAction from "./actionsMenu/RemoveLabelsAction.svelte";
  import AddLabelsAction from "./actionsMenu/AddLabelsAction.svelte";
  import { createActionsHandlers } from "$lib/utils/actionsUtils";
  import {
    createDropdownHandlers,
    createClickOutsideHandler,
  } from "$lib/utils/uiUtils";

  const dispatch = createEventDispatcher();

  let t = translations.pl;
  let actionsDropdown: HTMLElement;
  let actionsDropdownOpen = false;

  $: if (typeof window !== "undefined") {
    t = translations[$language];
  }

  export let allPRsSelected = false;

  const actionsHandlers = createActionsHandlers(dispatch);
  const dropdownHandlers = createDropdownHandlers();
  let clickOutsideHandler: ReturnType<typeof createClickOutsideHandler>;

  onMount(() => {
    // Wait for the element to be available
    const initHandler = () => {
      if (actionsDropdown) {
        clickOutsideHandler = createClickOutsideHandler(
          actionsDropdown,
          actionsDropdownOpen,
          () => {
            actionsDropdownOpen = dropdownHandlers.closeDropdown();
          }
        );
        clickOutsideHandler.addEventListener();
      }
    };

    // Try immediately and also on next tick
    initHandler();
    setTimeout(initHandler, 0);

    return () => {
      if (clickOutsideHandler) {
        clickOutsideHandler.removeEventListener();
      }
    };
  });
</script>

<div class="relative w-full lg:w-auto" bind:this={actionsDropdown}>
  {#if $auth.showConnectionLostModal}
    <div
      class="bg-gray-200 px-4 py-3 rounded-lg animate-pulse w-full lg:w-auto"
    >
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-gray-300 rounded"></div>
        <div class="h-4 bg-gray-300 rounded w-16"></div>
        <div class="w-4 h-4 bg-gray-300 rounded ml-auto"></div>
      </div>
    </div>
  {:else}
    <button
      on:click={() =>
        (actionsDropdownOpen =
          dropdownHandlers.toggleDropdown(actionsDropdownOpen))}
      class="bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-600 flex items-center gap-2 w-full lg:w-auto"
    >
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
        ></path>
      </svg>
      {t.actions}
      <svg
        class="w-4 h-4 transition-transform duration-200 absolute right-4 lg:right-0 lg:relative {actionsDropdownOpen
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
  {/if}

  {#if actionsDropdownOpen}
    <div
      class="absolute right-0 mt-2 w-full lg:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
    >
      <div class="py-1">
        <SelectAllAction
          bind:allPRsSelected
          on:selectAll={() => {
            actionsHandlers.handleSelectAll();
            actionsDropdownOpen = dropdownHandlers.closeDropdown();
          }}
        />
        <RefreshAction
          on:refresh={() => {
            actionsHandlers.handleRefresh();
            actionsDropdownOpen = dropdownHandlers.closeDropdown();
          }}
        />
        <ChangeSelectedBaseAction
          on:changeSelectedBase={() => {
            actionsHandlers.handleChangeSelectedBase();
            actionsDropdownOpen = dropdownHandlers.closeDropdown();
          }}
        />
        <RemoveLabelsAction
          on:removeLabels={() => {
            actionsHandlers.handleRemoveLabels();
            actionsDropdownOpen = dropdownHandlers.closeDropdown();
          }}
        />
        <AddLabelsAction
          on:addLabels={() => {
            actionsHandlers.handleAddLabels();
            actionsDropdownOpen = dropdownHandlers.closeDropdown();
          }}
        />
      </div>
    </div>
  {/if}
</div>
