#!/bin/bash

CONFIG_FILE="$(dirname "$0")/.gh-pr-management-config"
LANGUAGE=""
REPO_SRC=""

load_config() {
  if [ -f "$CONFIG_FILE" ]; then
    LANGUAGE=$(cat "$CONFIG_FILE" | grep "^LANGUAGE=" | cut -d'=' -f2)
    REPO_SRC=$(cat "$CONFIG_FILE" | grep "^REPO_SRC=" | cut -d'=' -f2)
  fi
  
  if [ -z "$LANGUAGE" ]; then
    echo "Select language / Wybierz język:"
    echo "1. Polski"
    echo "2. English"
    read -p "Choose option (1-2): " lang_choice
    
    case $lang_choice in
      1) LANGUAGE="pl" ;;
      2) LANGUAGE="en" ;;
      *) echo "Invalid choice, defaulting to Polish"; LANGUAGE="pl" ;;
    esac
    
    echo "LANGUAGE=$LANGUAGE" >> "$CONFIG_FILE"
  fi
  
  if [ -z "$REPO_SRC" ]; then
    echo "=========================================="
    echo "Repository source path is required!"
    echo "Ścieżka repozytorium jest wymagana!"
    echo "=========================================="
    echo ""
    echo "Please create a configuration file: $CONFIG_FILE"
    echo "Proszę utworzyć plik konfiguracyjny: $CONFIG_FILE"
    echo ""
    echo "Add the following line to the file:"
    echo "Dodaj następującą linię do pliku:"
    echo ""
    echo "REPO_SRC=/path/to/your/repository"
    echo ""
    echo "Example / Przykład:"
    echo "REPO_SRC=/home/user/my-project"
    echo ""
    echo "Or run the script and it will ask for the path:"
    echo "Lub uruchom skrypt a zapyta o ścieżkę:"
    echo ""
    read -p "Enter repository source path now / Podaj ścieżkę repozytorium teraz: " REPO_SRC
    
    if [ -z "$REPO_SRC" ]; then
      echo "Repository source path cannot be empty!"
      echo "Ścieżka repozytorium nie może być pusta!"
      exit 1
    fi
    
    if [ ! -d "$REPO_SRC" ]; then
      echo "Repository path does not exist: $REPO_SRC"
      echo "Ścieżka repozytorium nie istnieje: $REPO_SRC"
      exit 1
    fi
    
    echo "REPO_SRC=$REPO_SRC" > "$CONFIG_FILE"
    echo "Configuration saved to: $CONFIG_FILE"
    echo "Konfiguracja zapisana w: $CONFIG_FILE"
  fi
  
  if [ ! -d "$REPO_SRC" ]; then
    echo "Repository path does not exist: $REPO_SRC"
    echo "Ścieżka repozytorium nie istnieje: $REPO_SRC"
    echo "Please update the configuration file: $CONFIG_FILE"
    echo "Proszę zaktualizować plik konfiguracyjny: $CONFIG_FILE"
    exit 1
  fi
}

translate() {
  local key="$1"
  case $LANGUAGE in
    "en")
      case $key in
        "using_default_user") echo "Using default GitHub user: $2" ;;
        "enter_github_login") echo "Enter your GitHub login: " ;;
        "verifying_login") echo "Verifying login..." ;;
        "login_correct") echo "Login correct." ;;
        "login_verification_error") echo "Login verification error. Try again." ;;
        "select_option") echo "Select option:" ;;
        "change_base_all_pr") echo "Change base-branch for all PRs" ;;
        "change_base_and_labels") echo "Change base-branch and remove/set labels (modified option)" ;;
        "change_base_specific_pr") echo "Change base-branch for specific PR" ;;
        "change_base_unic_pr") echo "Change base-branch for PRs starting with UNIC/fixversion-* with label change option" ;;
        "change_base_interactive") echo "Change base-branch for specific PR with label replacement (interactive)" ;;
        "remove_label_specific") echo "Remove selected label from selected PR and optionally add new one" ;;
        "exit") echo "Exit" ;;
        "enter_option_number") echo "Enter option number: " ;;
        "enter_new_base") echo "Enter new base branch name: " ;;
        "changing_pr") echo "Changing PR #$2 to base $3" ;;
        "enter_pr_number") echo "Enter PR number: " ;;
        "enter_new_base_branch") echo "Enter new base branch: " ;;
        "enter_base_replace_unic") echo "Enter new base branch to replace UNIC/fixversion-*: " ;;
        "want_change_label") echo "Do you want to replace Label? (y/n): " ;;
        "enter_new_label") echo "Enter new label name: " ;;
        "label_not_exists") echo "Label '$2' does not exist in repository." ;;
        "continue_without_label") echo "Continue without adding label? (y/n): " ;;
        "aborting_script") echo "Aborting script." ;;
        "continuing_without_labels") echo "Continuing without adding labels." ;;
        "pr_no_labels") echo "PR #$2 has no labels." ;;
        "removing_label") echo "Removing label $2 from PR #$3" ;;
        "adding_label") echo "Adding label $2 to PR #$3" ;;
        "select_label_to_replace") echo "Select label to replace (or select 'Cancel'):" ;;
        "select_label_number") echo "Select label number to replace: " ;;
        "cancel") echo "Cancel" ;;
        "canceled_selection") echo "Selection canceled." ;;
        "invalid_choice") echo "Invalid choice, try again." ;;
        "select_new_label") echo "Select new label to add (or select 'Cancel'):" ;;
        "select_new_label_number") echo "Select new label number: " ;;
        "canceled_new_label") echo "New label selection canceled." ;;
        "removing_unic_labels") echo "Removing UNIC labels from PR #$2" ;;
        "script_end") echo "Script execution ended." ;;
        "unknown_option") echo "Unknown option" ;;
        "enter_label_to_remove") echo "Enter label name to remove from all PRs (or empty if you don't want to remove): " ;;
        "removing_label_from_all") echo "Removing label $2 from all open PRs..." ;;
        "enter_label_to_add") echo "Enter label name to add to all PRs (or empty if you don't want to add): " ;;
        "adding_label_to_all") echo "Adding label $2 to all open PRs..." ;;
        "want_replace_label") echo "Do you want to replace label? (y/n): " ;;
        "no_label_selected") echo "No label selected for replacement or canceled." ;;
        "no_new_label_selected") echo "No new label selected for addition." ;;
        "replacing_label") echo "Replacing label from $2 to $3 in PR #$4" ;;
        "removing_label_only") echo "Removing label $2 from PR #$3" ;;
        "adding_label_only") echo "Adding label $2 to PR #$3" ;;
        "enter_label_to_remove_specific") echo "Enter label name to remove (others will remain): " ;;
        "label_not_exists_exit") echo "Label '$2' does not exist in repository. Exiting." ;;
        "removing_label_specific") echo "Removing label $2 from PR #$3" ;;
        "want_add_new_label") echo "Do you want to add new label to this PR? (y/n): " ;;
        "enter_new_label_to_add") echo "Enter new label name to add: " ;;
        "no_label_provided") echo "No label provided. Exiting." ;;
        "label_not_exists_exit2") echo "Label '$2' does not exist in repository. Exiting." ;;
        "adding_new_label") echo "Adding label $2 to PR #$3" ;;
        "no_label_added") echo "No label added. Exiting." ;;
        "changing_pr_base") echo "Changing PR #$2 from base $3 to $4" ;;
        "pr_no_labels_short") echo "PR #$2 has no labels." ;;
        "removing_unic_labels_short") echo "Removing UNIC labels from PR #$2" ;;
        "change_language") echo "Change language" ;;
        "language_changed") echo "Language changed to $2" ;;
        "change_repo_path") echo "Change repository path" ;;
        "enter_repo_path") echo "Enter new repository path: " ;;
        "repo_path_changed") echo "Repository path changed to: $2" ;;
        "repo_path_invalid") echo "Invalid repository path: $2" ;;
        *) echo "$key" ;;
      esac
      ;;
    *)
      case $key in
        "using_default_user") echo "Używam domyślnego użytkownika GitHub: $2" ;;
        "enter_github_login") echo "Podaj swój login GitHub: " ;;
        "verifying_login") echo "Weryfikacja loginu..." ;;
        "login_correct") echo "Login poprawny." ;;
        "login_verification_error") echo "Błąd weryfikacji loginu. Spróbuj ponownie." ;;
        "select_option") echo "Wybierz opcję:" ;;
        "change_base_all_pr") echo "Zmień base-branch wszystkim PR" ;;
        "change_base_and_labels") echo "Zmień base-branch i usuń/ustaw labeli (zmieniona opcja)" ;;
        "change_base_specific_pr") echo "Zmień base-branch dla wskazanego PR" ;;
        "change_base_unic_pr") echo "Podmień base-branch PR zaczynających się od UNIC/fixversion-* z opcją zmiany labeli" ;;
        "change_base_interactive") echo "Zmień base-branch dla wskazanego PR z opcją podmiany label (interaktywnie)" ;;
        "remove_label_specific") echo "Usuń wybraną label z wybranego PR i ewentualnie dodaj nową" ;;
        "exit") echo "Zakończ" ;;
        "enter_option_number") echo "Podaj numer opcji: " ;;
        "enter_new_base") echo "Podaj nazwę nowego base branch: " ;;
        "changing_pr") echo "Zmieniam PR #$2 na base $3" ;;
        "enter_pr_number") echo "Podaj numer PR: " ;;
        "enter_new_base_branch") echo "Podaj nowy base branch: " ;;
        "enter_base_replace_unic") echo "Podaj nowy base branch, którym zastąpić UNIC/fixversion-* : " ;;
        "want_change_label") echo "Czy chcesz podmienić Label? (t/n): " ;;
        "enter_new_label") echo "Podaj nazwę nowej label: " ;;
        "label_not_exists") echo "Label '$2' nie istnieje w repozytorium." ;;
        "continue_without_label") echo "Czy kontynuować bez dodawania label? (t/n): " ;;
        "aborting_script") echo "Przerywam działanie skryptu." ;;
        "continuing_without_labels") echo "Kontynuuję bez dodawania labeli." ;;
        "pr_no_labels") echo "PR #$2 nie ma label." ;;
        "removing_label") echo "Usuwam label $2 z PR #$3" ;;
        "adding_label") echo "Dodaję label $2 do PR #$3" ;;
        "select_label_to_replace") echo "Wybierz label do zamiany (lub wybierz 'Anuluj'):" ;;
        "select_label_number") echo "Wybierz numer label do zamiany: " ;;
        "cancel") echo "Anuluj" ;;
        "canceled_selection") echo "Anulowano wybór." ;;
        "invalid_choice") echo "Niepoprawny wybór, spróbuj ponownie." ;;
        "select_new_label") echo "Wybierz nową label do dodania (lub wybierz 'Anuluj'):" ;;
        "select_new_label_number") echo "Wybierz numer nowej label: " ;;
        "canceled_new_label") echo "Anulowano wybór nowej label." ;;
        "removing_unic_labels") echo "Usuwam labeli UNIC z PR #$2" ;;
        "script_end") echo "Koniec działania skryptu." ;;
        "unknown_option") echo "Nieznana opcja" ;;
        "enter_label_to_remove") echo "Podaj nazwę labeli do usunięcia z wszystkich PR (lub puste jeśli nie chcesz usuwać): " ;;
        "removing_label_from_all") echo "Usuwam labelę $2 ze wszystkich otwartych PR..." ;;
        "enter_label_to_add") echo "Podaj nazwę labeli do dodania do wszystkich PR (lub puste jeśli nie chcesz dodawać): " ;;
        "adding_label_to_all") echo "Dodaję labelę $2 do wszystkich otwartych PR..." ;;
        "want_replace_label") echo "Czy chcesz podmienić labelę? (t/n): " ;;
        "no_label_selected") echo "Brak wyboru label do podmiany lub anulowano." ;;
        "no_new_label_selected") echo "Nie wybrano nowej label do dodania." ;;
        "replacing_label") echo "Podmieniam labelę z $2 na $3 w PR #$4" ;;
        "removing_label_only") echo "Usuwam labelę $2 z PR #$3" ;;
        "adding_label_only") echo "Dodaję labelę $2 do PR #$3" ;;
        "enter_label_to_remove_specific") echo "Podaj nazwę labeli do usunięcia (pozostałe pozostaną): " ;;
        "label_not_exists_exit") echo "Label '$2' nie istnieje w repozytorium. Kończę." ;;
        "removing_label_specific") echo "Usuwam labelę $2 z PR #$3" ;;
        "want_add_new_label") echo "Czy chcesz dodać nową labelę do tego PR? (t/n): " ;;
        "enter_new_label_to_add") echo "Podaj nazwę nowej labeli do dodania: " ;;
        "no_label_provided") echo "Nie podano labeli. Kończę." ;;
        "label_not_exists_exit2") echo "Label '$2' nie istnieje w repozytorium. Kończę." ;;
        "adding_new_label") echo "Dodaję labelę $2 do PR #$3" ;;
        "no_label_added") echo "Nie dodano labeli. Kończę." ;;
        "changing_pr_base") echo "Zmieniam PR #$2 z base $3 na $4" ;;
        "pr_no_labels_short") echo "PR #$2 nie ma label." ;;
        "removing_unic_labels_short") echo "Usuwam labeli UNIC z PR #$2" ;;
        "change_language") echo "Zmień język" ;;
        "language_changed") echo "Język zmieniony na $2" ;;
        "change_repo_path") echo "Zmień ścieżkę repozytorium" ;;
        "enter_repo_path") echo "Podaj nową ścieżkę repozytorium: " ;;
        "repo_path_changed") echo "Ścieżka repozytorium zmieniona na: $2" ;;
        "repo_path_invalid") echo "Nieprawidłowa ścieżka repozytorium: $2" ;;
        *) echo "$key" ;;
      esac
      ;;
  esac
}

load_config
ALL_LABELS=$(gh label list --limit 999 --json name | jq -r '.[].name')

check_label_exists() {
  local label_to_check="$1"
  echo "$ALL_LABELS" | grep -x -q "$label_to_check"
}

remove_label_from_pr() {
  local pr_number="$1"
  local label="$2"
  echo "$(translate "removing_label" "$label" "$pr_number")"
  gh pr edit "$pr_number" --remove-label "$label"
}

add_label_to_pr() {
  local pr_number="$1"
  local label="$2"
  echo "$(translate "adding_label" "$label" "$pr_number")"
  gh pr edit "$pr_number" --add-label "$label"
}

remove_all_labels_from_pr() {
  local pr_number="$1"
  mapfile -t labels < <(gh pr view "$pr_number" --json labels | jq -r '.labels[].name // empty')
  if [ ${#labels[@]} -eq 0 ]; then
    echo "$(translate "pr_no_labels" "$pr_number")"
    return
  fi
  for label in "${labels[@]}"; do
    echo "$(translate "removing_label" "$label" "$pr_number")"
    gh pr edit "$pr_number" --remove-label "$label"
  done
}

select_label_from_pr() {
  local pr_number="$1"
  mapfile -t labels < <(gh pr view "$pr_number" --json labels | jq -r '.labels[].name // empty')

  if [ ${#labels[@]} -eq 0 ]; then
    echo "$(translate "pr_no_labels" "$pr_number")" >&2
    return 1
  fi

  echo "$(translate "select_label_to_replace")" >&2
  PS3="$(translate "select_label_number") "
  select choice in "${labels[@]}" "$(translate "cancel")"; do
    if [[ "$REPLY" == "0" ]] || [[ "$REPLY" -eq $(( ${#labels[@]} + 1 )) ]]; then
      echo "$(translate "canceled_selection")" >&2
      return 1
    elif [[ "$REPLY" -ge 1 && "$REPLY" -le "${#labels[@]}" ]]; then
      echo "$choice"
      return 0
    else
      echo "$(translate "invalid_choice")" >&2
    fi
  done
}

select_label_in_repo() {
  echo "$(translate "select_new_label")" >&2
  PS3="$(translate "select_new_label_number") "
  local labels=("$@")
  select choice in "${labels[@]}" "$(translate "cancel")"; do
    if [[ "$REPLY" == "0" ]] || [[ "$REPLY" -eq $(( ${#labels[@]} + 1 )) ]]; then
      echo "$(translate "canceled_new_label")" >&2
      return 1
    elif [[ "$REPLY" -ge 1 && "$REPLY" -le "${#labels[@]}" ]]; then
      echo "$choice"
      return 0
    else
      echo "$(translate "invalid_choice")" >&2
    fi
  done
}

remove_unic_labels() {
  local pr_number="$1"
  mapfile -t labels_existing < <(gh pr view "$pr_number" --json labels | jq -r '.labels[].name // empty')
  if [ ${#labels_existing[@]} -eq 0 ]; then
    echo "$(translate "pr_no_labels_short" "$pr_number")"
    return
  fi
  for label in "${labels_existing[@]}"; do
    if [[ "$label" == UNIC_* ]]; then
      remove_label_from_pr "$pr_number" "$label"
    fi
  done
}


DEFAULT_USER="SESA759605"

if [ -n "$DEFAULT_USER" ]; then
  GITHUB_USER="$DEFAULT_USER"
  echo "$(translate "using_default_user" "$GITHUB_USER")"
else
  while true; do
    read -p "$(translate "enter_github_login")" GITHUB_USER
    echo "$(translate "verifying_login")"

    gh pr list --author "$GITHUB_USER" --state open --limit 1 &> /dev/null
    if [ $? -eq 0 ]; then
      echo "$(translate "login_correct")"
      break
    else
      echo "$(translate "login_verification_error")"
    fi
  done
fi

while true; do
  echo ""
  echo "$(translate "select_option")"
  echo "1. $(translate "change_base_all_pr")"
  echo "2. $(translate "change_base_and_labels")"
  echo "3. $(translate "change_base_specific_pr")"
  echo "4. $(translate "change_base_unic_pr")"
  echo "5. $(translate "change_base_interactive")"
  echo "6. $(translate "remove_label_specific")"
  echo "7. $(translate "change_language")"
  echo "8. $(translate "change_repo_path")"
  echo "9. $(translate "exit")"
  echo ""

  read -p "$(translate "enter_option_number")" opcja

  case $opcja in
    1)
      read -p "$(translate "enter_new_base")" new_base
      PR_LIST=$(gh pr list --author "$GITHUB_USER" --state open --json number -L 100 | jq -r '.[].number')
      for pr in $PR_LIST; do
        echo "$(translate "changing_pr" "$pr" "$new_base")"
        gh pr edit "$pr" --base "$new_base"
      done
      ;;
    2)
      read -p "$(translate "enter_new_base")" new_base

      PR_LIST=$(gh pr list --author "$GITHUB_USER" --state open --json number -L 100 | jq -r '.[] | .number')

      for pr in $PR_LIST; do
        echo "$(translate "changing_pr" "$pr" "$new_base")"
        gh pr edit "$pr" --base "$new_base"
      done

      read -p "$(translate "enter_label_to_remove")" label_to_remove
      if [[ -n "$label_to_remove" ]]; then
        echo "$(translate "removing_label_from_all" "$label_to_remove")"
        for pr in $PR_LIST; do
          gh pr edit "$pr" --remove-label "$label_to_remove" &> /dev/null
        done
      fi

      read -p "$(translate "enter_label_to_add")" label_to_add
      if [[ -n "$label_to_add" ]]; then
        echo "$(translate "adding_label_to_all" "$label_to_add")"
        for pr in $PR_LIST; do
          gh pr edit "$pr" --add-label "$label_to_add" &> /dev/null
        done
      fi
      ;;
    3)
      read -p "$(translate "enter_pr_number")" pr_number
      read -p "$(translate "enter_new_base_branch")" new_base
      echo "$(translate "changing_pr" "$pr_number" "$new_base")"
      gh pr edit "$pr_number" --base "$new_base"
      ;;
    4)
      read -p "$(translate "enter_base_replace_unic")" new_base
      read -p "$(translate "want_change_label")" change_label
      if [[ "$change_label" == [tT] ]]; then
        read -p "$(translate "enter_new_label")" new_label
        if ! check_label_exists "$new_label"; then
          echo "$(translate "label_not_exists" "$new_label")"
          read -p "$(translate "continue_without_label")" answer
          if [[ "$answer" != [tT] ]]; then
            echo "$(translate "aborting_script")"
            exit 1
          else
            echo "$(translate "continuing_without_labels")"
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
          echo "$(translate "changing_pr_base" "$number" "$base" "$new_base")"
          gh pr edit "$number" --base "$new_base"

          if [ -n "$new_label" ]; then
            remove_unic_labels "$number"
            add_label_to_pr "$number" "$new_label"
          fi
        fi
      done
      ;;
    5)
      read -p "$(translate "enter_pr_number")" pr_number
      read -p "$(translate "enter_new_base_branch")" new_base

      read -p "$(translate "want_replace_label")" change_label
      if [[ "$change_label" == [tT] ]]; then
        selected_label=$(select_label_from_pr "$pr_number")
        exit_code=$?
        if [ $exit_code -ne 0 ]; then
          echo "$(translate "no_label_selected")"
          selected_label=""
        fi

        repo_labels=($ALL_LABELS)
        new_label=$(select_label_in_repo "${repo_labels[@]}")
        exit_code=$?
        if [ $exit_code -ne 0 ]; then
          echo "$(translate "no_new_label_selected")"
          new_label=""
        fi
      else
        selected_label=""
        new_label=""
      fi

      echo "$(translate "changing_pr" "$pr_number" "$new_base")"
      gh pr edit "$pr_number" --base "$new_base"

      if [ -n "$selected_label" ] && [ -n "$new_label" ]; then
        echo "$(translate "replacing_label" "$selected_label" "$new_label" "$pr_number")"
        gh pr edit "$pr_number" --remove-label "$selected_label" --add-label "$new_label"
      elif [ -n "$selected_label" ]; then
        echo "$(translate "removing_label_only" "$selected_label" "$pr_number")"
        gh pr edit "$pr_number" --remove-label "$selected_label"
      elif [ -n "$new_label" ]; then
        echo "$(translate "adding_label_only" "$new_label" "$pr_number")"
        gh pr edit "$pr_number" --add-label "$new_label"
      fi
      ;;
    6)
      read -p "$(translate "enter_pr_number")" pr_num
      read -p "$(translate "enter_label_to_remove_specific")" label_to_remove

      if ! check_label_exists "$label_to_remove"; then
        echo "$(translate "label_not_exists_exit" "$label_to_remove")"
        exit 0
      fi

      echo "$(translate "removing_label_specific" "$label_to_remove" "$pr_num")"
      gh pr edit "$pr_num" --remove-label "$label_to_remove"

      read -p "$(translate "want_add_new_label")" add_label_answer
      if [[ "$add_label_answer" == [tT] ]]; then
        read -p "$(translate "enter_new_label_to_add")" new_label
        if [[ -z "$new_label" ]]; then
          echo "$(translate "no_label_provided")"
          exit 0
        fi
        if ! check_label_exists "$new_label"; then
          echo "$(translate "label_not_exists_exit2" "$new_label")"
          exit 0
        fi
        echo "$(translate "adding_new_label" "$new_label" "$pr_num")"
        gh pr edit "$pr_num" --add-label "$new_label"
      else
        echo "$(translate "no_label_added")"
        exit 0
      fi
      ;;
    7)
      echo "Select language / Wybierz język:"
      echo "1. Polski"
      echo "2. English"
      read -p "Choose option (1-2): " lang_choice
      
      case $lang_choice in
        1) 
          LANGUAGE="pl"
          echo "LANGUAGE=pl" > "$CONFIG_FILE"
          echo "$(translate "language_changed" "Polski")"
          ;;
        2) 
          LANGUAGE="en"
          echo "LANGUAGE=en" > "$CONFIG_FILE"
          echo "$(translate "language_changed" "English")"
          ;;
        *) 
          echo "Invalid choice, keeping current language."
          ;;
      esac
      ;;
    8)
      read -p "$(translate "enter_repo_path")" new_repo_path
      
      if [ -z "$new_repo_path" ]; then
        echo "$(translate "repo_path_invalid" "empty path")"
        continue
      fi
      
      if [ ! -d "$new_repo_path" ]; then
        echo "$(translate "repo_path_invalid" "$new_repo_path")"
        continue
      fi
      
      REPO_SRC="$new_repo_path"
      sed -i "s|^REPO_SRC=.*|REPO_SRC=$REPO_SRC|" "$CONFIG_FILE" 2>/dev/null || echo "REPO_SRC=$REPO_SRC" >> "$CONFIG_FILE"
      echo "$(translate "repo_path_changed" "$REPO_SRC")"
      ;;
    9)
      echo "$(translate "script_end")"
      exit 0
      ;;
    *)
      echo "$(translate "unknown_option")"
      ;;
  esac
done
