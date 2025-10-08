export function createEscapeKeyHandler(closeHandler: () => void) {
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeHandler();
    }
  }

  return {
    handleKeydown,
  };
}

export function createArrowKeyHandler(
  items: any[],
  selectedIndex: number,
  onIndexChange: (index: number) => void,
  onSelect?: (item: any) => void
) {
  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        const nextIndex = Math.min(selectedIndex + 1, items.length - 1);
        onIndexChange(nextIndex);
        break;
      case "ArrowUp":
        event.preventDefault();
        const prevIndex = Math.max(selectedIndex - 1, 0);
        onIndexChange(prevIndex);
        break;
      case "Enter":
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length && onSelect) {
          onSelect(items[selectedIndex]);
        }
        break;
    }
  }

  return {
    handleKeydown,
  };
}

export function createSearchKeyHandler(
  onSearch: (term: string) => void,
  debounceMs: number = 300
) {
  let timeoutId: number;

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      onSearch(value);
    }, debounceMs);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      const target = event.target as HTMLInputElement;
      target.value = "";
      onSearch("");
    }
  }

  return {
    handleInput,
    handleKeydown,
  };
}
