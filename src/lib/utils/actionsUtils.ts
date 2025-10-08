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

  function handleRemoveLabels() {
    dispatch("removeLabels");
  }

  function handleAddLabels() {
    dispatch("addLabels");
  }

  return {
    handleSelectAll,
    handleRefresh,
    handleChangeSelectedBase,
    handleRemoveLabels,
    handleAddLabels,
  };
}

export { createDropdownHandlers };
