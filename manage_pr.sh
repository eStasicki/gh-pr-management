#!/bin/bash

ALL_LABELS=$(gh label list --limit 999 --json name | jq -r '.[].name')

check_label_exists() {
  local label_to_check="$1"
  echo "$ALL_LABELS" | grep -x -q "$label_to_check"
}

remove_label_from_pr() {
  local pr_number="$1"
  local label="$2"
  echo "Usuwam label $label z PR #$pr_number"
  gh pr edit "$pr_number" --remove-label "$label"
}

add_label_to_pr() {
  local pr_number="$1"
  local label="$2"
  echo "Dodaję label $label do PR #$pr_number"
  gh pr edit "$pr_number" --add-label "$label"
}

remove_all_labels_from_pr() {
  local pr_number="$1"
  mapfile -t labels < <(gh pr view "$pr_number" --json labels | jq -r '.labels[].name // empty')
  if [ ${#labels[@]} -eq 0 ]; then
    echo "PR #$pr_number nie ma przypisanych label."
    return
  fi
  for label in "${labels[@]}"; do
    echo "Usuwam label $label z PR #$pr_number"
    gh pr edit "$pr_number" --remove-label "$label"
  done
}

select_label_from_pr() {
  local pr_number="$1"
  mapfile -t labels < <(gh pr view "$pr_number" --json labels | jq -r '.labels[].name // empty')

  if [ ${#labels[@]} -eq 0 ]; then
    echo "PR #$pr_number nie ma przypisanych label." >&2
    return 1
  fi

  echo "Wybierz label do zamiany (lub wybierz 'Anuluj'):" >&2
  PS3="Wybierz numer label do zamiany: "
  select choice in "${labels[@]}" "Anuluj"; do
    if [[ "$REPLY" == "0" ]] || [[ "$REPLY" -eq $(( ${#labels[@]} + 1 )) ]]; then
      echo "Anulowano wybór." >&2
      return 1
    elif [[ "$REPLY" -ge 1 && "$REPLY" -le "${#labels[@]}" ]]; then
      echo "$choice"
      return 0
    else
      echo "Niepoprawny wybór, spróbuj ponownie." >&2
    fi
  done
}

select_label_in_repo() {
  echo "Wybierz nową label do dodania (lub wybierz 'Anuluj'):" >&2
  PS3="Wybierz numer nowej label: "
  local labels=("$@")
  select choice in "${labels[@]}" "Anuluj"; do
    if [[ "$REPLY" == "0" ]] || [[ "$REPLY" -eq $(( ${#labels[@]} + 1 )) ]]; then
      echo "Anulowano wybór nowej label." >&2
      return 1
    elif [[ "$REPLY" -ge 1 && "$REPLY" -le "${#labels[@]}" ]]; then
      echo "$choice"
      return 0
    else
      echo "Niepoprawny wybór, spróbuj ponownie." >&2
    fi
  done
}

remove_unic_labels() {
  local pr_number="$1"
  mapfile -t labels_existing < <(gh pr view "$pr_number" --json labels | jq -r '.labels[].name // empty')
  if [ ${#labels_existing[@]} -eq 0 ]; then
    echo "PR #$pr_number nie ma label."
    return
  fi
  for label in "${labels_existing[@]}"; do
    if [[ "$label" == UNIC_* ]]; then
      remove_label_from_pr "$pr_number" "$label"
    fi
  done
}

check_pr_conflict() {
  local pr_number="$1"
  local result
  result=$(gh pr view "$pr_number" --json mergeable,mergeableState)
  local mergeable=$(echo "$result" | jq -r '.mergeable')
  local state=$(echo "$result" | jq -r '.mergeableState')
  if [[ "$mergeable" == "false" || "$state" == "dirty" ]]; then
    return 0  # konflikt jest
  else
    return 1  # brak konfliktu
  fi
}

DEFAULT_USER="SESA759605"

if [ -n "$DEFAULT_USER" ]; then
  GITHUB_USER="$DEFAULT_USER"
  echo "Używam domyślnego użytkownika GitHub: $GITHUB_USER"
else
  while true; do
    read -p "Podaj swój login GitHub: " GITHUB_USER
    echo "Weryfikacja loginu..."

    gh pr list --author "$GITHUB_USER" --state open --limit 1 &> /dev/null
    if [ $? -eq 0 ]; then
      echo "Login poprawny."
      break
    else
      echo "Błąd weryfikacji loginu. Spróbuj ponownie."
    fi
  done
fi

while true; do
  echo ""
  echo "Wybierz opcję:"
  echo "1. Zmień base-branch wszystkim PR"
  echo "2. Zmień base-branch i usuń/ustaw labeli (zmieniona opcja)"
  echo "3. Zmień base-branch dla wskazanego PR"
  echo "4. Podmień base-branch PR zaczynających się od UNIC/fixversion-* z opcją zmiany labeli"
  echo "5. Zmień base-branch dla wskazanego PR z opcją podmiany label (interaktywnie)"
  echo "7. Usuń wybraną label z wybranego PR i ewentualnie dodaj nową"
  echo "8. Wyświetl listę otwartych PR z konfliktami"
  echo "6. Zakończ"
  echo ""

  read -p "Podaj numer opcji: " opcja

  case $opcja in
    1)
      read -p "Podaj nazwę nowego base branch: " new_base
      PR_LIST=$(gh pr list --author "$GITHUB_USER" --state open --json number -L 100 | jq -r '.[].number')
      for pr in $PR_LIST; do
        echo "Zmieniam PR #$pr na base $new_base"
        gh pr edit "$pr" --base "$new_base"
      done
      ;;
    2)
      read -p "Podaj nazwę nowego base branch: " new_base

      PR_LIST=$(gh pr list --author "$GITHUB_USER" --state open --json number -L 100 | jq -r '.[] | .number')

      # Zmiana base branch
      for pr in $PR_LIST; do
        echo "Zmieniam PR #$pr na base $new_base"
        gh pr edit "$pr" --base "$new_base"
      done

      # Zapytaj o Label do usunięcia
      read -p "Podaj nazwę labeli do usunięcia z wszystkich PR (lub puste jeśli nie chcesz usuwać): " label_to_remove
      if [[ -n "$label_to_remove" ]]; then
        echo "Usuwam labelę $label_to_remove ze wszystkich otwartych PR..."
        for pr in $PR_LIST; do
          gh pr edit "$pr" --remove-label "$label_to_remove" &> /dev/null
        done
      fi

      # Zapytaj o Label do dodania
      read -p "Podaj nazwę labeli do dodania do wszystkich PR (lub puste jeśli nie chcesz dodawać): " label_to_add
      if [[ -n "$label_to_add" ]]; then
        echo "Dodaję labelę $label_to_add do wszystkich otwartych PR..."
        for pr in $PR_LIST; do
          gh pr edit "$pr" --add-label "$label_to_add" &> /dev/null
        done
      fi
      ;;
    3)
      read -p "Podaj numer PR: " pr_number
      read -p "Podaj nowy base branch: " new_base
      echo "Zmieniam PR #$pr_number na base $new_base"
      gh pr edit "$pr_number" --base "$new_base"
      ;;
    4)
      read -p "Podaj nowy base branch, którym zastąpić UNIC/fixversion-* : " new_base
      read -p "Czy chcesz podmienić Label? (t/n): " change_label
      if [[ "$change_label" == [tT] ]]; then
        read -p "Podaj nazwę nowej label: " new_label
        if ! check_label_exists "$new_label"; then
          echo "Label '$new_label' nie istnieje w repozytorium."
          read -p "Czy kontynuować bez dodawania label? (t/n): " answer
          if [[ "$answer" != [tT] ]]; then
            echo "Przerywam działanie skryptu."
            exit 1
          else
            echo "Kontynuuję bez dodawania labeli."
            new_label=""
          fi
        fi
      else
        new_label=""
      fi

      PR_LIST=$(gh pr list --author "$GITHUB_USER" --state open --json number,baseRefName -L 100 | jq -c '.[]')
      for pr in $PR_LIST; do
        number=$(echo "$pr" | jq -r '.number')
        base=$(echo "$pr" | jq -r '.baseRefName')
        if [[ $base == UNIC/fixversion-* ]]; then
          echo "Zmieniam PR #$number z base $base na $new_base"
          gh pr edit "$number" --base "$new_base"

          if [ -n "$new_label" ]; then
            remove_unic_labels "$number"
            add_label_to_pr "$number" "$new_label"
          fi
        fi
      done
      ;;
    5)
      read -p "Podaj numer PR: " pr_number
      read -p "Podaj nowy base branch: " new_base

      read -p "Czy chcesz podmienić labelę? (t/n): " change_label
      if [[ "$change_label" == [tT] ]]; then
        selected_label=$(select_label_from_pr "$pr_number")
        exit_code=$?
        if [ $exit_code -ne 0 ]; then
          echo "Brak wyboru label do podmiany lub anulowano."
          selected_label=""
        fi

        repo_labels=($ALL_LABELS)
        new_label=$(select_label_in_repo "${repo_labels[@]}")
        exit_code=$?
        if [ $exit_code -ne 0 ]; then
          echo "Nie wybrano nowej label do dodania."
          new_label=""
        fi
      else
        selected_label=""
        new_label=""
      fi

      echo "Zmieniam PR #$pr_number na base $new_base"
      gh pr edit "$pr_number" --base "$new_base"

      if [ -n "$selected_label" ] && [ -n "$new_label" ]; then
        echo "Podmieniam labelę z $selected_label na $new_label w PR #$pr_number"
        gh pr edit "$pr_number" --remove-label "$selected_label" --add-label "$new_label"
      elif [ -n "$selected_label" ]; then
        echo "Usuwam labelę $selected_label z PR #$pr_number"
        gh pr edit "$pr_number" --remove-label "$selected_label"
      elif [ -n "$new_label" ]; then
        echo "Dodaję labelę $new_label do PR #$pr_number"
        gh pr edit "$pr_number" --add-label "$new_label"
      fi
      ;;
    7)
      read -p "Podaj numer PR: " pr_num
      read -p "Podaj nazwę labeli do usunięcia (pozostałe pozostaną): " label_to_remove

      if ! check_label_exists "$label_to_remove"; then
        echo "Label '$label_to_remove' nie istnieje w repozytorium. Kończę."
        exit 0
      fi

      echo "Usuwam labelę $label_to_remove z PR #$pr_num"
      gh pr edit "$pr_num" --remove-label "$label_to_remove"

      read -p "Czy chcesz dodać nową labelę do tego PR? (t/n): " add_label_answer
      if [[ "$add_label_answer" == [tT] ]]; then
        read -p "Podaj nazwę nowej labeli do dodania: " new_label
        if [[ -z "$new_label" ]]; then
          echo "Nie podano labeli. Kończę."
          exit 0
        fi
        if ! check_label_exists "$new_label"; then
          echo "Label '$new_label' nie istnieje w repozytorium. Kończę."
          exit 0
        fi
        echo "Dodaję labelę $new_label do PR #$pr_num"
        gh pr edit "$pr_num" --add-label "$new_label"
      else
        echo "Nie dodano labeli. Kończę."
        exit 0
      fi
      ;;
    8)
      echo "Sprawdzam PR z konfliktami..."
      PR_LIST=$(gh pr list --author "$GITHUB_USER" --state open --json number -L 100 | jq -r '.[].number')
      conflict_found=0
      for pr in $PR_LIST; do
        if check_pr_conflict $pr; then
          echo "PR #$pr ma konflikt"
          conflict_found=1
        fi
      done
      if [ $conflict_found -eq 0 ]; then
        echo "Brak PR z konfliktami."
      fi
      ;;
    6)
      echo "Koniec działania skryptu."
      exit 0
      ;;
    *)
      echo "Nieznana opcja"
      ;;
  esac
done
