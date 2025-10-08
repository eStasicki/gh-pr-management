import { selectedPRs } from "$lib/stores";

export function createPRSelectionHandlers(selectedPRsValue: number[]) {
  function isAllPRsSelected(allUserPRs: any[]): boolean {
    if (allUserPRs.length === 0) return false;

    const allSearchPRNumbers = allUserPRs.map((pr) => pr.number);

    return (
      allSearchPRNumbers.length > 0 &&
      allSearchPRNumbers.every((num) => selectedPRsValue.includes(num))
    );
  }

  function validateSelectedPRs(
    allUserPRs: any[],
    onSelectionChange: (selected: number[]) => void
  ): void {
    if (allUserPRs.length === 0) return;

    const allSearchPRNumbers = allUserPRs.map((pr) => pr.number);
    const validSelectedPRs = selectedPRsValue.filter((prNumber) =>
      allSearchPRNumbers.includes(prNumber)
    );

    if (validSelectedPRs.length !== selectedPRsValue.length) {
      onSelectionChange(validSelectedPRs);
    }
  }

  return {
    isAllPRsSelected,
    validateSelectedPRs,
  };
}

export function createModalHandlers() {
  function openChangeSelectedBaseModal(
    isModalOpen: boolean,
    setIsModalOpen: (value: boolean) => void
  ): boolean {
    const selectedPRsValue = selectedPRs.get();
    if (selectedPRsValue.length > 0) {
      setIsModalOpen(true);
      return true;
    }
    return false;
  }

  function closeChangeSelectedBaseModal(
    setIsModalOpen: (value: boolean) => void
  ): void {
    setIsModalOpen(false);
  }

  return {
    openChangeSelectedBaseModal,
    closeChangeSelectedBaseModal,
  };
}

export function createEventHandlers(
  prListComponent: any,
  loadPRs: (page: number) => void,
  currentPage: number,
  openModal: () => void
) {
  function handleSelectAll(): void {
    prListComponent?.toggleAllPRs();
  }

  function handleRefresh(): void {
    loadPRs(currentPage);
  }

  function handleChangeSelectedBase(): void {
    openModal();
  }

  return {
    handleSelectAll,
    handleRefresh,
    handleChangeSelectedBase,
  };
}
