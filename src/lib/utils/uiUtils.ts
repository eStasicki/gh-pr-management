export function createDropdownHandlers() {
  function toggleDropdown(isOpen: boolean): boolean {
    return !isOpen;
  }

  function closeDropdown(): boolean {
    return false;
  }

  function openDropdown(): boolean {
    return true;
  }

  function handleClickOutside(
    event: MouseEvent,
    dropdownElement: HTMLElement
  ): boolean {
    if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
      return false;
    }
    return true;
  }

  return {
    toggleDropdown,
    closeDropdown,
    openDropdown,
    handleClickOutside,
  };
}

export function createModalHandlers() {
  function openModal(): boolean {
    return true;
  }

  function closeModal(): boolean {
    return false;
  }

  function toggleModal(isOpen: boolean): boolean {
    return !isOpen;
  }

  return {
    openModal,
    closeModal,
    toggleModal,
  };
}

export function createToggleHandlers() {
  function toggle(booleanValue: boolean): boolean {
    return !booleanValue;
  }

  function setTrue(): boolean {
    return true;
  }

  function setFalse(): boolean {
    return false;
  }

  return {
    toggle,
    setTrue,
    setFalse,
  };
}

export function createClickOutsideHandler(
  element: HTMLElement,
  isOpen: boolean,
  closeHandler: () => void
) {
  function handleClickOutside(event: MouseEvent) {
    if (!element) {
      return;
    }
    if (element.contains(event.target as Node)) {
      return;
    }
    closeHandler();
  }

  function addEventListener() {
    if (typeof window !== "undefined") {
      document.addEventListener("click", handleClickOutside);
    }
  }

  function removeEventListener() {
    if (typeof window !== "undefined") {
      document.removeEventListener("click", handleClickOutside);
    }
  }

  return {
    handleClickOutside,
    addEventListener,
    removeEventListener,
  };
}

export function createClickOutsideHandlerWithSelector(
  selector: string,
  closeHandler: () => void
) {
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(selector)) {
      closeHandler();
    }
  }

  function addEventListener() {
    if (typeof window !== "undefined") {
      document.addEventListener("click", handleClickOutside);
    }
  }

  function removeEventListener() {
    if (typeof window !== "undefined") {
      document.removeEventListener("click", handleClickOutside);
    }
  }

  return {
    handleClickOutside,
    addEventListener,
    removeEventListener,
  };
}

export function createBackdropClickHandler(closeHandler: () => void) {
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeHandler();
    }
  }

  return {
    handleBackdropClick,
  };
}
