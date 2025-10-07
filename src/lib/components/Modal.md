# Modal Component

Uniwersalny komponent modal do używania w całej aplikacji.

## Props

- `isOpen` (boolean) - czy modal jest otwarty
- `title` (string) - tytuł modala wyświetlany w nagłówku
- `maxWidth` (string, opcjonalny) - maksymalna szerokość modala (domyślnie "max-w-lg")

## Events

- `close` - emitowany gdy modal ma być zamknięty (kliknięcie X, ESC, kliknięcie poza modal)

## Features

- **Zamykanie na ESC** - naciśnij Escape aby zamknąć modal
- **Zamykanie na kliknięcie poza modal** - kliknij poza modal aby go zamknąć
- **Przycisk X** - przycisk zamykania w prawym górnym rogu
- **Responsywny** - dostosowuje się do różnych rozmiarów ekranu
- **Accessibility** - wspiera role ARIA i nawigację klawiaturą

## Przykład użycia

```svelte
<script>
  import Modal from "$lib/components/Modal.svelte";

  let isModalOpen = false;

  function handleClose() {
    isModalOpen = false;
  }
</script>

<Modal
  bind:isOpen={isModalOpen}
  title="Mój Modal"
  maxWidth="max-w-md"
  on:close={handleClose}
>
  <div class="mb-4">
    <p>Treść modala...</p>
  </div>

  <div class="flex gap-3 justify-end">
    <button on:click={handleClose}>Anuluj</button>
    <button on:click={handleConfirm}>Zapisz</button>
  </div>
</Modal>
```

## Dostępne rozmiary maxWidth

- `max-w-sm` - mały modal
- `max-w-md` - średni modal (domyślny dla prostych formularzy)
- `max-w-lg` - duży modal (domyślny)
- `max-w-xl` - bardzo duży modal
- `max-w-2xl` - ekstra duży modal
