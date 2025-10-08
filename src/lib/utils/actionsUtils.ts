import { createEventDispatcher } from "svelte";
import { createDropdownHandlers } from "./uiUtils";

export function createActionsHandlers(
  dispatch: ReturnType<typeof createEventDispatcher>
) {
  function handleSelectAll() {
    dispatch("selectAll");
  }

  function handleRefresh() {
    dispatch("refresh");
  }

  function handleChangeSelectedBase() {
    dispatch("changeSelectedBase");
  }

  return {
    handleSelectAll,
    handleRefresh,
    handleChangeSelectedBase,
  };
}

export { createDropdownHandlers };
